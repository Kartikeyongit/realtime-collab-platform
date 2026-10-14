import { describe, it, expect } from 'vitest';
import { suggestFolders, wordsOf, SCORE_THRESHOLD } from './organize';

const folders = [
  { id: 'f-work', name: 'Work' },
  { id: 'f-trip', name: 'Japan Trip' },
];

const foldered = [
  { id: 'd1', title: 'Q3 planning invoice', tags: ['invoice', 'finance'], folderId: 'f-work' },
  { id: 'd2', title: 'Tokyo hotels', tags: ['travel'], folderId: 'f-trip' },
];

describe('wordsOf', () => {
  it('drops stopwords and short tokens', () => {
    expect(wordsOf('The New Untitled Doc')).toEqual([]);
    expect(wordsOf('Q3 Planning Invoice')).toContain('planning');
  });
});

describe('suggestFolders', () => {
  it('matches on shared tags', () => {
    const out = suggestFolders(
      [{ id: 'u1', title: 'Something else entirely', tags: ['invoice'], folderId: null }],
      folders,
      foldered
    );
    expect(out).toHaveLength(1);
    expect(out[0].folderId).toBe('f-work');
    expect(out[0].score).toBeGreaterThanOrEqual(SCORE_THRESHOLD);
  });

  it('matches folder-name words in the title', () => {
    const out = suggestFolders(
      [{ id: 'u2', title: 'Japan itinerary draft', tags: [], folderId: null }],
      folders,
      foldered
    );
    expect(out[0].folderId).toBe('f-trip');
  });

  it('stays silent below the confidence floor', () => {
    const out = suggestFolders(
      [{ id: 'u3', title: 'Zebra xylophone quantum', tags: ['nope'], folderId: null }],
      folders,
      foldered
    );
    expect(out).toEqual([]);
  });

  it('does nothing without folders or docs', () => {
    expect(suggestFolders([], folders, foldered)).toEqual([]);
    expect(
      suggestFolders([{ id: 'u', title: 't', tags: [], folderId: null }], [], foldered)
    ).toEqual([]);
  });
});
