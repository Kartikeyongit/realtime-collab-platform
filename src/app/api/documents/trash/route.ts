export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');

  const documents = await prisma.document.findMany({
    where: { ownerId: session.user.id, trashed: true },
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(documents);
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');

  const trashed = await prisma.document.findMany({
    where: { ownerId: session.user.id, trashed: true },
    select: { id: true },
  });

  const ids = trashed.map(d => d.id);
  if (ids.length === 0) return NextResponse.json({ success: true });

  await prisma.$transaction(async (tx) => {
    await tx.presence.deleteMany({ where: { documentId: { in: ids } } });
    await tx.shareLink.deleteMany({ where: { documentId: { in: ids } } });
    await tx.comment.deleteMany({ where: { documentId: { in: ids } } });
    await tx.documentCollaborator.deleteMany({ where: { documentId: { in: ids } } });
    await tx.document.deleteMany({ where: { id: { in: ids } } });
  });

  return NextResponse.json({ success: true });
}
