// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { buildSearchRegex } from './SearchReplacePanel';

describe('buildSearchRegex', () => {
  it('escapes plain text by default', () => {
    const re = buildSearchRegex('a.b', false, false, false)!;
    expect(re.test('a.b')).toBe(true);
    expect(re.test('axb')).toBe(false);
  });

  it('is case-insensitive unless asked', () => {
    expect(buildSearchRegex('Hi', false, false, false)!.test('hi there')).toBe(true);
    expect(buildSearchRegex('Hi', true, false, false)!.test('hi there')).toBe(false);
    expect(buildSearchRegex('Hi', true, false, false)!.test('Hi there')).toBe(true);
  });

  it('matches whole words only when asked', () => {
    expect(buildSearchRegex('cat', false, true, false)!.test('the cat sat')).toBe(true);
    expect(buildSearchRegex('cat', false, true, false)!.test('concatenate')).toBe(false);
    expect(buildSearchRegex('cat', false, false, false)!.test('concatenate')).toBe(true);
  });

  it('passes regex through in regex mode', () => {
    const re = buildSearchRegex('\\d+', false, false, true)!;
    expect(re.test('abc 123')).toBe(true);
    expect(re.test('abc')).toBe(false);
  });

  it('returns null for invalid regex', () => {
    expect(buildSearchRegex('([a-z', false, false, true)).toBeNull();
  });

  it('always uses the global flag for iteration', () => {
    expect(buildSearchRegex('x', false, false, false)!.global).toBe(true);
    expect(buildSearchRegex('x', true, false, true)!.global).toBe(true);
  });
});
