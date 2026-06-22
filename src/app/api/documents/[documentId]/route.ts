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

  await prisma.document.update({
    where: { id: params.documentId },
    data: { content },
  });

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
