export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractTasks, bucketTasks, type InboxTask } from '@/lib/tasks';

/**
 * GET /api/tasks → open (unchecked) tasks across the user's own docs,
 * bucketed as overdue / today / upcoming / nodate. Bounded + $0:
 * latest 150 own docs, content never leaves the existing DB.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');

    const docs = await prisma.document.findMany({
      where: { ownerId: session.user.id, trashed: false },
      select: { id: true, title: true, content: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 150,
    });

    const tasks: InboxTask[] = [];
    for (const doc of docs) {
      if (!doc.content) continue;
      try {
        tasks.push(...extractTasks(doc.content, doc.id, doc.title));
      } catch {
        // Skip docs with unexpected content shape — never fail the inbox.
      }
      if (tasks.length >= 300) break;
    }

    const buckets = bucketTasks(tasks.slice(0, 300));
    const total = tasks.length;

    return NextResponse.json({ buckets, total });
  } catch (error: any) {
    console.error('Tasks inbox error:', error.message);
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }
}
