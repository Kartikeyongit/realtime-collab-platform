'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, AtSign, UserPlus, MessageSquare, Edit, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

interface Notification {
  id: string;
  type: string;
  message: string;
  documentId?: string;
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
    } catch {}
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`/api/notifications/${id}`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const handleClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.documentId) {
      setIsOpen(false);
      router.push(`/documents/${n.documentId}`);
    }
  };

  const unread = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention': return <AtSign size={14} color="#f97316" />;
      case 'invite': return <UserPlus size={14} color="#22c55e" />;
      case 'comment': return <MessageSquare size={14} color="#8b5cf6" />;
      case 'edit': return <Edit size={14} color="#3b82f6" />;
      default: return <Bell size={14} color="#a8a29e" />;
    }
  };

  if (!session) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="btn btn-ghost btn-sm" style={{ position: 'relative', padding: '6px' }}>
        <Bell size={16} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', background: '#ef4444', color: 'white', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{unread}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setIsOpen(false)} />
          <div className="dropdown" style={{ width: '340px', right: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
              {unread > 0 && (
                <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#f97316', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: '360px', overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#a8a29e', fontSize: '13px' }}>No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      gap: '10px',
                      borderBottom: '1px solid #f5f5f4',
                      background: n.read ? 'transparent' : '#fff7ed',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f4'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : '#fff7ed'; }}
                  >
                    <div style={{ marginTop: '2px' }}>{getIcon(n.type)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ marginBottom: '2px' }}>{n.message}</p>
                      <span style={{ fontSize: '11px', color: '#a8a29e' }}>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                    </div>
                    {!n.read && <div style={{ width: '6px', height: '6px', background: '#f97316', borderRadius: '50%', marginTop: '6px', flexShrink: 0 }} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
