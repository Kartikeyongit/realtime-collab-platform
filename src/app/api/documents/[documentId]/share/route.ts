export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, role = 'editor' } = await request.json();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');

  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: { ownerId: true },
  });

  if (!document || document.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const collaborator = await prisma.documentCollaborator.create({
    data: { documentId: params.documentId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  // Notify the added user (skipped when opted out or doc muted).
  try {
    const { resolveShareRecipients, loadPrefs } = await import('@/server/notify');
    const prefs = await loadPrefs(prisma, [user.id]);
    const recipients = resolveShareRecipients({
      addedUserIds: [user.id],
      actorId: session.user.id,
      documentId: params.documentId,
      prefs,
    });
    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((r) => ({
          userId: r.userId,
          type: r.kind,
          actorId: session.user.id,
          documentId: params.documentId,
        })),
      });
    }
  } catch {
    // Sharing must never fail because notifications did.
  }

  return NextResponse.json(collaborator, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { collaboratorId } = await request.json();
  if (!collaboratorId) return NextResponse.json({ error: 'collaboratorId required' }, { status: 400 });

  const { prisma } = await import('@/lib/prisma');

  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: { ownerId: true },
  });

  if (!document || document.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  await prisma.documentCollaborator.delete({
    where: { id: collaboratorId },
  });

  return NextResponse.json({ success: true });
}
