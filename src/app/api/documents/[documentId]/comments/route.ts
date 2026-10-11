export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { content, parentId, position } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        documentId: params.documentId,
        userId: session.user.id,
        parentId: parentId || null,
        position: position || {},
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Notifications: owner + collaborators, with reply/mention distinction
    // and per-user preferences (all | personal | none + muted docs).
    const { extractMentionedIds, resolveCommentRecipients, loadPrefs } = await import('@/server/notify');

    const document = await prisma.document.findUnique({
      where: { id: params.documentId },
      select: {
        ownerId: true,
        owner: { select: { id: true, name: true } },
        collaborators: { select: { userId: true, user: { select: { id: true, name: true } } } },
      },
    });

    if (document) {
      let parentAuthorId: string | null = null;
      if (comment.parentId) {
        const parent = await prisma.comment.findUnique({
          where: { id: comment.parentId },
          select: { userId: true },
        });
        parentAuthorId = parent?.userId ?? null;
      }

      const candidates = [
        document.owner,
        ...document.collaborators.map((c) => c.user),
      ];
      const mentionedUserIds = extractMentionedIds(comment.content, candidates);

      if (mentionedUserIds.length > 0) {
        await prisma.commentMention.createMany({
          data: mentionedUserIds.map((userId) => ({ commentId: comment.id, userId })),
          skipDuplicates: true,
        });
      }

      const allIds = [document.ownerId, ...document.collaborators.map((c) => c.userId)];
      if (parentAuthorId) allIds.push(parentAuthorId);
      const prefs = await loadPrefs(prisma, [...allIds, ...mentionedUserIds]);

      const recipients = resolveCommentRecipients({
        ownerId: document.ownerId,
        collaboratorIds: document.collaborators.map((c) => c.userId),
        actorId: session.user.id,
        documentId: params.documentId,
        parentAuthorId,
        mentionedUserIds,
        prefs,
      });

      if (recipients.length > 0) {
        await prisma.notification.createMany({
          data: recipients.map((r) => ({
            userId: r.userId,
            commentId: comment.id,
            type: r.kind,
            actorId: session.user.id,
            documentId: params.documentId,
          })),
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error('Comment create error:', error.message);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');

    const comments = await prisma.comment.findMany({
      where: { documentId: params.documentId, parentId: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error('Comment fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
