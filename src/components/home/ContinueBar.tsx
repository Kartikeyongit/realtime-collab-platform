'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { FileText, CalendarDays, CheckSquare, Bell, Plus, ArrowRight } from 'lucide-react';
import { showError } from '@/lib/toast';
import type { Document } from '@/types';

interface DocsResponse {
  documents: Document[];
}

interface TasksResponse {
  buckets: { overdue: unknown[]; today: unknown[] };
}

interface NotificationsResponse {
  notifications: Array<{ documentId: string | null }>;
  unreadCount: number;
}

function SkeletonBar() {
  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 40px' }}>
      <div style={{ height: 92, borderRadius: 16, background: '#f5f5f4', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </section>
  );
}

export function ContinueBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [openingToday, setOpeningToday] = useState(false);

  const { data: docsData, isLoading: docsLoading } = useQuery<DocsResponse>({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const { data } = await axios.get('/api/documents?limit=6');
      return data;
    },
    enabled: !!session,
    staleTime: 30_000,
    retry: false,
  });

  const { data: tasksData } = useQuery<TasksResponse>({
    queryKey: ['home-tasks-due'],
    queryFn: async () => {
      const { data } = await axios.get('/api/tasks');
      return data;
    },
    enabled: !!session,
    staleTime: 60_000,
    retry: false,
  });

  const { data: notifData } = useQuery<NotificationsResponse>({
    queryKey: ['home-unread'],
    queryFn: async () => {
      const { data } = await axios.get('/api/notifications?unread=1');
      return data;
    },
    enabled: !!session,
    staleTime: 30_000,
    retry: false,
  });

  if (!session) return null;
  if (docsLoading) return <SkeletonBar />;

  const documents = docsData?.documents ?? [];

  const openToday = async () => {
    if (openingToday) return;
    setOpeningToday(true);
    try {
      const { data } = await axios.get('/api/documents/daily');
      router.push(`/documents/${data.document.id}`);
    } catch {
      showError("Couldn't open today's note");
    } finally {
      setOpeningToday(false);
    }
  };

  const createDocument = async () => {
    try {
      const { data } = await axios.post('/api/documents', { title: 'Untitled' });
      router.push(`/documents/${data.id}`);
    } catch {
      showError('Failed to create document');
    }
  };

  const replayTour = () => {
    try {
      sessionStorage.setItem('collabdocs-tour-replay', '1');
    } catch {}
    router.push('/dashboard');
  };

  if (documents.length === 0) {
    return (
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 40px' }}>
        <div className="card" style={{ padding: '28px 24px', textAlign: 'center', border: '1.5px solid #e7e5e4' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 6, color: '#1c1917' }}>
            Start your first document
          </h2>
          <p style={{ fontSize: 13, color: '#78716c', marginBottom: 18 }}>
            A blank page, a template, or a quick tour — pick one and go.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={createDocument} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> New Document
            </button>
            <Link href="/templates" className="btn btn-secondary btn-sm">
              Browse templates
            </Link>
            <button onClick={replayTour} className="btn btn-ghost btn-sm">
              Take the tour
            </button>
          </div>
        </div>
      </section>
    );
  }

  const latest = documents[0];
  const dueCount = (tasksData?.buckets?.overdue?.length ?? 0) + (tasksData?.buckets?.today?.length ?? 0);
  const unreadCount = notifData?.unreadCount ?? 0;
  const firstUnreadDoc = notifData?.notifications?.[0]?.documentId ?? null;

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: '#78716c',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
  };

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 40px' }}>
      <div
        className="card"
        style={{
          padding: '20px 22px',
          border: '1.5px solid #fed7aa',
          background: 'linear-gradient(180deg, #fff7ed 0%, #ffffff 85%)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 220px', minWidth: 0 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: '#f97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={20} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#c2410c', textTransform: 'uppercase' }}>
              Continue
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {latest.title || 'Untitled'}
            </div>
            <div style={{ fontSize: 12, color: '#78716c' }}>
              Edited {formatDistanceToNow(new Date(latest.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push(`/documents/${latest.id}`)}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          Open <ArrowRight size={14} />
        </button>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
          <button onClick={openToday} disabled={openingToday} style={chipStyle} title="Open today's journal">
            <CalendarDays size={15} /> Today
          </button>
          <Link href="/tasks" style={chipStyle} title="Open tasks">
            <CheckSquare size={15} /> {dueCount > 0 ? `${dueCount} due` : 'Tasks'}
          </Link>
          <button
            onClick={() => router.push(firstUnreadDoc ? `/documents/${firstUnreadDoc}` : '/dashboard')}
            style={chipStyle}
            title="Open latest unread"
          >
            <Bell size={15} /> {unreadCount > 0 ? `${unreadCount} unread` : 'Caught up'}
          </button>
        </div>
      </div>
    </section>
  );
}
