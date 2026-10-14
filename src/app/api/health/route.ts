export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

/**
 * GET /api/health — public liveness + DB probe for the status page.
 * No auth by design (it IS the availability signal). Cheap by design:
 * one SELECT 1 + process stats, nothing more.
 */
export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = rateLimit(`health:${ip}`, 60, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  let db: 'up' | 'down' = 'down';
  let dbMs: number | null = null;
  try {
    const { prisma } = await import('@/lib/prisma');
    const t0 = Date.now();
    await prisma.$queryRawUnsafe('SELECT 1');
    dbMs = Date.now() - t0;
    db = 'up';
  } catch {
    db = 'down';
  }

  return NextResponse.json({
    ok: db === 'up',
    service: 'collabdocs-next',
    commit: process.env.RENDER_GIT_COMMIT || 'local',
    uptimeSec: Math.floor(process.uptime()),
    db,
    dbMs,
    time: new Date().toISOString(),
  });
}
