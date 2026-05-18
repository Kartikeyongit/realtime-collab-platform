export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');
  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      collaborators: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });

  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const hasAccess = document.ownerId === session.user.id ||
    document.collaborators.some(c => c.userId === session.user.id);

  if (!hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  return NextResponse.json(document);
}

export async function PUT(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { content, title } = body;

  const { prisma } = await import('@/lib/prisma');

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;

  await prisma.document.update({
    where: { id: params.documentId },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');

  await prisma.document.update({
    where: { id: params.documentId },
    data: { trashed: true },
  });

  return NextResponse.json({ success: true });
}
