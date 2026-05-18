export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, role = 'editor' } = await request.json();
  const { prisma } = await import('@/lib/prisma');

  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: { ownerId: true },
  });

  if (!document || document.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const collaborator = await prisma.documentCollaborator.create({
    data: { documentId: params.documentId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(collaborator, { status: 201 });
}
