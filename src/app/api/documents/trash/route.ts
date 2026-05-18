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
