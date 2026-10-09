export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prisma } = await import('@/lib/prisma');
  const tags = await prisma.tag.findMany({
    where: { ownerId: session.user.id },
    include: { _count: { select: { documents: true } } },
    orderBy: { name: 'asc' },
    take: 100,
  });
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 30);
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const { prisma } = await import('@/lib/prisma');
  const tag = await prisma.tag.upsert({
    where: { ownerId_name: { ownerId: session.user.id, name } },
    update: {},
    create: { name, ownerId: session.user.id },
  });
  return NextResponse.json(tag, { status: 201 });
}
