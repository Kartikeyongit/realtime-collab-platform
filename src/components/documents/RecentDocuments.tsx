'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { DocumentCard } from './DocumentCard';
import type { Document } from '@/types';

interface ApiResponse {
  documents: Document[];
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, border: '1.5px solid #e7e5e4', background: '#fff', overflow: 'hidden' }}>
      <div style={{ height: 150, background: '#f5f5f5', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '10px 14px 12px' }}>
        <div style={{ height: 14, width: '70%', background: '#f0f0f0', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 11, width: '40%', background: '#f0f0f0', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

export function RecentDocuments() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const { data } = await axios.get('/api/documents?limit=6');
      return data;
    },
    enabled: !!session,
    staleTime: 30_000,
    retry: false,
  });

  if (!session || isLoading) {
    return (
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ height: 24, width: 180, background: '#f0f0f0', borderRadius: 6, marginBottom: 20, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array.from({ length: isLoading ? 6 : 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </section>
    );
  }

  const documents = data?.documents;
  if (!documents || documents.length === 0) return null;

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 40px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 16, color: '#1c1917' }}>
        Recent Documents
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>
    </section>
  );
}
