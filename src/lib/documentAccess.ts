import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function checkDocumentAccess(
  documentId: string,
  userId: string,
  requiredRole?: 'owner' | 'editor'
): Promise<{ allowed: boolean }> {
  const { prisma } = await import('@/lib/prisma');

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true, collaborators: { select: { userId: true, role: true } } },
  });

  if (!document) return { allowed: false };

  if (document.ownerId === userId) return { allowed: true };

  if (requiredRole === 'owner') {
    const cookieStore = cookies();
    const shareToken = cookieStore.get(`share_${documentId}`);
    if (shareToken?.value) {
      const link = await prisma.shareLink.findUnique({
        where: { token: shareToken.value },
        select: { documentId: true, expiresAt: true },
      });
      if (link && link.documentId === documentId && (!link.expiresAt || new Date(link.expiresAt) > new Date())) {
        return { allowed: true };
      }
    }
    return { allowed: false };
  }

  const collaborator = document.collaborators.find(c => c.userId === userId);
  if (collaborator) {
    if (requiredRole === 'editor' && collaborator.role === 'viewer') return { allowed: false };
    return { allowed: true };
  }

  const cookieStore = cookies();
  const shareToken = cookieStore.get(`share_${documentId}`);
  if (shareToken?.value) {
    const link = await prisma.shareLink.findUnique({
      where: { token: shareToken.value },
      select: { documentId: true, expiresAt: true },
    });
    if (link && link.documentId === documentId && (!link.expiresAt || new Date(link.expiresAt) > new Date())) {
      return { allowed: true };
    }
  }

  return { allowed: false };
}

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
