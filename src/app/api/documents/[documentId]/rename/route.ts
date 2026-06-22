export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';

export async function PATCH(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { allowed } = await checkDocumentAccess(params.documentId, user.id, 'editor');
    if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { title } = await request.json();
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const { prisma } = await import('@/lib/prisma');

    const updated = await prisma.document.update({
      where: { id: params.documentId },
      data: { title: title.trim() },
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
