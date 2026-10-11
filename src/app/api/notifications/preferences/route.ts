export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { NotifyLevel } from '@/server/notify';

const LEVELS: NotifyLevel[] = ['all', 'personal', 'none'];

/** GET → { level, mutedDocIds } (defaults when never set). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');
  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    level: pref?.level ?? 'all',
    mutedDocIds: pref?.mutedDocIds ?? [],
  });
}

/** PATCH { level?, mutedDocIds? } → upserted preference. */
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const data: { level?: NotifyLevel; mutedDocIds?: string[] } = {};
  if (typeof body.level === 'string' && (LEVELS as string[]).includes(body.level)) {
    data.level = body.level;
  }
  if (Array.isArray(body.mutedDocIds)) {
    data.mutedDocIds = body.mutedDocIds
      .filter((x: unknown) => typeof x === 'string')
      .slice(0, 200) as string[];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');
  const pref = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json({ level: pref.level, mutedDocIds: pref.mutedDocIds });
}
