export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const PAGE_SIZE = 20;

function shape(n: {
  id: string;
  type: string;
  read: boolean;
  createdAt: Date;
  commentId: string | null;
  actor: { id: string; name: string | null; image: string | null } | null;
  document: { id: string; title: string } | null;
  comment: {
    content: string;
    user: { id: string; name: string | null; image: string | null };
    document: { id: string; title: string };
  } | null;
}) {
  // Legacy rows (pre-rebuild) lack actor/document — resolve via the comment.
  const actor = n.actor ?? n.comment?.user ?? null;
  const document = n.document ?? n.comment?.document ?? null;
  return {
    id: n.id,
    type: n.type || 'comment',
    actor: actor ? { id: actor.id, name: actor.name, image: actor.image } : null,
    documentId: document?.id ?? null,
    documentTitle: document?.title ?? null,
    commentId: n.commentId,
    excerpt: n.comment ? n.comment.content.slice(0, 120) : null,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

/**
 * GET /api/notifications?unread=1&cursor=<id> — newest first, cursor paging.
 * Old rows (no type/actor) read as plain comments.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === '1';
  const cursor = searchParams.get('cursor') || undefined;

  const { prisma } = await import('@/lib/prisma');

  const where: any = { userId: session.user.id };
  if (unreadOnly) where.read = false;

  const rows = await prisma.notification.findMany({
    where,
    include: {
      actor: { select: { id: true, name: true, image: true } },
      document: { select: { id: true, title: true } },
      comment: {
        select: {
          content: true,
          user: { select: { id: true, name: true, image: true } },
          document: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const [unreadCount, total] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    prisma.notification.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    notifications: page.map(shape),
    nextCursor: hasMore ? page[page.length - 1].id : null,
    unreadCount,
    total,
  });
}
