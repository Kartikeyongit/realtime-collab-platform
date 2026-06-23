export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    return NextResponse.json({ hasPassword: !!user?.password });
  } catch {
    return NextResponse.json({ hasPassword: false });
  }
}

export async function PATCH(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { rateLimit } = await import('@/lib/rateLimit');
    const { allowed: rlAllowed, remaining, resetIn } = rateLimit(`change-pw:${ip}`, 5, 60000);
    if (!rlAllowed) {
      return NextResponse.json(
        { error: 'Too many attempts', remaining, resetIn: Math.ceil(resetIn / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    const { verifyPassword, hashPassword } = await import('@/lib/password');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (user?.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
      }
      const valid = verifyPassword(currentPassword, user.password);
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    const hashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, isNew: !user?.password });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
