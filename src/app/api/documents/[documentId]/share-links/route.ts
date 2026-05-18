import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const token = crypto.randomBytes(16).toString('hex');

  const link = await prisma.shareLink.create({
    data: {
      documentId: params.documentId,
      token,
      password: body.password || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
