export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';

export async function GET(_request: Request, { params }: { params: { documentId: string; versionId: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { allowed } = await checkDocumentAccess(params.documentId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { prisma } = await import('@/lib/prisma');
  const version = await prisma.documentVersion.findFirst({
    where: { id: params.versionId, documentId: params.documentId },
  });
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(version);
}
