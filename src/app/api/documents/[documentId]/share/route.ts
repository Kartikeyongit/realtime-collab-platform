export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// prisma imported lazily

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role = 'editor' } = await request.json();

    // Check if document exists and user is owner
    const document = const { prisma } = await import("@/lib/prisma"); await prisma.document.findUnique({
      where: { id: params.documentId },
      select: { ownerId: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Only owner can share' }, { status: 403 });
    }

    // Find user by email
    const user = const { prisma } = await import("@/lib/prisma"); await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add collaborator
    const collaborator = const { prisma } = await import("@/lib/prisma"); await prisma.documentCollaborator.create({
      data: {
        documentId: params.documentId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(collaborator, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    const { prisma } = await import("@/lib/prisma"); await prisma.documentCollaborator.deleteMany({
      where: {
        documentId: params.documentId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
