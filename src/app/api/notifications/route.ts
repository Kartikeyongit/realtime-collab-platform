export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/prisma');

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    include: {
      comment: {
        select: {
          id: true,
          content: true,
          user: { select: { name: true } },
          document: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const result = notifications.map(n => ({
    id: n.id,
    type: 'comment' as const,
    message: `${n.comment.user.name || 'Someone'} commented on "${n.comment.document.title}"`,
    documentId: n.comment.document.id,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}
