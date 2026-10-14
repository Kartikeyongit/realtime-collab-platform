export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const BATCH = 100;

/**
 * GET /api/backup → one JSON file with everything the user owns:
 * profile (never password hashes), folders, tags, workspaces, and all
 * documents with content, names resolved, collaborators, comments+replies,
 * and version metadata. Binary Yjs state is excluded (content JSON restores).
 * Paginated internally so Neon free never chokes. Heavy op: strict quota.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = rateLimit(`backup:${session.user.id}`, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Backup is rate-limited — try again in a minute.' },
      { status: 429 }
    );
  }

  const { prisma } = await import('@/lib/prisma');
  const userId = session.user.id;

  const [user, folders, tags, workspaces] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, createdAt: true },
    }),
    prisma.folder.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, parentId: true, workspaceId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tag.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.workspace.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, color: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const documents: any[] = [];
  let cursor: string | undefined = undefined;
  for (;;) {
    const batch: Array<{
      id: string;
      title: string;
      content: unknown;
      folderId: string | null;
      workspaceId: string | null;
      isFavorite: boolean;
      isPinned: boolean;
      trashed: boolean;
      createdAt: Date;
      updatedAt: Date;
      folder: { name: string } | null;
      workspace: { name: string; color: string } | null;
      tags: Array<{ tag: { name: string } }>;
      collaborators: Array<{ role: string; user: { email: string; name: string | null } }>;
      comments: Array<{
        id: string;
        content: string;
        resolved: boolean;
        parentId: string | null;
        position: unknown;
        createdAt: Date;
        user: { email: string; name: string | null };
      }>;
      versions: Array<{ title: string; content: unknown; createdAt: Date }>;
    }> = await prisma.document.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        content: true,
        folderId: true,
        workspaceId: true,
        isFavorite: true,
        isPinned: true,
        trashed: true,
        createdAt: true,
        updatedAt: true,
        folder: { select: { name: true } },
        workspace: { select: { name: true, color: true } },
        tags: { select: { tag: { select: { name: true } } } },
        collaborators: {
          select: { role: true, user: { select: { email: true, name: true } } },
        },
        comments: {
          select: {
            id: true,
            content: true,
            resolved: true,
            parentId: true,
            position: true,
            createdAt: true,
            user: { select: { email: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        versions: {
          select: { title: true, content: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
      orderBy: { id: 'asc' },
      take: BATCH,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (batch.length === 0) break;
    for (const d of batch) {
      documents.push({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        comments: d.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
        versions: d.versions.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })),
      });
    }
    if (batch.length < BATCH) break;
    cursor = batch[batch.length - 1].id;
  }

  return NextResponse.json({
    app: 'CollabDocs',
    version: 1,
    exportedAt: new Date().toISOString(),
    user: user
      ? { ...user, createdAt: user.createdAt.toISOString() }
      : null,
    folders: folders.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })),
    tags,
    workspaces: workspaces.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() })),
    documents,
    documentCount: documents.length,
  });
}
