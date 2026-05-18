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
      comments: {
        include: { user: { select: { id: true, name: true, image: true } }, replies: { include: { user: { select: { id: true, name: true, image: true } } } } },
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const content = document.content as any;
  if (typeof content === 'string' || !content?.type) {
    document.content = { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  const hasAccess = document.ownerId === session.user.id ||
    (document.collaborators.some(c => c.userId === session.user.id) && !(document as any).trashed);

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
  const { content } = body;
  const { prisma } = await import('@/lib/prisma');

  if (content) {
    const currentDoc = await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { content: true },
    });

    if (currentDoc?.content && JSON.stringify(content) !== JSON.stringify(currentDoc.content)) {
      const latestVersion = await prisma.documentVersion.findFirst({
        where: { documentId: params.documentId },
        orderBy: { version: 'desc' },
      });

      await prisma.documentVersion.create({
        data: {
          documentId: params.documentId,
          content: currentDoc.content,
          version: (latestVersion?.version || 0) + 1,
          createdBy: session.user.id,
        },
      });
    }
  }

  const updated = await prisma.document.update({
    where: { id: params.documentId },
    data: { content },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');
  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: { ownerId: true },
  });

  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (document.ownerId !== session.user.id) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  await prisma.document.update({ where: { id: params.documentId }, data: { trashed: true } });
  return NextResponse.json({ success: true });
}
