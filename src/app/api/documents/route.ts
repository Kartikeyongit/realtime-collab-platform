export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || 'Untitled Document';

    const { prisma } = await import('@/lib/prisma');

    const document = await prisma.document.create({
      data: {
        title,
        ownerId: session.user.id,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start typing...' }] }]
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    console.error('Create document error:', error.message);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');

    const documents = await prisma.document.findMany({
      where: {
        trashed: false,
        OR: [
          { ownerId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, image: true } },
        collaborators: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    console.error('Fetch documents error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
