export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, resetIn } = rateLimit(`create-doc:${ip}`, 30, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || 'Untitled Document';
    const content = body.content || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start typing...' }] }]
    };

    const { prisma } = await import('@/lib/prisma');

    // Optional folder assignment (must belong to requester, $0: no extra service)
    let folderId: string | null = null;
    if (body.folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: body.folderId, ownerId: session.user.id },
        select: { id: true },
      });
      if (folder) folderId = folder.id;
    }

    const document = await prisma.document.create({
      data: {
        title,
        ownerId: session.user.id,
        content,
        folderId,
        isFavorite: !!body.isFavorite,
        isPinned: !!body.isPinned,
      },
    });

    // Optional tags (create on demand, owner-scoped)
    if (Array.isArray(body.tags) && body.tags.length > 0) {
      const raw: string[] = (body.tags as unknown[]).map((t) => String(t).trim().slice(0, 30)).filter(Boolean);
      const names: string[] = Array.from(new Set(raw)).slice(0, 10);
      for (const name of names) {
        const tag = await prisma.tag.upsert({
          where: { ownerId_name: { ownerId: session.user.id as string, name: name as string } },
          update: {},
          create: { name: name as string, ownerId: session.user.id as string },
        });
        await prisma.documentTag.createMany({
          data: [{ documentId: document.id, tagId: tag.id }],
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error('Create document error:', error.message);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const folderId = searchParams.get('folderId') || '';
    const tag = searchParams.get('tag') || '';
    const favorite = searchParams.get('favorite') === '1' || searchParams.get('favorite') === 'true';
    const pinned = searchParams.get('pinned') === '1' || searchParams.get('pinned') === 'true';
    const sort = searchParams.get('sort') || 'updated'; // updated | title | created

    const { prisma } = await import('@/lib/prisma');

    const where: any = {
      trashed: false,
      OR: [
        { ownerId: session.user.id },
        { collaborators: { some: { userId: session.user.id } } },
      ],
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (folderId === 'none') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }
    if (favorite) where.isFavorite = true;
    if (pinned) where.isPinned = true;
    if (tag) {
      where.tags = { some: { tag: { name: tag, ownerId: session.user.id } } };
    }

    const orderBy: any =
      sort === 'title' ? { title: 'asc' }
      : sort === 'title-desc' ? { title: 'desc' }
      : sort === 'created' ? { createdAt: 'desc' }
      : sort === 'oldest' ? { updatedAt: 'asc' }
      : [{ isPinned: 'desc' }, { updatedAt: 'desc' }];

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, image: true } },
          collaborators: { include: { user: { select: { id: true, name: true, image: true } } } },
          folder: { select: { id: true, name: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Fetch documents error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
