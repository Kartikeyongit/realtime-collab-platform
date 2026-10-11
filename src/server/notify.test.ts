import { describe, it, expect } from 'vitest';
import {
  extractMentionedIds,
  resolveCommentRecipients,
  resolveShareRecipients,
  type NotifyPref,
} from './notify';

const prefs = (overrides: Record<string, NotifyPref> = {}) => new Map(Object.entries(overrides));

describe('extractMentionedIds', () => {
  const users = [
    { id: 'u1', name: 'Alice' },
    { id: 'u2', name: 'Alice Cooper' },
    { id: 'u3', name: null },
  ];

  it('matches names after @ and strips trailing punctuation', () => {
    expect(extractMentionedIds('Hey @Alice, can you and @Bob check this?', [...users, { id: 'u4', name: 'Bob' }]))
      .toEqual(['u1', 'u4']);
  });

  it('prefers the longest matching name', () => {
    expect(extractMentionedIds('ping @Alice Cooper please', users)).toEqual(['u2']);
  });

  it('ignores @ inside email addresses and bare @', () => {
    expect(extractMentionedIds('mail me at jane@x.com @ thanks', users)).toEqual([]);
  });

  it('dedupes repeated mentions', () => {
    expect(extractMentionedIds('@Alice and again @alice', users)).toEqual(['u1']);
  });
});

describe('resolveCommentRecipients', () => {
  const base = {
    ownerId: 'owner',
    collaboratorIds: ['col1', 'col2'],
    actorId: 'col1',
    documentId: 'doc',
  };

  it('notifies owner + other collaborators as comment, never the actor', () => {
    const out = resolveCommentRecipients({ ...base, prefs: prefs() });
    expect(out).toContainEqual({ userId: 'owner', kind: 'comment' });
    expect(out).toContainEqual({ userId: 'col2', kind: 'comment' });
    expect(out.find((r) => r.userId === 'col1')).toBeUndefined();
  });

  it('upgrades parent author to reply', () => {
    const out = resolveCommentRecipients({ ...base, parentAuthorId: 'col2', prefs: prefs() });
    expect(out).toContainEqual({ userId: 'col2', kind: 'reply' });
  });

  it('mention wins over comment/reply', () => {
    const out = resolveCommentRecipients({
      ...base,
      parentAuthorId: 'col2',
      mentionedUserIds: ['col2', 'owner'],
      prefs: prefs(),
    });
    expect(out).toContainEqual({ userId: 'col2', kind: 'mention' });
    expect(out).toContainEqual({ userId: 'owner', kind: 'mention' });
  });

  it('personal level keeps only reply/mention', () => {
    const p = prefs({ col2: { level: 'personal', mutedDocIds: [] } });
    const out = resolveCommentRecipients({ ...base, prefs: p });
    expect(out.find((r) => r.userId === 'col2')).toBeUndefined();

    const out2 = resolveCommentRecipients({ ...base, parentAuthorId: 'col2', prefs: p });
    expect(out2).toContainEqual({ userId: 'col2', kind: 'reply' });
  });

  it('none level and muted docs silence everything', () => {
    const p = prefs({
      col2: { level: 'none', mutedDocIds: [] },
      owner: { level: 'all', mutedDocIds: ['doc'] },
    });
    const out = resolveCommentRecipients({
      ...base,
      parentAuthorId: 'col2',
      mentionedUserIds: ['col2'],
      prefs: p,
    });
    expect(out.find((r) => r.userId === 'col2')).toBeUndefined();
    expect(out.find((r) => r.userId === 'owner')).toBeUndefined();
  });
});

describe('resolveShareRecipients', () => {
  it('notifies added users except actor/opt-outs', () => {
    const out = resolveShareRecipients({
      addedUserIds: ['new1', 'actor', 'muted'],
      actorId: 'actor',
      documentId: 'doc',
      prefs: prefs({ muted: { level: 'all', mutedDocIds: ['doc'] } }),
    });
    expect(out).toEqual([{ userId: 'new1', kind: 'share' }]);
  });
});
