'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { X, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { TOUR_STEPS, markTourDone } from './tourSteps';
import { showError } from '@/lib/toast';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;

/**
 * Spotlight tour overlay.
 * - The dim layer is 4 rectangles AROUND the target (never over it), so the
 *   highlighted element is never blurred or dimmed.
 * - The tip card never combines positioning transforms with the entrance
 *   animation (that conflict caused the first-slide jump).
 */
export function GuidedTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [creating, setCreating] = useState(false);

  const step = TOUR_STEPS[stepIdx];
  const last = stepIdx === TOUR_STEPS.length - 1;

  const measure = useCallback(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      setRect(null);
      return;
    }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // While the tour is open, page-level focus outlines are suppressed entirely
  // (they draw a second sharp ring inside the spotlight). Tour-card controls
  // keep their own outlines via CSS below.
  useEffect(() => {
    document.body.classList.add('tour-open');
    return () => {
      document.body.classList.remove('tour-open');
    };
  }, []);

  // A focused target shows the global :focus-visible outline *inside* the
  // spotlight ring (double-outline clash). Drop focus only when it sits on
  // the highlighted element itself — tour-card keyboard focus is untouched.
  useEffect(() => {
    if (!step.target) return;
    try {
      const el = document.querySelector(step.target) as HTMLElement | null;
      const active = document.activeElement as HTMLElement | null;
      if (el && active && (active === el || el.contains(active))) active.blur();
    } catch {}
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setStepIdx((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStepIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    markTourDone();
    onDone();
  };

  const createFirstDoc = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const { data } = await axios.post('/api/documents', { title: 'My first document' });
      markTourDone();
      router.push(`/documents/${data.id}`);
    } catch {
      showError('Could not create document');
      setCreating(false);
    }
  };

  const dim: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(28,25,23,0.45)',
  };

  const tipWidth = 320;
  const tipPos: React.CSSProperties = !rect
    ? { position: 'relative' }
    : step.placement === 'above'
      ? {
        position: 'absolute',
        left: Math.max(12, Math.min(rect.left, window.innerWidth - tipWidth - 12)),
        bottom: Math.max(12, window.innerHeight - rect.top + 8),
        width: `min(${tipWidth}px, calc(100vw - 24px))`,
      }
      : {
        position: 'absolute',
        left: Math.max(12, Math.min(rect.left, window.innerWidth - tipWidth - 12)),
        top: Math.min(rect.top + rect.height + 12, window.innerHeight - 12),
        width: `min(${tipWidth}px, calc(100vw - 24px))`,
      };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: !rect ? 'flex' : 'block',
        alignItems: !rect ? 'center' : undefined,
        justifyContent: !rect ? 'center' : undefined,
        padding: !rect ? 16 : 0,
      }}
    >
      <style>{`@keyframes tourFade { from { opacity: 0; } to { opacity: 1; } }`}</style>
      {rect ? (
        <>
          <div onClick={finish} style={{ ...dim, left: 0, right: 0, top: 0, height: Math.max(0, rect.top - PAD) }} />
          <div onClick={finish} style={{ ...dim, left: 0, right: 0, top: rect.top + rect.height + PAD, bottom: 0 }} />
          <div
            onClick={finish}
            style={{ ...dim, left: 0, width: Math.max(0, rect.left - PAD), top: Math.max(0, rect.top - PAD), height: rect.height + PAD * 2 }}
          />
          <div
            onClick={finish}
            style={{ ...dim, left: rect.left + rect.width + PAD, right: 0, top: Math.max(0, rect.top - PAD), height: rect.height + PAD * 2 }}
          />
          <div
            style={{
              position: 'absolute',
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              borderRadius: 12,
              border: '2.5px solid #f97316',
              pointerEvents: 'none',
              transition: 'all 0.25s ease',
            }}
          />
        </>
      ) : (
        <div
          onClick={finish}
          style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        />
      )}
      <div
        className="card tour-card"
        style={{
          padding: '18px 20px',
          animation: 'tourFade 0.18s ease',
          ...tipPos,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 30, height: 30, borderRadius: 10, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', flexShrink: 0 }}>
            <Sparkles size={15} />
          </span>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', flex: 1 }}>{step.title}</div>
          <button onClick={finish} title="Skip tour" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex', borderRadius: 6 }}>
            <X size={15} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6, margin: '0 0 14px' }}>{step.body}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
              {TOUR_STEPS.map((s, i) => (
                <span
                  key={s.id}
                  style={{
                    width: i === stepIdx ? 18 : 6,
                    height: 6,
                    borderRadius: 999,
                    background: i === stepIdx ? '#f97316' : '#e7e5e4',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
            {stepIdx > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setStepIdx((i) => i - 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={13} /> Back
              </button>
            )}
            {!last && (
              <button className="btn btn-primary btn-sm" onClick={() => setStepIdx((i) => i + 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Next <ArrowRight size={13} />
              </button>
            )}
          </div>
          {last && (
            step.cta ? (
              <button className="btn btn-primary btn-sm" onClick={createFirstDoc} disabled={creating} style={{ width: '100%', justifyContent: 'center' }}>
                {creating ? 'Creating…' : step.cta.label}
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={finish} style={{ width: '100%', justifyContent: 'center' }}>Done</button>
            )
          )}
        </div>
        <button onClick={finish} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', fontSize: 12, marginTop: 8, padding: 0 }}>
          Skip tour
        </button>
      </div>
    </div>
  );
}
