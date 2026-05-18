export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// prisma imported lazily

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comments = const { prisma } = await import("@/lib/prisma"); await prisma.comment.findMany({
    where: { documentId: params.documentId, parentId: null },
    include: {
      user: { select: { id: true, name: true, image: true } },
      replies: { include: { user: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, position, parentId } = await request.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const comment = const { prisma } = await import("@/lib/prisma"); await prisma.comment.create({
      data: {
        content: content.trim(),
        documentId: params.documentId,
        userId: session.user.id,
        position: position || {},
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Comment create error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
