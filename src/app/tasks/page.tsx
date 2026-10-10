'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CheckSquare, CircleAlert, CalendarDays, CalendarClock, Inbox, BellRing } from 'lucide-react';
import { showError, showSuccess } from '@/lib/toast';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import type { InboxTask, TaskBucket } from '@/lib/tasks';

const GROUPS: Array<{ key: TaskBucket; title: string; icon: any; color: string }> = [
  { key: 'overdue', title: 'Overdue', icon: CircleAlert, color: '#dc2626' },
  { key: 'today', title: 'Due today', icon: CalendarDays, color: '#ea580c' },
  { key: 'upcoming', title: 'Upcoming', icon: CalendarClock, color: '#1d4ed8' },
  { key: 'nodate', title: 'No due date', icon: Inbox, color: '#78716c' },
];

export default function TasksPage() {
  const { status } = useSession();
  const router = useRouter();
  const [buckets, setBuckets] = useState<Record<TaskBucket, InboxTask[]> | null>(null);
  const [total, setTotal] = useState(0);
  const [notifState, setNotifState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const enableReminders = async () => {
    if (!('Notification' in window)) {
      showError('Browser notifications not supported here');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifState(perm);
      if (perm === 'granted') showSuccess('Reminders enabled — we’ll nudge you about overdue tasks');
      else showError('Notification permission denied');
    } catch {
      showError('Could not enable reminders');
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    axios
      .get('/api/tasks')
      .then(({ data }) => {
        setBuckets(data.buckets);
        setTotal(data.total);
      })
      .catch(() => showError('Failed to load tasks'));
  }, [status]);

  if (status === 'loading' || !buckets) return <DashboardSkeleton />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckSquare size={22} color="#f97316" /> Tasks
          {total > 0 && <span style={{ fontSize: 13, color: '#a8a29e', fontWeight: 400 }}>({total} open)</span>}
        </h1>
        <p style={{ color: '#78716c', fontSize: 13, marginTop: 4 }}>
          Every unchecked checkbox across your documents. Add <code style={{ background: '#fff7ed', padding: '1px 6px', borderRadius: 6, color: '#c2410c' }}>@due YYYY-MM-DD</code> inside a task to schedule it.
        </p>
        {notifState !== 'unsupported' && notifState !== 'granted' && (
          <button className="btn btn-secondary btn-sm" onClick={enableReminders} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <BellRing size={14} /> Enable browser reminders
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <CheckSquare size={32} color="#d6d3d1" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#57534e' }}>All clear — no open tasks</p>
          <p style={{ fontSize: 13, color: '#a8a29e' }}>Tick the checkbox button in any document toolbar to add one.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {GROUPS.map(({ key, title, icon: Icon, color }) => {
            const items = buckets[key] || [];
            if (items.length === 0) return null;
            return (
              <section key={key}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon size={14} /> {title} ({items.length})
                </h2>
                <div style={{ display: 'grid', gap: 6 }}>
                  {items.map((task, i) => (
                    <div
                      key={`${task.documentId}-${i}`}
                      onClick={() => router.push(`/documents/${task.documentId}`)}
                      className="card"
                      style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}
                    >
                      <span style={{ width: 16, height: 16, borderRadius: 5, border: '1.5px solid #d6d3d1', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.text}</div>
                        <div style={{ fontSize: 11, color: '#a8a29e' }}>
                          {task.documentTitle}
                          {task.due && <span> · due {task.due}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
