export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { prisma } = await import('@/lib/prisma');

    const document = await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { ownerId: true },
    });

    if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (document.ownerId !== session.user.id) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    await prisma.presence.deleteMany({ where: { documentId: params.documentId } });
    await prisma.shareLink.deleteMany({ where: { documentId: params.documentId } });
    await prisma.comment.deleteMany({ where: { documentId: params.documentId } });
    await prisma.documentCollaborator.deleteMany({ where: { documentId: params.documentId } });
    await prisma.document.delete({ where: { id: params.documentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
