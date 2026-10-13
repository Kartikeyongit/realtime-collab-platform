export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';
import { extractDocLinkIds, mentionsTitle } from '@/lib/links';

interface LinkHit {
  id: string;
  title: string;
  updatedAt: string;
}

/**
 * GET /api/documents/[documentId]/backlinks
 * → { linked: [...], mentioned: [...] } across docs the user can access.
 * linked = contains a docLink pill to this doc (rename-proof, ID-based).
 * mentioned = title text appears without a pill (title length ≥ 3 only).
 */
export async function GET(
  _request: Request,
  { params }: { params: { documentId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkDocumentAccess(params.documentId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { prisma } = await import('@/lib/prisma');

  const self = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: { title: true },
  });
  if (!self) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const docs = await prisma.document.findMany({
    where: {
      trashed: false,
      id: { not: params.documentId },
      OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id } } }],
    },
    select: { id: true, title: true, content: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  const linked: LinkHit[] = [];
  const mentioned: LinkHit[] = [];

  for (const doc of docs) {
    if (!doc.content) continue;
    const hasLink = extractDocLinkIds(doc.content).includes(params.documentId);
    const hit: LinkHit = {
      id: doc.id,
      title: doc.title,
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
    };
    if (hasLink) {
      linked.push(hit);
    } else if (mentionsTitle(doc.content, self.title)) {
      mentioned.push(hit);
    }
    if (linked.length + mentioned.length >= 40) break;
  }

  return NextResponse.json({
    linked: linked.slice(0, 20),
    mentioned: mentioned.slice(0, 20),
    totalLinked: linked.length,
    totalMentioned: mentioned.length,
  });
}
