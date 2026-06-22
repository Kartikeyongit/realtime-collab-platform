export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string; linkId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkDocumentAccess(params.documentId, user.id, 'owner');
  if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  const { prisma } = await import('@/lib/prisma');
  await prisma.shareLink.delete({ where: { id: params.linkId } });

  return NextResponse.json({ success: true });
}
