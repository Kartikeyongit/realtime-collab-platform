export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** GET /api/ai/index/status → { totalDocs, indexedDocs, totalChunks } */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/prisma');
  const userId = session.user.id;

  const [totalDocs, indexed, totalChunks] = await Promise.all([
    prisma.document.count({
      where: {
        trashed: false,
        OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
      },
    }),
    prisma.$queryRawUnsafe<Array<{ n: string }>>(
      `SELECT COUNT(DISTINCT c."documentId") AS n FROM "DocumentChunk" c ` +
        `JOIN "Document" d ON d.id = c."documentId" ` +
        `WHERE d.trashed = false AND (d."ownerId" = '${userId.replace(/'/g, '')}' ` +
        `OR EXISTS (SELECT 1 FROM "DocumentCollaborator" dc WHERE dc."documentId" = d.id AND dc."userId" = '${userId.replace(/'/g, '')}'))`
    ),
    prisma.$queryRawUnsafe<Array<{ n: string }>>(
      `SELECT COUNT(*) AS n FROM "DocumentChunk" c ` +
        `JOIN "Document" d ON d.id = c."documentId" ` +
        `WHERE d.trashed = false AND (d."ownerId" = '${userId.replace(/'/g, '')}' ` +
        `OR EXISTS (SELECT 1 FROM "DocumentCollaborator" dc WHERE dc."documentId" = d.id AND dc."userId" = '${userId.replace(/'/g, '')}'))`
    ),
  ]);

  return NextResponse.json({
    totalDocs,
    indexedDocs: Number(indexed[0]?.n ?? 0),
    totalChunks: Number(totalChunks[0]?.n ?? 0),
  });
}
