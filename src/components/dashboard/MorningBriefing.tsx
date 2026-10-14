'use client';

import { useRouter } from 'next/navigation';
import { Sunrise, FileText, MessageSquare, UserPlus, AtSign, AlarmClock, ArrowRight, X, NotebookPen } from 'lucide-react';
import type { Briefing } from '@/lib/briefing';

function Row({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        border: 'none',
        background: 'white',
        borderRadius: 12,
        padding: '9px 12px',
        cursor: onClick ? 'pointer' : 'default',
        fontSize: 13,
        color: '#44403c',
        textAlign: 'left',
        borderBottom: 'none',
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = '#fafaf9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
    >
      {icon}
      <span style={{ flex: 1 }}>{children}</span>
      {onClick && <ArrowRight size={13} color="#d6d3d1" />}
    </button>
  );
}

/** Once-a-day morning briefing card. Dismiss persists per calendar day. */
export function MorningBriefing({
  briefing,
  onOpenToday,
  onOpenTasks,
  onOpenDoc,
  onDismiss,
}: {
  briefing: Briefing;
  onOpenToday: () => void;
  onOpenTasks: () => void;
  onOpenDoc: (id: string) => void;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const b = briefing;

  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: 12, background: 'linear-gradient(180deg, #fff7ed 0%, #ffffff 90%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Sunrise size={16} color="#ea580c" />
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          {b.greeting} — here&apos;s {b.baselineLabel === 'today' ? 'today so far' : 'what changed'}
        </span>
        <button onClick={onDismiss} title="Dismiss until tomorrow" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex', borderRadius: 6 }}>
          <X size={14} />
        </button>
      </div>

      {!b.hasActivity ? (
        <p style={{ fontSize: 13, color: '#78716c', margin: '4px 0 8px' }}>
          Quiet {b.baselineLabel === 'today' ? 'today' : 'since last time'} — nothing moved. Good day to start something.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
          {b.changedDocs.map((d) => (
            <Row key={d.id} icon={<FileText size={14} color="#78716c" />} onClick={() => onOpenDoc(d.id)}>
              <><strong>{d.title}</strong> was updated</>
            </Row>
          ))}
          {b.mentions.map((n, i) => (
            <Row key={`m-${i}`} icon={<AtSign size={14} color="#f97316" />} onClick={n.documentId ? () => onOpenDoc(n.documentId!) : undefined}>
              <><strong>{n.actorName || 'Someone'}</strong> mentioned you{n.documentTitle ? <> on <strong>{n.documentTitle}</strong></> : ''}</>
            </Row>
          ))}
          {b.comments.map((n, i) => (
            <Row key={`c-${i}`} icon={<MessageSquare size={14} color="#3b82f6" />} onClick={n.documentId ? () => onOpenDoc(n.documentId!) : undefined}>
              <><strong>{n.actorName || 'Someone'}</strong> commented{n.documentTitle ? <> on <strong>{n.documentTitle}</strong></> : ''}</>
            </Row>
          ))}
          {b.shares.map((n, i) => (
            <Row key={`s-${i}`} icon={<UserPlus size={14} color="#22c55e" />} onClick={n.documentId ? () => onOpenDoc(n.documentId!) : undefined}>
              <><strong>{n.actorName || 'Someone'}</strong> shared <strong>{n.documentTitle || 'a document'}</strong> with you</>
            </Row>
          ))}
          {b.overdueCount > 0 && (
            <Row icon={<AlarmClock size={14} color="#dc2626" />} onClick={onOpenTasks}>
              <><strong>{b.overdueCount} overdue task{b.overdueCount === 1 ? '' : 's'}</strong> need{ b.overdueCount === 1 ? 's' : ''} attention</>
            </Row>
          )}
        </div>
      )}

      <button onClick={onOpenToday} className="btn btn-secondary btn-sm" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <NotebookPen size={13} /> Open today&apos;s journal
      </button>
    </div>
  );
}
