export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import OpenAI from 'openai';
import { EMBED_DIMS } from '@/lib/ai/embeddings';

const TOP_K = 8;
const MAX_CONTEXT_CHARS = 6000;

interface Row {
  documentId: string;
  title: string;
  text: string;
  dist: number;
}

/**
 * POST /api/ai/ask { question, embedding: number[384] }
 * Client embeds the question locally; server retrieves top chunks via
 * pgvector (scoped to the user's docs) and asks Groq with them as context.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Stricter bucket than writing aids: each ask spends Groq quota.
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`ai-ask:${session.user.id}:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many questions — try again in ${Math.ceil(rl.resetIn / 1000)}s.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 1000) : '';
    const embedding = body.embedding;
    if (!question) return NextResponse.json({ error: 'Question required' }, { status: 400 });
    if (!Array.isArray(embedding) || embedding.length !== EMBED_DIMS || embedding.some((x) => typeof x !== 'number' || !Number.isFinite(x))) {
      return NextResponse.json({ error: 'Valid 384-dim query embedding required' }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI answering is not configured (missing AI_API_KEY). Indexing still works.' },
        { status: 503 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    const userId = session.user.id.replace(/'/g, '');
    const vec = `[${(embedding as number[]).join(',')}]`;

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT c."documentId", d.title, c.text, (c.embedding <=> '${vec}'::vector)::float AS dist ` +
        `FROM "DocumentChunk" c JOIN "Document" d ON d.id = c."documentId" ` +
        `WHERE d.trashed = false AND c.embedding IS NOT NULL AND (d."ownerId" = '${userId}' ` +
        `OR EXISTS (SELECT 1 FROM "DocumentCollaborator" dc WHERE dc."documentId" = d.id AND dc."userId" = '${userId}')) ` +
        `ORDER BY dist ASC LIMIT ${TOP_K}`
    )) as Row[];

    if (rows.length === 0) {
      return NextResponse.json({ answer: null, citations: [], needsIndex: true });
    }

    // Relevance gate: normalized MiniLM cosine distance lives in [0,2];
    // beyond ~1.0 nothing in the workspace resembles the question.
    const useful = rows.filter((r) => r.dist < 1.0);
    if (useful.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find anything relevant in your indexed documents. Try indexing more docs or rephrasing.",
        citations: [],
        needsIndex: false,
      });
    }

    let context = '';
    for (const r of useful) {
      const block = `[${r.title}]\n${r.text}\n`;
      if ((context + block).length > MAX_CONTEXT_CHARS) break;
      context += block + '\n';
    }

    const client = new OpenAI({ apiKey, baseURL: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1' });
    const model = process.env.AI_MODEL || 'openai/gpt-oss-120b';
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You answer questions using ONLY the provided document excerpts. ' +
            'Be concise. If the excerpts lack the answer, say so plainly. ' +
            'Never invent facts beyond the excerpts.',
        },
        { role: 'user', content: `Excerpts:\n${context}\nQuestion: ${question}` },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const answer = completion.choices[0]?.message?.content?.trim() || 'No answer generated.';
    const seen = new Set<string>();
    const citations = useful
      .filter((r) => (seen.has(r.documentId) ? false : (seen.add(r.documentId), true)))
      .map((r) => ({ documentId: r.documentId, title: r.title }));

    return NextResponse.json({ answer, citations, needsIndex: false });
  } catch (error: any) {
    console.error('AI ask error:', error.message);
    return NextResponse.json({ error: 'Failed to answer' }, { status: 500 });
  }
}
