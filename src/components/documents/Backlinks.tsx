'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Link2, FileText, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Hit {
  id: string;
  title: string;
  updatedAt: string;
}

/** Footer card under the editor: who links here + who merely mentions it. */
export function Backlinks({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [linked, setLinked] = useState<Hit[]>([]);
  const [mentioned, setMentioned] = useState<Hit[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setLinked([]);
    setMentioned([]);
    axios
      .get(`/api/documents/${documentId}/backlinks`)
      .then(({ data }) => {
        if (cancelled) return;
        setLinked(data.linked || []);
        setMentioned(data.mentioned || []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (!loaded || (linked.length === 0 && mentioned.length === 0)) return null;

  const row = (h: Hit, icon: React.ReactNode) => (
    <button
      key={h.id}
      onClick={() => router.push(`/documents/${h.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
        padding: '7px 10px', borderRadius: 10, fontSize: 13, color: '#44403c',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#fafaf9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      {icon}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
        {h.title}
      </span>
      <span style={{ fontSize: 11, color: '#a8a29e', flexShrink: 0 }}>
        {formatDistanceToNow(new Date(h.updatedAt), { addSuffix: true })}
      </span>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto my-4" style={{ padding: '0 0 24px' }}>
      <div style={{ background: 'white', border: '1.5px solid #e7e5e4', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: linked.length ? 6 : 0 }}>
          <Link2 size={15} color="#f97316" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            Linked from here ({linked.length})
          </span>
          <span style={{ fontSize: 11, color: '#a8a29e' }}>type [[ to link docs together</span>
        </div>
        {linked.map((h) => row(h, <FileText size={14} color="#78716c" />))}
        {mentioned.length > 0 && (
          <div style={{ marginTop: 8, borderTop: '1px solid #f5f5f4', paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#78716c' }}>
              <AtSign size={12} /> Mentioned in ({mentioned.length})
            </div>
            {mentioned.map((h) => row(h, <FileText size={14} color="#d6d3d1" />))}
          </div>
        )}
      </div>
    </div>
  );
}
