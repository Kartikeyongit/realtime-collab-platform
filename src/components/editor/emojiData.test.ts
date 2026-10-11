import { describe, it, expect } from 'vitest';
import { searchEmojis, ALL_EMOJIS } from './emojiData';

describe('searchEmojis', () => {
  it('matches by name prefix first', () => {
    const results = searchEmojis('fire');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].char).toBe('🔥');
  });

  it('matches keywords (e.g. deadline finds alarm)', () => {
    const results = searchEmojis('deadline');
    expect(results.some((e) => e.char === '⏰')).toBe(true);
  });

  it('returns a slice of everything on empty query', () => {
    const results = searchEmojis('');
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(ALL_EMOJIS.length);
  });

  it('returns empty for gibberish', () => {
    expect(searchEmojis('zzzqqqxxx')).toEqual([]);
  });
});
