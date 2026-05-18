export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { content } = body;

    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const { prisma } = await import('@/lib/prisma');

    await prisma.document.update({
      where: { id: params.documentId },
      data: { content },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save error:', error.message);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
