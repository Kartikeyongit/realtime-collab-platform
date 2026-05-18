export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// prisma imported lazily

export async function PATCH(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be less than 100 characters' },
        { status: 400 }
      );
    }

    // Check if document exists and user has access
    const document = const { prisma } = await import("@/lib/prisma"); await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { 
        id: true, 
        ownerId: true,
        collaborators: {
          select: { userId: true }
        }
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const hasAccess = 
      document.ownerId === session.user.id ||
      document.collaborators.some(c => c.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update the document title
    const updatedDocument = const { prisma } = await import("@/lib/prisma"); await prisma.document.update({
      where: { id: params.documentId },
      data: { title: title.trim() },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error renaming document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
