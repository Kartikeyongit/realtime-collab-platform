import { describe, it, expect } from 'vitest';
import { extractDocLinkIds, mentionsTitle, docJsonText } from './links';

const linkDoc = (...ids: string[]) => ({
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'See also ' }] },
    ...ids.map((id) => ({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'ref ' },
        { type: 'docLink', attrs: { documentId: id, title: 'Some Doc' } },
      ],
    })),
  ],
});

describe('extractDocLinkIds', () => {
  it('collects linked doc ids, deduped', () => {
    expect(extractDocLinkIds(linkDoc('a', 'b', 'a')).sort()).toEqual(['a', 'b']);
  });

  it('ignores broken pills (no id) and garbage', () => {
    expect(
      extractDocLinkIds({
        type: 'doc',
        content: [
          { type: 'docLink', attrs: { documentId: null, title: 'Gone' } },
          { type: 'paragraph', content: [{ type: 'text', text: 'hi' }] },
        ],
      })
    ).toEqual([]);
    expect(extractDocLinkIds(null)).toEqual([]);
    expect(extractDocLinkIds(undefined)).toEqual([]);
    expect(extractDocLinkIds('nope')).toEqual([]);
  });
});

describe('mentionsTitle', () => {
  const doc = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'I love Project Phoenix plans' }] }],
  };

  it('matches case-insensitively', () => {
    expect(mentionsTitle(doc, 'project phoenix')).toBe(true);
    expect(mentionsTitle(doc, 'PROJECT PHOENIX')).toBe(true);
  });

  it('rejects short titles and misses', () => {
    expect(mentionsTitle(doc, 'ab')).toBe(false);
    expect(mentionsTitle(doc, 'Unrelated Topic')).toBe(false);
    expect(mentionsTitle(null, 'Project Phoenix')).toBe(false);
  });
});

describe('docJsonText', () => {
  it('flattens nested content', () => {
    expect(docJsonText(linkDoc('a'))).toContain('See also');
    expect(docJsonText(null)).toBe('');
  });
});
