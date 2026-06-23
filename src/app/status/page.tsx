'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { Footer } from '@/components/landing/Footer';

const services = [
  { name: 'App (Web)', description: 'Next.js frontend and API routes', status: 'Operational' as const },
  { name: 'Socket.IO (Real-time)', description: 'WebSocket connections for live collaboration', status: 'Operational' as const },
  { name: 'Yjs (Collaboration)', description: 'CRDT-based document sync engine', status: 'Operational' as const },
];

export default function StatusPage() {
  const [checkedAt, setCheckedAt] = useState<string>('');

  useEffect(() => {
    setCheckedAt(new Date().toLocaleString());
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <CheckCircle size={22} color="#22c55e" />
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: '#1c1917' }}>System Status</h1>
        </div>
        <p style={{ color: '#78716c', fontSize: 14, marginBottom: checkedAt ? 36 : 36 }}>
          {checkedAt ? `All services operational as of ${checkedAt}.` : 'Checking status...'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {services.map((svc, i) => (
            <AnimatedSection key={i}>
              <div className="card" style={{ padding: 24, border: '1.5px solid #e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: '#1c1917' }}>{svc.name}</h2>
                  <p style={{ fontSize: 13, color: '#78716c', margin: 0 }}>{svc.description}</p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#f0fdf4', color: '#22c55e', fontWeight: 600, fontSize: 12, border: '1px solid #bbf7d0' }}>
                  <CheckCircle size={12} /> {svc.status}
                </span>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#a8a29e', textAlign: 'center', marginTop: 32 }}>
          Last checked: {checkedAt || 'Just now'}
        </p>
      </div>
      <Footer />
    </div>
  );
}
