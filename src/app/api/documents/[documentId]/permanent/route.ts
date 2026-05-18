import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const document = await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { ownerId: true },
    });

    if (!document) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (document.ownerId !== session.user.id) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    // Delete versions and comments first
    await prisma.documentVersion.deleteMany({ where: { documentId: params.documentId } });
    await prisma.comment.deleteMany({ where: { documentId: params.documentId } });
    await prisma.documentCollaborator.deleteMany({ where: { documentId: params.documentId } });
    
    // Then delete the document
    await prisma.document.delete({ where: { id: params.documentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Permanent delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
