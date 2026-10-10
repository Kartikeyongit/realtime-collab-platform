export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const JOURNAL_TAG = 'journal';

function titleFor(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function isDateStr(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && titleFor(s) !== null;
}

function journalSkeleton(title: string) {
  return {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: title }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Top 3 priorities' }] },
      {
        type: 'taskList',
        content: [1, 2, 3].map(() => ({
          type: 'taskItem',
          attrs: { checked: false },
          content: [{ type: 'paragraph' }],
        })),
      },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
      { type: 'paragraph' },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Gratitude' }] },
      {
        type: 'bulletList',
        content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
      },
    ],
  };
}

async function ensureJournalTag(prisma: any, ownerId: string) {
  return prisma.tag.upsert({
    where: { ownerId_name: { ownerId, name: JOURNAL_TAG } },
    update: {},
    create: { name: JOURNAL_TAG, ownerId },
  });
}

/**
 * GET /api/documents/daily?date=YYYY-MM-DD → find-or-create that day's journal.
 * GET /api/documents/daily?from=YYYY-MM-DD&to=YYYY-MM-DD → presence map {date: docId}.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, resetIn } = rateLimit(`daily:${session.user.id}:${ip}`, 30, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    // Week presence mode
    if (from && to) {
      if (!isDateStr(from) || !isDateStr(to)) {
        return NextResponse.json({ error: 'Use YYYY-MM-DD for from/to' }, { status: 400 });
      }
      const titles: string[] = [];
      const dayToTitle = new Map<string, string>();
      const cur = new Date(from + 'T12:00:00');
      const end = new Date(to + 'T12:00:00');
      for (let d = new Date(cur); d <= end; d.setDate(d.getDate() + 1)) {
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const title = titleFor(ds)!;
        titles.push(title);
        dayToTitle.set(title, ds);
      }
      const docs = await prisma.document.findMany({
        where: {
          ownerId: session.user.id,
          trashed: false,
          title: { in: titles },
          tags: { some: { tag: { name: JOURNAL_TAG, ownerId: session.user.id } } },
        },
        select: { id: true, title: true },
      });
      const presence: Record<string, string> = {};
      for (const doc of docs) {
        const ds = dayToTitle.get(doc.title);
        if (ds) presence[ds] = doc.id;
      }
      return NextResponse.json({ presence });
    }

    // Single-day find-or-create mode (default: today, server date)
    const now = new Date();
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const date = searchParams.get('date') || defaultDate;
    if (!isDateStr(date)) {
      return NextResponse.json({ error: 'Use YYYY-MM-DD for date' }, { status: 400 });
    }
    const title = titleFor(date)!;

    const existing = await prisma.document.findFirst({
      where: {
        ownerId: session.user.id,
        trashed: false,
        title,
        tags: { some: { tag: { name: JOURNAL_TAG, ownerId: session.user.id } } },
      },
      select: { id: true, title: true, updatedAt: true },
    });
    if (existing) return NextResponse.json({ document: existing, created: false });

    const tag = await ensureJournalTag(prisma, session.user.id);
    const created = await prisma.document.create({
      data: {
        title,
        ownerId: session.user.id,
        content: journalSkeleton(title),
        tags: { create: [{ tagId: tag.id }] },
      },
      select: { id: true, title: true, updatedAt: true },
    });
    return NextResponse.json({ document: created, created: true }, { status: 201 });
  } catch (error: any) {
    console.error('Daily doc error:', error.message);
    return NextResponse.json({ error: 'Failed to open daily note' }, { status: 500 });
  }
}
