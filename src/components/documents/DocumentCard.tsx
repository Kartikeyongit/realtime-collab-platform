'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';
import { DocumentThumbnail } from './DocumentThumbnail';
import type { Document } from '@/types';

export function DocumentCard({ document }: { document: Document }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/documents/${document.id}`)}
      style={{
        borderRadius: 12,
        border: '1.5px solid #e7e5e4',
        background: '#fff',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <DocumentThumbnail content={document.content} />
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1c1917', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {document.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a8a29e' }}>
          <Clock size={11} />
          <span>{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}
