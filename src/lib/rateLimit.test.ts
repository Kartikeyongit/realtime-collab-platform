import { describe, it, expect } from 'vitest';
import { rateLimit } from './rateLimit';

describe('rateLimit', () => {
  it('allows first request', () => {
    const result = rateLimit('test-key', 3, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks after max attempts', () => {
    const key = `block-key-${Date.now()}`;
    rateLimit(key, 2, 60000);
    rateLimit(key, 2, 60000);
    const result = rateLimit(key, 2, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', async () => {
    const key = `reset-key-${Date.now()}`;
    rateLimit(key, 1, 50);
    const blocked = rateLimit(key, 1, 50);
    expect(blocked.allowed).toBe(false);

    await new Promise(r => setTimeout(r, 60));
    const allowed = rateLimit(key, 1, 50);
    expect(allowed.allowed).toBe(true);
  });

  it('tracks remaining attempts', () => {
    const key = `remaining-key-${Date.now()}`;
    const first = rateLimit(key, 5, 60000);
    expect(first.remaining).toBe(4);

    rateLimit(key, 5, 60000);
    const third = rateLimit(key, 5, 60000);
    expect(third.remaining).toBe(2);
  });
});
