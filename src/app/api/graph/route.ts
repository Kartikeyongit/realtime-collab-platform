export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractDocLinkIds } from '@/lib/links';

interface GraphNode {
  id: string;
  title: string;
  folderId: string | null;
  folderName: string | null;
  links: number;
}

/**
 * GET /api/graph → { nodes, edges } across docs the user can access.
 * Edges come from stored docLink IDs (rename-proof). Bounded to 150 docs.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/prisma');
  const userId = session.user.id;

  const docs = await prisma.document.findMany({
    where: {
      trashed: false,
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
    },
    select: {
      id: true,
      title: true,
      content: true,
      folderId: true,
      folder: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 150,
  });

  const ids = new Set(docs.map((d) => d.id));
  const linkCounts = new Map<string, number>();
  const edges: Array<{ from: string; to: string }> = [];
  const seen = new Set<string>();

  for (const doc of docs) {
    if (!doc.content) continue;
    const targets = new Set<string>(extractDocLinkIds(doc.content));
    for (const to of targets) {
      if (!ids.has(to) || to === doc.id) continue;
      const key = `${doc.id}->${to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: doc.id, to });
      linkCounts.set(to, (linkCounts.get(to) ?? 0) + 1);
      linkCounts.set(doc.id, (linkCounts.get(doc.id) ?? 0) + 1);
    }
  }

  const nodes: GraphNode[] = docs.map((d) => ({
    id: d.id,
    title: d.title,
    folderId: d.folderId,
    folderName: d.folder?.name ?? null,
    links: linkCounts.get(d.id) ?? 0,
  }));

  return NextResponse.json({ nodes, edges });
}
