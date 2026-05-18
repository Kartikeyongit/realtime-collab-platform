export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { documentId: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { resolved, content } = await request.json();
  const { prisma } = await import('@/lib/prisma');

  const comment = await prisma.comment.update({
    where: { id: params.commentId },
    data: { ...(resolved !== undefined && { resolved }), ...(content && { content }) },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(comment);
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');
  await prisma.comment.delete({ where: { id: params.commentId } });

  return NextResponse.json({ success: true });
}
