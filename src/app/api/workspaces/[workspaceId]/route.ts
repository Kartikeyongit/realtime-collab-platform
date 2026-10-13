export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

async function owned(workspaceId: string, ownerId: string) {
  const { prisma } = await import('@/lib/prisma');
  return {
    prisma,
    workspace: await prisma.workspace.findFirst({ where: { id: workspaceId, ownerId } }),
  };
}

export async function PATCH(request: Request, { params }: { params: { workspaceId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prisma, workspace } = await owned(params.workspaceId, session.user.id);
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data: { name?: string; color?: string } = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().slice(0, 40);
  if (typeof body.color === 'string' && COLOR_RE.test(body.color)) data.color = body.color;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const updated = await prisma.workspace.update({ where: { id: params.workspaceId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { workspaceId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prisma, workspace } = await owned(params.workspaceId, session.user.id);
  if (!workspace) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Contents survive in "Unsorted" (workspaceId → null), never deleted.
  await prisma.$transaction([
    prisma.document.updateMany({ where: { workspaceId: params.workspaceId }, data: { workspaceId: null } }),
    prisma.folder.updateMany({ where: { workspaceId: params.workspaceId }, data: { workspaceId: null } }),
    prisma.workspace.delete({ where: { id: params.workspaceId } }),
  ]);
  return NextResponse.json({ success: true });
}
