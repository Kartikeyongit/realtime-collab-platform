import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId && documentId) {
      const cookieStore = cookies();
      const shareToken = cookieStore.get(`share_${documentId}`)?.value;
      if (shareToken) {
        const { prisma } = await import('@/lib/prisma');
        const shareLink = await prisma.shareLink.findUnique({
          where: { token: shareToken },
          select: { id: true, documentId: true, expiresAt: true },
        });
        if (shareLink && shareLink.documentId === documentId) {
          if (!shareLink.expiresAt || shareLink.expiresAt > new Date()) {
            userId = `share:${shareLink.id}`;
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.stringify({
      userId,
      exp: Date.now() + 5 * 60 * 1000,
    });
    const b64payload = Buffer.from(payload).toString('base64url');
    const signature = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET!)
      .update(b64payload)
      .digest('base64url');
    const token = `${b64payload}.${signature}`;

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
