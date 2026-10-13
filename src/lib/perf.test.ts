import { describe, it, expect } from 'vitest';
import { vectorsEqual, perfStats, resetPerfStats } from './perf';

describe('vectorsEqual', () => {
  it('compares byte-wise', () => {
    expect(vectorsEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(vectorsEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    expect(vectorsEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
    expect(vectorsEqual(null, new Uint8Array([1]))).toBe(false);
    expect(vectorsEqual(undefined, undefined)).toBe(false);
    expect(vectorsEqual(new Uint8Array([]), new Uint8Array([]))).toBe(true);
  });

  it('stats reset cleanly', () => {
    perfStats.saves = 5;
    perfStats.skipped = 3;
    resetPerfStats();
    expect(perfStats.saves).toBe(0);
    expect(perfStats.skipped).toBe(0);
  });
});
