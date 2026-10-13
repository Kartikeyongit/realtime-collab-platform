export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prisma } = await import('@/lib/prisma');
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId') || '';
  const where: any = { ownerId: session.user.id };
  if (workspaceId === 'none') {
    where.workspaceId = null;
  } else if (workspaceId) {
    const ws = await prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId: session.user.id },
      select: { id: true },
    });
    if (!ws) return NextResponse.json({ folders: [] });
    where.workspaceId = workspaceId;
  }
  const folders = await prisma.folder.findMany({
    where,
    include: {
      _count: { select: { documents: true, children: true } },
      workspace: { select: { id: true, name: true, color: true } },
    },
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
  let workspaceId: string | null = null;
  if (body.workspaceId) {
    const ws = await prisma.workspace.findFirst({
      where: { id: body.workspaceId, ownerId: session.user.id },
      select: { id: true },
    });
    if (ws) workspaceId = ws.id;
  }
  const folder = await prisma.folder.create({
    data: { name, ownerId: session.user.id, parentId, workspaceId },
  });
  return NextResponse.json(folder, { status: 201 });
}
