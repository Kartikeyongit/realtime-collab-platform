export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Optional { documentId } narrows to one doc (mark-read-on-view).
  const body = await request.json().catch(() => ({}));
  const where: { userId: string; read: boolean; documentId?: string } = {
    userId: session.user.id,
    read: false,
  };
  if (typeof body.documentId === 'string' && body.documentId) {
    where.documentId = body.documentId;
  }

  const { prisma } = await import('@/lib/prisma');

  const res = await prisma.notification.updateMany({
    where,
    data: { read: true },
  });

  return NextResponse.json({ success: true, marked: res.count });
}
