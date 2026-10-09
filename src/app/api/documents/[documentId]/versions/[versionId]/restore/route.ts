export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';

export async function POST(_request: Request, { params }: { params: { documentId: string; versionId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { allowed } = await checkDocumentAccess(params.documentId, user.id, 'editor');
  if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const { prisma } = await import('@/lib/prisma');
  const version = await prisma.documentVersion.findFirst({
    where: { id: params.versionId, documentId: params.documentId },
  });
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
  const updated = await prisma.document.update({
    where: { id: params.documentId },
    data: { title: version.title, content: version.content ?? undefined },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json(updated);
}
