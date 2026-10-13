'use client';

import { useEffect, useRef } from 'react';
import { perfStats } from '@/lib/perf';

/**
 * Diagnostic HUD enabled with ?perf=1. Reads mutation-only counters on a
 * 500ms interval and writes straight to the DOM — zero React re-renders,
 * so measuring never perturbs the thing being measured.
 */
export function PerfHud() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (ref.current) {
        const s = perfStats;
        ref.current.textContent =
          `yjs:${s.updates} saves:${s.saves} skipped:${s.skipped} put:${Math.round(s.lastPutMs)}ms`;
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 9999,
        background: '#1c1917',
        color: '#fafaf9',
        fontSize: 11,
        padding: '4px 8px',
        borderRadius: 8,
        fontFamily: 'monospace',
        pointerEvents: 'none',
      }}
    />
  );
}
