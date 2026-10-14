'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { LayoutTemplate, Sparkles, CheckSquare, Network } from 'lucide-react';
import { AskWorkspace } from '@/components/ai/AskWorkspace';

const tileStyle: React.CSSProperties = {
  padding: '24px 22px',
  textAlign: 'left',
  border: '1.5px solid #e7e5e4',
  textDecoration: 'none',
  display: 'block',
  width: '100%',
  background: '#fff',
  cursor: 'pointer',
  font: 'inherit',
  color: 'inherit',
};

function TileIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 13,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

export function QuickActions() {
  const { data: session } = useSession();
  const [askOpen, setAskOpen] = useState(false);

  if (!session) return null;

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 40px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 16, color: '#1c1917' }}>
        Jump back in
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Link href="/templates" className="card" style={tileStyle}>
          <TileIcon bg="#f5f3ff">
            <LayoutTemplate size={20} color="#8b5cf6" />
          </TileIcon>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Start from a template</div>
          <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.5, margin: 0 }}>
            Meeting notes, journals, plans and more.
          </p>
        </Link>
        <button onClick={() => setAskOpen(true)} className="card" style={tileStyle}>
          <TileIcon bg="#fff7ed">
            <Sparkles size={20} color="#f97316" />
          </TileIcon>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Ask across your notes</div>
          <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.5, margin: 0 }}>
            Cited answers from everything you&apos;ve written.
          </p>
        </button>
        <Link href="/tasks" className="card" style={tileStyle}>
          <TileIcon bg="#eff6ff">
            <CheckSquare size={20} color="#3b82f6" />
          </TileIcon>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Review your tasks</div>
          <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.5, margin: 0 }}>
            Due dates, checkboxes and reminders.
          </p>
        </Link>
        <Link href="/graph" className="card" style={tileStyle}>
          <TileIcon bg="#f0fdf4">
            <Network size={20} color="#22c55e" />
          </TileIcon>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>See connections</div>
          <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.5, margin: 0 }}>
            How your documents link together.
          </p>
        </Link>
      </div>
      <AskWorkspace open={askOpen} onClose={() => setAskOpen(false)} />
    </section>
  );
}
