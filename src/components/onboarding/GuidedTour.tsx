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

/**
 * Spotlight tour overlay. Anchors to [data-tour] targets; any missing
 * target (small screens, hidden elements) degrades to a centered card.
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

  const centered = !rect;
  const tipWidth = 320;
  const tipStyle: React.CSSProperties = centered
    ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
    : step.placement === 'above'
      ? {
        left: Math.max(12, Math.min(rect.left, window.innerWidth - tipWidth - 12)),
        top: Math.max(12, rect.top - 8),
        transform: 'translateY(-100%)',
      }
      : {
        left: Math.max(12, Math.min(rect.left, window.innerWidth - tipWidth - 12)),
        top: Math.min(rect.top + rect.height + 12, window.innerHeight - 12),
      };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }}>
      <div
        onClick={finish}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
      />
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 14,
            boxShadow: '0 0 0 2.5px #f97316, 0 0 0 6px rgba(249,115,22,0.25)',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
          }}
        />
      )}
      <div
        className="card"
        style={{
          position: 'fixed',
          width: `min(${tipWidth}px, calc(100vw - 24px))`,
          padding: '18px 20px',
          animation: 'scaleIn 0.2s ease',
          ...tipStyle,
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
          {!last ? (
            <button className="btn btn-primary btn-sm" onClick={() => setStepIdx((i) => i + 1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Next <ArrowRight size={13} />
            </button>
          ) : step.cta ? (
            <button className="btn btn-primary btn-sm" onClick={createFirstDoc} disabled={creating}>
              {creating ? 'Creating…' : step.cta.label}
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={finish}>Done</button>
          )}
        </div>
        <button onClick={finish} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', fontSize: 12, marginTop: 8, padding: 0 }}>
          Skip tour
        </button>
      </div>
    </div>
  );
}
