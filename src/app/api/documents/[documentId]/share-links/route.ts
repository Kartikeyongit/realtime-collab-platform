export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { checkDocumentAccess, getAuthUser } from '@/lib/documentAccess';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkDocumentAccess(params.documentId, user.id);
  if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  const { prisma } = await import('@/lib/prisma');
  const links = await prisma.shareLink.findMany({
    where: { documentId: params.documentId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(links);
}

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { allowed } = await checkDocumentAccess(params.documentId, user.id, 'owner');
  if (!allowed) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  const body = await request.json();
  const token = crypto.randomBytes(16).toString('hex');
  const { prisma } = await import('@/lib/prisma');
  const { hashPassword } = await import('@/lib/password');

  // New links default to viewer (read-only public page); editor keeps the
  // legacy full-app behavior. Existing rows default to editor via schema.
  const role = body.role === 'editor' ? 'editor' : 'viewer';

  const link = await prisma.shareLink.create({
    data: {
      documentId: params.documentId,
      token,
      role,
      password: body.password ? hashPassword(body.password) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
