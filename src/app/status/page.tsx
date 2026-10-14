'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, Loader2, XCircle, MoonStar, RotateCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import axios from 'axios';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { Footer } from '@/components/landing/Footer';

type SvcState = 'checking' | 'up' | 'waking' | 'down';

interface Svc {
  key: 'api' | 'socket' | 'yjs';
  name: string;
  description: string;
  state: SvcState;
  ms: number | null;
}

const YJS_URL = process.env.NEXT_PUBLIC_YJS_URL || 'ws://localhost:1234';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const PROBE_TIMEOUT = 6000;

function checkApi(): Promise<{ ok: boolean; ms: number }> {
  const t0 = Date.now();
  return axios
    .get('/api/health', { timeout: PROBE_TIMEOUT })
    .then(({ data }) => ({ ok: data?.ok === true && data?.db === 'up', ms: Date.now() - t0 }))
    .catch(() => ({ ok: false, ms: Date.now() - t0 }));
}

function checkYjs(): Promise<{ ok: boolean; ms: number }> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try {
        ws.close();
      } catch {}
      resolve({ ok, ms: Date.now() - t0 });
    };
    let ws: WebSocket;
    try {
      // No token: the server will close us after the upgrade — but a completed
      // upgrade already proves the service is awake and listening.
      ws = new WebSocket(YJS_URL);
    } catch {
      finish(false);
      return;
    }
    const timer = setTimeout(() => finish(false), PROBE_TIMEOUT);
    ws.onopen = () => {
      clearTimeout(timer);
      finish(true);
    };
    ws.onerror = () => {
      clearTimeout(timer);
      finish(false);
    };
  });
}

function checkSocket(): Promise<{ ok: boolean; ms: number }> {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let done = false;
    let socket: Socket | null = null;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try {
        socket?.disconnect();
      } catch {}
      resolve({ ok, ms: Date.now() - t0 });
    };
    try {
      // Bad token: server drops us right after connect — the connect itself
      // proves the service is awake.
      socket = io(SOCKET_URL, { auth: { token: 'probe' }, timeout: PROBE_TIMEOUT, reconnection: false });
    } catch {
      finish(false);
      return;
    }
    const timer = setTimeout(() => finish(false), PROBE_TIMEOUT);
    socket.on('connect', () => {
      clearTimeout(timer);
      finish(true);
    });
    socket.on('connect_error', () => {
      clearTimeout(timer);
      finish(false);
    });
  });
}

const CHECKS: Record<Svc['key'], () => Promise<{ ok: boolean; ms: number }>> = {
  api: checkApi,
  socket: checkSocket,
  yjs: checkYjs,
};

const META: Array<{ key: Svc['key']; name: string; description: string }> = [
  { key: 'api', name: 'App (Web)', description: 'Next.js frontend, API routes and database' },
  { key: 'socket', name: 'Socket.IO (Real-time)', description: 'Presence, cursors and live notifications' },
  { key: 'yjs', name: 'Yjs (Collaboration)', description: 'CRDT-based document sync engine' },
];

const badge: Record<SvcState, { bg: string; color: string; border: string; label: string }> = {
  checking: { bg: '#fafaf9', color: '#78716c', border: '#e7e5e4', label: 'Checking…' },
  up: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'Operational' },
  waking: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Waking up…' },
  down: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Unreachable' },
};

export default function StatusPage() {
  const [services, setServices] = useState<Svc[]>(() =>
    META.map((m) => ({ ...m, state: 'checking' as SvcState, ms: null }))
  );
  const [checkedAt, setCheckedAt] = useState('');
  const [checking, setChecking] = useState(false);
  const fails = useRef<Record<string, number>>({ api: 0, socket: 0, yjs: 0 });

  const runChecks = useCallback(async () => {
    setChecking(true);
    setServices((prev) => prev.map((s) => ({ ...s, state: 'checking' as SvcState })));
    const results = await Promise.all(
      META.map(async (m) => {
        const r = await CHECKS[m.key]();
        return { key: m.key, ...r };
      })
    );
    setServices((prev) =>
      prev.map((s) => {
        const r = results.find((x) => x.key === s.key)!;
        if (r.ok) {
          fails.current[s.key] = 0;
          return { ...s, state: 'up' as SvcState, ms: r.ms };
        }
        fails.current[s.key] = (fails.current[s.key] || 0) + 1;
        // First failure on free hosting is almost always a sleeping service,
        // not an outage — say so honestly, escalate only if it persists.
        return {
          ...s,
          state: (fails.current[s.key] >= 2 ? 'down' : 'waking') as SvcState,
          ms: null,
        };
      })
    );
    setCheckedAt(new Date().toLocaleString());
    setChecking(false);
  }, []);

  useEffect(() => {
    runChecks();
    const id = setInterval(runChecks, 60000);
    return () => clearInterval(id);
  }, [runChecks]);

  const allUp = services.every((s) => s.state === 'up');

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          {allUp ? (
            <CheckCircle size={22} color="#22c55e" />
          ) : (
            <MoonStar size={22} color="#b45309" />
          )}
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: '#1c1917' }}>
            {allUp ? 'All systems operational' : 'Checking systems…'}
          </h1>
          <button
            onClick={runChecks}
            disabled={checking}
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCw size={13} className={checking ? 'animate-spin' : undefined} /> Check again
          </button>
        </div>
        <p style={{ color: '#78716c', fontSize: 14, marginBottom: 8 }}>
          {checkedAt ? `Last checked ${checkedAt}.` : 'Running live checks…'}
        </p>
        <p style={{ color: '#a8a29e', fontSize: 12, marginBottom: 28, background: '#fafaf9', border: '1.5px solid #f5f5f4', borderRadius: 10, padding: '8px 12px' }}>
          Hosting note: free-tier services sleep when idle. A first visit may take ~30 seconds to wake — that’s normal, not an outage.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {services.map((svc) => {
            const b = badge[svc.state];
            return (
              <AnimatedSection key={svc.key}>
                <div className="card" style={{ padding: 24, border: '1.5px solid #e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: '#1c1917' }}>{svc.name}</h2>
                    <p style={{ fontSize: 13, color: '#78716c', margin: 0 }}>
                      {svc.description}
                      {svc.ms != null && svc.state === 'up' ? ` · ${svc.ms}ms` : ''}
                    </p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: b.bg, color: b.color, fontWeight: 600, fontSize: 12, border: `1px solid ${b.border}` }}>
                    {svc.state === 'checking' ? <Loader2 size={12} className="animate-spin" /> : null}
                    {b.label}
                  </span>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
