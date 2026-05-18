import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const hasAccess = document.ownerId === session.user.id || (document.collaborators.some(c => c.userId === session.user.id) && !document.trashed);

    if (!hasAccess) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Ensure content is proper JSON format
    if (typeof document.content === 'string' || !document.content?.type) {
      document.content = {
        type: 'doc',
        content: [{ type: 'paragraph' }]
      };
    }

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    // Validate content format
    if (content && typeof content === 'string') {
      return NextResponse.json({ error: 'Content must be JSON' }, { status: 400 });
    }

    // When restoring a version, save current content first
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
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const document = await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { ownerId: true },
    });
    if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (document.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    await prisma.document.update({ where: { id: params.documentId }, data: { trashed: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
