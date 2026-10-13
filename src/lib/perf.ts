/**
 * Editor perf utilities ($0, zero deps).
 * - vectorsEqual: byte-compare Yjs state vectors so saves skip unchanged docs
 *   without a full JSON stringify + PUT.
 * - perfStats: mutation-only counters (no React state) read by the ?perf=1 HUD.
 */

export interface PerfStats {
  /** Yjs doc updates observed (keystrokes, remote ops, restores). */
  updates: number;
  /** REST snapshots actually PUT. */
  saves: number;
  /** Save ticks skipped because the Yjs clock hadn't advanced. */
  skipped: number;
  /** Last PUT round-trip in ms. */
  lastPutMs: number;
}

export const perfStats: PerfStats = {
  updates: 0,
  saves: 0,
  skipped: 0,
  lastPutMs: 0,
};

export function resetPerfStats() {
  perfStats.updates = 0;
  perfStats.saves = 0;
  perfStats.skipped = 0;
  perfStats.lastPutMs = 0;
}

export function vectorsEqual(
  a: Uint8Array | null | undefined,
  b: Uint8Array | null | undefined
): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
