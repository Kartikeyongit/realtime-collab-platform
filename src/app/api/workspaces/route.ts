export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** GET → owner's workspaces with doc/folder counts. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { prisma } = await import('@/lib/prisma');
  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: { select: { documents: true, folders: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ workspaces });
}

/** POST { name, color? } → create (max 20 per user, $0 guard). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const color = typeof body.color === 'string' && COLOR_RE.test(body.color) ? body.color : '#f97316';

  const { prisma } = await import('@/lib/prisma');
  const count = await prisma.workspace.count({ where: { ownerId: session.user.id } });
  if (count >= 20) return NextResponse.json({ error: 'Workspace limit reached (20)' }, { status: 400 });

  const workspace = await prisma.workspace.create({
    data: { name, color, ownerId: session.user.id },
  });
  return NextResponse.json(workspace, { status: 201 });
}
