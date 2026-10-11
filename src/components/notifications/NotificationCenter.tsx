'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, AtSign, UserPlus, MessageSquare, CornerUpLeft, CheckCheck, Trash2, VolumeX, Settings2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNotifications, type LiveNotification } from '@/hooks/useNotifications';

export interface CenterNotification {
  id: string;
  type: string;
  actor: { id: string; name: string | null; image: string | null } | null;
  documentId: string | null;
  documentTitle: string | null;
  commentId: string | null;
  excerpt: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_META: Record<string, { icon: any; color: string; verb: (actor: string, doc: string) => string }> = {
  reply: {
    icon: CornerUpLeft, color: '#8b5cf6',
    verb: (a, d) => `${a} replied to your comment on “${d}”`,
  },
  mention: {
    icon: AtSign, color: '#f97316',
    verb: (a, d) => `${a} mentioned you on “${d}”`,
  },
  share: {
    icon: UserPlus, color: '#22c55e',
    verb: (a, d) => `${a} shared “${d}” with you`,
  },
  comment: {
    icon: MessageSquare, color: '#3b82f6',
    verb: (a, d) => `${a} commented on “${d}”`,
  },
};

function copyFor(n: Pick<CenterNotification, 'type' | 'actor' | 'documentTitle'>): string {
  const meta = TYPE_META[n.type] ?? TYPE_META.comment;
  return meta.verb(n.actor?.name || 'Someone', n.documentTitle || 'a document');
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<CenterNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [level, setLevel] = useState<string>('all');
  const [mutedDocIds, setMutedDocIds] = useState<string[]>([]);

  // Known doc titles for labeling muted docs (derived, not state).
  const knownTitles: Record<string, string> = {};
  for (const n of notifications) {
    if (n.documentId && n.documentTitle) knownTitles[n.documentId] = n.documentTitle;
  }

  const fetchPage = useCallback(
    async (reset: boolean, cursor?: string | null) => {
      try {
        const params = new URLSearchParams();
        if (unreadOnly) params.set('unread', '1');
        if (!reset && cursor) params.set('cursor', cursor);
        const { data } = await axios.get(`/api/notifications?${params}`);
        setNotifications((prev) => {
          const merged = reset ? [] : [...prev];
          for (const n of data.notifications as CenterNotification[]) {
            if (!merged.some((m) => m.id === n.id)) merged.push(n);
          }
          return merged;
        });
        setNextCursor(data.nextCursor);
        setUnreadCount(data.unreadCount);
      } catch {}
    },
    [unreadOnly]
  );

  useEffect(() => {
    if (!session) return;
    fetchPage(true);
    axios.get('/api/notifications/preferences').then(({ data }) => {
      setLevel(data.level);
      setMutedDocIds(data.mutedDocIds || []);
    }).catch(() => {});
    const interval = setInterval(() => fetchPage(false), 60000);
    return () => clearInterval(interval);
  }, [session, fetchPage]);

  // Reset list when the filter flips.
  useEffect(() => {
    if (session) fetchPage(true);
  }, [unreadOnly, session, fetchPage]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowPrefs(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const openDoc = (n: CenterNotification) => {
    if (!n.documentId) return;
    setIsOpen(false);
    router.push(n.commentId ? `/documents/${n.documentId}?comment=${n.commentId}` : `/documents/${n.documentId}`);
  };

  // Realtime arrivals: dedupe (multi-tab/multi-socket), toast with View action.
  useNotifications((live: LiveNotification) => {
    const mapped: CenterNotification = {
      id: live.id,
      type: live.type,
      actor: { id: '', name: live.actor.name, image: null },
      documentId: live.documentId ?? null,
      documentTitle: live.documentTitle ?? null,
      commentId: live.commentId ?? null,
      excerpt: live.excerpt ?? null,
      read: false,
      createdAt: live.createdAt,
    };
    setNotifications((prev) => (prev.some((m) => m.id === mapped.id) ? prev : [mapped, ...prev]));
    setUnreadCount((c) => c + 1);

    toast.custom(
      (t) => (
        <div
          onClick={() => {
            toast.dismiss(t.id);
            if (!mapped.read) markAsRead(mapped.id);
            openDoc(mapped);
          }}
          style={{
            background: 'white',
            border: '1.5px solid #e7e5e4',
            borderRadius: 14,
            boxShadow: '0 12px 32px rgba(28,25,23,0.16)',
            padding: '10px 12px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            cursor: 'pointer',
            maxWidth: 340,
          }}
        >
          <span style={{ fontSize: 18 }}>{mapped.type === 'mention' ? '📣' : mapped.type === 'share' ? '🤝' : mapped.type === 'reply' ? '↩️' : '💬'}</span>
          <span style={{ flex: 1, fontSize: 13, color: '#292524' }}>{copyFor(mapped)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>View</span>
        </div>
      ),
      { duration: 5000 }
    );

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(copyFor(mapped), { body: mapped.excerpt || undefined });
      } catch {}
    }
  });

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await axios.patch(`/api/notifications/${id}`);
    } catch {}
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await axios.patch('/api/notifications/read-all');
    } catch {}
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await axios.delete(`/api/notifications/${id}`);
    } catch {}
  };

  const muteDoc = async (n: CenterNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.documentId) return;
    const next = [...new Set([...mutedDocIds, n.documentId])];
    setMutedDocIds(next);
    try {
      await axios.patch('/api/notifications/preferences', { mutedDocIds: next });
    } catch {}
  };

  const unmuteDoc = async (docId: string) => {
    const next = mutedDocIds.filter((id) => id !== docId);
    setMutedDocIds(next);
    try {
      await axios.patch('/api/notifications/preferences', { mutedDocIds: next });
    } catch {}
  };

  const setLevelPref = async (next: string) => {
    setLevel(next);
    try {
      await axios.patch('/api/notifications/preferences', { level: next });
    } catch {}
  };

  if (!session) return null;

  const badge = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="btn btn-ghost btn-sm" style={{ position: 'relative', padding: '6px' }} title="Notifications">
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '0px', right: '0px', minWidth: '16px', height: '16px', background: '#ef4444', color: 'white', borderRadius: '9px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, padding: '0 4px' }}>{badge}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => { setIsOpen(false); setShowPrefs(false); }} />
          <div className="dropdown notification-dropdown" style={{ right: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: '1.5px solid #f5f5f4' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Notifications</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} title="Mark all read" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', padding: 5, borderRadius: 8, display: 'flex' }}>
                      <CheckCheck size={15} />
                    </button>
                  )}
                  <button onClick={() => setShowPrefs((s) => !s)} title="Notification settings" style={{ background: showPrefs ? '#fff7ed' : 'none', border: 'none', cursor: 'pointer', color: showPrefs ? '#f97316' : '#78716c', padding: 5, borderRadius: 8, display: 'flex' }}>
                    <Settings2 size={15} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'unread'] as const).map((f) => {
                  const active = (f === 'unread') === unreadOnly;
                  return (
                    <button
                      key={f}
                      onClick={() => setUnreadOnly(f === 'unread')}
                      style={{
                        border: '1.5px solid', borderColor: active ? '#f97316' : '#e7e5e4',
                        background: active ? '#fff7ed' : 'white',
                        color: active ? '#c2410c' : '#78716c',
                        borderRadius: 999, fontSize: 12, fontWeight: 600,
                        padding: '4px 12px', cursor: 'pointer',
                      }}
                    >
                      {f === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {showPrefs && (
              <div style={{ padding: '12px 16px', borderBottom: '1.5px solid #f5f5f4', background: '#fafaf9' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Notify me about</div>
                {([
                  ['all', 'Everything'],
                  ['personal', 'Replies, mentions & shares only'],
                  ['none', 'Nothing'],
                ] as const).map(([v, label]) => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#44403c', padding: '4px 0', cursor: 'pointer' }}>
                    <input type="radio" name="notif-level" checked={level === v} onChange={() => setLevelPref(v)} style={{ accentColor: '#f97316' }} />
                    {label}
                  </label>
                ))}
                {mutedDocIds.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Muted documents</div>
                    {mutedDocIds.map((id) => (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#57534e', padding: '3px 0' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {knownTitles[id] || id.slice(0, 8)}
                        </span>
                        <button onClick={() => unmuteDoc(id)} style={{ border: 'none', background: 'none', color: '#f97316', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Unmute</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ maxHeight: '340px', overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                  <Bell size={26} color="#e7e5e4" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#78716c' }}>
                    {unreadOnly ? 'No unread notifications' : 'You’re all caught up'}
                  </div>
                  <div style={{ fontSize: 12, color: '#a8a29e', marginTop: 2 }}>
                    Comments, replies, mentions and shares will land here.
                  </div>
                </div>
              ) : (
                notifications.map((n) => {
                  const meta = TYPE_META[n.type] ?? TYPE_META.comment;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id);
                        openDoc(n);
                      }}
                      style={{
                        padding: '11px 14px',
                        display: 'flex',
                        gap: '10px',
                        borderBottom: '1px solid #f5f5f4',
                        background: n.read ? 'transparent' : '#fff7ed',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : '#fff7ed'; }}
                    >
                      {n.actor?.image ? (
                        <img src={n.actor.image} alt="" style={{ width: 28, height: 28, borderRadius: 999, flexShrink: 0, marginTop: 1 }} />
                      ) : (
                        <span style={{ width: 28, height: 28, borderRadius: 999, background: '#ffedd5', color: '#c2410c', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          {(n.actor?.name || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#292524', lineHeight: 1.45 }}>{copyFor(n)}</p>
                        {n.excerpt && n.type !== 'share' && (
                          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#78716c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            “{n.excerpt}”
                          </p>
                        )}
                        <span style={{ fontSize: '11px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Icon size={11} color={meta.color} />
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        {!n.read && <div style={{ width: '7px', height: '7px', background: '#f97316', borderRadius: '50%', alignSelf: 'flex-end', marginTop: 5 }} />}
                        <div style={{ display: 'flex', gap: 0, marginTop: 'auto' }}>
                          {n.documentId && (
                            <button onClick={(e) => muteDoc(n, e)} title="Mute this document" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d6d3d1', padding: 4, borderRadius: 6, display: 'flex' }}>
                              <VolumeX size={13} />
                            </button>
                          )}
                          <button onClick={(e) => deleteOne(n.id, e)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d6d3d1', padding: 4, borderRadius: 6, display: 'flex' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {nextCursor && (
              <button
                onClick={() => fetchPage(false, nextCursor)}
                style={{ width: '100%', padding: '10px', border: 'none', borderTop: '1.5px solid #f5f5f4', background: 'white', color: '#f97316', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Load more
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
