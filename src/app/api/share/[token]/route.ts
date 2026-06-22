export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = body.password as string | undefined;

    const { prisma } = await import('@/lib/prisma');

    const link = await prisma.shareLink.findUnique({
      where: { token: params.token },
      select: {
        id: true,
        documentId: true,
        password: true,
        expiresAt: true,
        document: { select: { title: true, ownerId: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    if (link.password) {
      if (!password) {
        return NextResponse.json({ needsPassword: true, documentTitle: link.document.title }, { status: 200 });
      }
      const { verifyPassword } = await import('@/lib/password');
      if (!verifyPassword(password, link.password)) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
      }
    }

    return NextResponse.json({
      documentId: link.documentId,
      documentTitle: link.document.title,
      expiresAt: link.expiresAt,
    });
  } catch (error) {
    console.error('Share link error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
