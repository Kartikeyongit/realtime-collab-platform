export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkDocumentAccess } from '@/lib/documentAccess';
import { rateLimit } from '@/lib/rateLimit';
import { EMBED_DIMS } from '@/lib/ai/embeddings';
import { v4 as uuidv4 } from 'uuid';

const MAX_CHUNKS = 100;
const MAX_TEXT = 3000;

function cleanVec(v: unknown): string | null {
  if (!Array.isArray(v) || v.length !== EMBED_DIMS) return null;
  const nums: number[] = [];
  for (const x of v) {
    const n = typeof x === 'number' ? x : Number(x);
    if (!Number.isFinite(n)) return null;
    nums.push(n);
  }
  return `[${nums.join(',')}]`;
}

/**
 * POST /api/ai/index { documentId, chunks: [{ index, text, embedding }] }
 * Stores browser-computed embeddings (MiniLM 384-dim). Replaces the doc's
 * chunks wholesale so re-saves never duplicate.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`ai-index:${session.user.id}:${ip}`, 30, 60000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { documentId, chunks } = body;
    if (typeof documentId !== 'string' || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: 'documentId and chunks required' }, { status: 400 });
    }
    if (chunks.length > MAX_CHUNKS) {
      return NextResponse.json({ error: `Max ${MAX_CHUNKS} chunks per request` }, { status: 400 });
    }

    const { allowed } = await checkDocumentAccess(documentId, session.user.id, 'editor');
    if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const rows: Array<{ index: number; text: string; vec: string }> = [];
    let skipped = 0;
    const reasons: string[] = [];
    for (let ci = 0; ci < chunks.length; ci++) {
      const c = chunks[ci];
      const tag = `chunk${ci}`;
      if (typeof c?.index !== 'number' || typeof c?.text !== 'string') {
        skipped++;
        reasons.push(`${tag}: bad-shape(index=${typeof c?.index},text=${typeof c?.text})`);
        continue;
      }
      const text = c.text.slice(0, MAX_TEXT).trim();
      if (!text) {
        skipped++;
        reasons.push(`${tag}: empty-text(len=${c.text.length})`);
        continue;
      }
      const vec = cleanVec(c.embedding);
      if (!vec) {
        const emb: any = c.embedding;
        skipped++;
        reasons.push(
          `${tag}: bad-vec(type=${Array.isArray(emb) ? 'array' : typeof emb},len=${Array.isArray(emb) ? emb.length : 'n/a'})`
        );
        continue;
      }
      rows.push({ index: Math.floor(c.index), text, vec });
    }
    if (rows.length === 0) {
      return NextResponse.json(
        { error: `No usable chunks (all skipped as malformed): ${reasons.slice(0, 5).join('; ')}` },
        { status: 400 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    // Numbers-only vector literals (validated finite above) — safe to inline.
    await prisma.$transaction(async (tx) => {
      await tx.documentChunk.deleteMany({ where: { documentId } });
      for (const r of rows) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "DocumentChunk" (id, "documentId", "chunkIndex", text, embedding, "updatedAt") ` +
            `VALUES ('${uuidv4()}', '${documentId.replace(/'/g, '')}', ${r.index}, ` +
            `'${r.text.replace(/'/g, "''")}', '${r.vec}'::vector, NOW())`
        );
      }
    });

    return NextResponse.json({ indexed: rows.length, skipped });
  } catch (error: any) {
    console.error('AI index error:', error.message);
    return NextResponse.json({ error: 'Failed to store index' }, { status: 500 });
  }
}
