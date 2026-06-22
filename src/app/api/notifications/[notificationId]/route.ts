export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  _request: Request,
  { params }: { params: { notificationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prisma } = await import('@/lib/prisma');

  const notification = await prisma.notification.findUnique({
    where: { id: params.notificationId },
    select: { userId: true },
  });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.notification.update({
    where: { id: params.notificationId },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
