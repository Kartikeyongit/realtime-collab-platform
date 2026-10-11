import { describe, it, expect } from 'vitest';
import { docToText, chunkText, docToChunks } from './chunks';

describe('docToText', () => {
  it('flattens headings, paragraphs, lists and tables', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'world', marks: [{ type: 'bold' }] }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
        ]},
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'done task' }] }] },
        ]},
      ],
    };
    const text = docToText(doc);
    for (const word of ['Title', 'Hello', 'world', 'one', 'two', 'done task']) {
      expect(text).toContain(word);
    }
  });

  it('handles empty/garbage safely', () => {
    expect(docToText(null)).toBe('');
    expect(docToText(undefined)).toBe('');
    expect(docToText({ type: 'doc' })).toBe('');
    expect(docToText('nope')).toBe('');
  });
});

describe('chunkText', () => {
  it('returns one chunk for short text', () => {
    expect(chunkText('hello world')).toEqual([{ index: 0, text: 'hello world' }]);
    expect(chunkText('   ')).toEqual([]);
  });

  it('splits on paragraphs with sequential indexes', () => {
    const paras = Array.from({ length: 10 }, (_, i) => `paragraph ${i} ` + 'x'.repeat(300));
    const chunks = chunkText(paras.join('\n\n'), 1000, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.map((c) => c.index)).toEqual(chunks.map((_, i) => i));
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(1000 + 100);
    }
  });

  it('hard-slices a single giant paragraph', () => {
    const chunks = chunkText('z'.repeat(5000), 2000, 200);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 2200)).toBe(true);
  });

  it('caps chunk count', () => {
    const chunks = chunkText('w '.repeat(100000), 500, 50, 5);
    expect(chunks.length).toBeLessThanOrEqual(5);
  });
});

describe('docToChunks', () => {
  it('skips tiny docs', () => {
    expect(docToChunks({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] })).toEqual([]);
  });
});
