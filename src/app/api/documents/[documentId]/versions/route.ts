export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';

const MAX_VERSIONS = 20;

export async function GET(_request: Request, { params }: { params: { documentId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { allowed } = await checkDocumentAccess(params.documentId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { prisma } = await import('@/lib/prisma');
  const versions = await prisma.documentVersion.findMany({
    where: { documentId: params.documentId },
    select: { id: true, title: true, createdAt: true, createdBy: true, creator: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: MAX_VERSIONS,
  });
  return NextResponse.json({ versions });
}

export async function POST(request: Request, { params }: { params: { documentId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { allowed } = await checkDocumentAccess(params.documentId, user.id, 'editor');
  if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const { prisma } = await import('@/lib/prisma');
  const doc = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: { title: true, content: true },
  });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const created = await prisma.documentVersion.create({
    data: { documentId: params.documentId, title: doc.title, content: doc.content ?? undefined, createdBy: user.id },
    select: { id: true, title: true, createdAt: true },
  });
  // Prune to MAX_VERSIONS (Neon free guard)
  const excess = await prisma.documentVersion.findMany({
    where: { documentId: params.documentId },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    skip: MAX_VERSIONS,
  });
  if (excess.length > 0) {
    await prisma.documentVersion.deleteMany({ where: { id: { in: excess.map((e) => e.id) } } });
  }
  return NextResponse.json(created, { status: 201 });
}
