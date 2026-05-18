import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { documentId: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { resolved, content } = await request.json();

  const comment = await prisma.comment.update({
    where: { id: params.commentId },
    data: {
      ...(resolved !== undefined && { resolved }),
      ...(content && { content }),
    },
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

  await prisma.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ success: true });
}
