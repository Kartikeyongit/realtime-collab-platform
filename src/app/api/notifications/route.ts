import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notifications = [
    {
      id: '1',
      type: 'share',
      message: 'Alex shared "Project Plan" with you',
      documentId: 'doc1',
      read: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: '2',
      type: 'comment',
      message: 'Sarah commented on "Meeting Notes"',
      documentId: 'doc2',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'edit',
      message: 'John edited "Technical Spec"',
      documentId: 'doc3',
      read: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return NextResponse.json(notifications);
}
