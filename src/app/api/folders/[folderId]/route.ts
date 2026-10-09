export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { folderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { prisma } = await import('@/lib/prisma');
  const existing = await prisma.folder.findFirst({
    where: { id: params.folderId, ownerId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const data: any = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 60);
  if (body.parentId === null) data.parentId = null;
  else if (typeof body.parentId === 'string' && body.parentId !== params.folderId) {
    const parent = await prisma.folder.findFirst({
      where: { id: body.parentId, ownerId: session.user.id },
      select: { id: true },
    });
    if (parent) data.parentId = parent.id;
  }
  const updated = await prisma.folder.update({ where: { id: params.folderId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { folderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prisma } = await import('@/lib/prisma');
  const existing = await prisma.folder.findFirst({
    where: { id: params.folderId, ownerId: session.user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.$transaction([
    prisma.document.updateMany({ where: { folderId: params.folderId }, data: { folderId: null } }),
    prisma.folder.delete({ where: { id: params.folderId } }),
  ]);
  return NextResponse.json({ success: true });
}
