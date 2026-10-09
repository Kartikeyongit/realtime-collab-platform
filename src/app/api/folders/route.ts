export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prisma } = await import('@/lib/prisma');
  const folders = await prisma.folder.findMany({
    where: { ownerId: session.user.id },
    include: { _count: { select: { documents: true, children: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 60);
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const { prisma } = await import('@/lib/prisma');
  let parentId: string | null = null;
  if (body.parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: body.parentId, ownerId: session.user.id },
      select: { id: true },
    });
    if (parent) parentId = parent.id;
  }
  const folder = await prisma.folder.create({
    data: { name, ownerId: session.user.id, parentId },
  });
  return NextResponse.json(folder, { status: 201 });
}
