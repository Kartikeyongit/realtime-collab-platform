export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check access first before fetching full document
  const { allowed } = await checkDocumentAccess(params.documentId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { prisma } = await import('@/lib/prisma');

  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      collaborators: { include: { user: { select: { id: true, name: true, image: true } } } },
      folder: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      comments: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        where: { parentId: null },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(document);
}

export async function PUT(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { rateLimit } = await import('@/lib/rateLimit');
  const { allowed: rlAllowed, resetIn } = rateLimit(`save-doc:${params.documentId}:${ip}`, 60, 60000);
  if (!rlAllowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
    );
  }

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkDocumentAccess(params.documentId, user.id, 'editor');
  if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  const body = await request.json();
  const { content } = body;

  const { prisma } = await import('@/lib/prisma');

  const data: any = {};
  if (content !== undefined) data.content = content;
  if (typeof body.isFavorite === 'boolean') data.isFavorite = body.isFavorite;
  if (typeof body.isPinned === 'boolean') data.isPinned = body.isPinned;
  if (body.folderId === null) data.folderId = null;
  else if (typeof body.folderId === 'string' && body.folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: body.folderId, ownerId: user.id },
      select: { id: true },
    });
    if (folder) data.folderId = folder.id;
  }

  if (Object.keys(data).length > 0) {
    await prisma.document.update({
      where: { id: params.documentId },
      data,
    });
  }

  // Tags replace (owner-scoped, max 10)
  if (Array.isArray(body.tags)) {
    const names = [...new Set(body.tags.map((t: string) => String(t).trim().slice(0, 30)).filter(Boolean))].slice(0, 10) as string[];
    await prisma.documentTag.deleteMany({ where: { documentId: params.documentId } });
    for (const name of names) {
      const tag = await prisma.tag.upsert({
        where: { ownerId_name: { ownerId: user.id, name } },
        update: {},
        create: { name, ownerId: user.id },
      });
      await prisma.documentTag.createMany({ data: [{ documentId: params.documentId, tagId: tag.id }], skipDuplicates: true });
    }
  }

  // Bounded auto-version on content saves: at most 1 per 10 min, max 20 kept.
  // Runs in Next (not Yjs server) so it survives Render free sleep. $0: Postgres only.
  if (content !== undefined && !body.skipVersion) {
    try {
      const latest = await prisma.documentVersion.findFirst({
        where: { documentId: params.documentId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      const stale = !latest || Date.now() - new Date(latest.createdAt).getTime() > 10 * 60 * 1000;
      if (stale) {
        const current = await prisma.document.findUnique({
          where: { id: params.documentId },
          select: { title: true, content: true },
        });
        if (current) {
          await prisma.documentVersion.create({
            data: { documentId: params.documentId, title: current.title, content: current.content ?? undefined, createdBy: user.id },
          });
          const excess = await prisma.documentVersion.findMany({
            where: { documentId: params.documentId },
            select: { id: true },
            orderBy: { createdAt: 'desc' },
            skip: 20,
          });
          if (excess.length > 0) await prisma.documentVersion.deleteMany({ where: { id: { in: excess.map((e) => e.id) } } });
        }
      }
    } catch {
      // Versioning must never break saves
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkDocumentAccess(params.documentId, user.id, 'editor');
  if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  const { prisma } = await import('@/lib/prisma');

  await prisma.document.update({
    where: { id: params.documentId },
    data: { trashed: true },
  });

  return NextResponse.json({ success: true });
}
