/**
 * Shared notification engine ($0, zero deps).
 * Single gating point for every trigger (REST + socket) so preferences,
 * mutes, and kinds stay consistent everywhere.
 */

export type NotifyKind = 'comment' | 'reply' | 'mention' | 'share';
export type NotifyLevel = 'all' | 'personal' | 'none';

export interface NotifyPref {
  level: NotifyLevel;
  mutedDocIds: string[];
}

export interface Recipient {
  userId: string;
  kind: NotifyKind;
}

const DEFAULT_PREF: NotifyPref = { level: 'all', mutedDocIds: [] };

const KIND_RANK: Record<NotifyKind, number> = {
  comment: 0,
  reply: 1,
  share: 2,
  mention: 3,
};

/**
 * Extract mentioned user ids from comment text. At each `@`, the longest
 * collaborator name matching the following text wins; `@` inside email
 * addresses (preceded by a word char) is ignored.
 */
export function extractMentionedIds(
  text: string,
  users: Array<{ id: string; name: string | null }>
): string[] {
  const ids: string[] = [];
  const sorted = users
    .filter((u): u is { id: string; name: string } => !!u.name)
    .sort((a, b) => b.name.length - a.name.length);
  if (sorted.length === 0) return ids;
  const re = /@/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const at = m.index;
    if (at > 0 && /[A-Za-z0-9_.]/.test(text[at - 1])) continue; // email, not a mention
    const rest = text.slice(at + 1);
    const lower = rest.toLowerCase();
    const hit = sorted.find((u) => {
      const name = u.name.toLowerCase();
      if (!lower.startsWith(name)) return false;
      const after = rest[name.length];
      return after === undefined || !/[A-Za-z0-9_.]/.test(after);
    });
    if (hit && !ids.includes(hit.id)) ids.push(hit.id);
  }
  return ids;
}

function prefOf(prefs: Map<string, NotifyPref>, userId: string): NotifyPref {
  return prefs.get(userId) ?? DEFAULT_PREF;
}

/**
 * Comment/reply/mention recipients for one new comment.
 * - parentAuthorId set → they get kind 'reply'
 * - mentionedUserIds → kind 'mention' (wins over comment/reply)
 * - owner + collaborators (minus actor) → kind 'comment'
 * - level 'personal' → only reply/mention; 'none' → nothing; muted doc → nothing
 */
export function resolveCommentRecipients(opts: {
  ownerId: string;
  collaboratorIds: string[];
  actorId: string;
  documentId: string;
  parentAuthorId?: string | null;
  mentionedUserIds?: string[];
  prefs: Map<string, NotifyPref>;
}): Recipient[] {
  const { ownerId, collaboratorIds, actorId, documentId, parentAuthorId, mentionedUserIds = [], prefs } = opts;
  const kinds = new Map<string, NotifyKind>();

  const consider = (userId: string, kind: NotifyKind) => {
    if (userId === actorId) return; // never notify yourself
    const pref = prefOf(prefs, userId);
    if (pref.level === 'none') return;
    if (pref.mutedDocIds.includes(documentId)) return;
    if (pref.level === 'personal' && kind === 'comment') return;
    const prev = kinds.get(userId);
    if (!prev || KIND_RANK[kind] > KIND_RANK[prev]) kinds.set(userId, kind);
  };

  if (ownerId !== actorId) consider(ownerId, 'comment');
  for (const id of collaboratorIds) consider(id, 'comment');
  if (parentAuthorId) consider(parentAuthorId, 'reply');
  for (const id of mentionedUserIds) consider(id, 'mention');

  return [...kinds.entries()].map(([userId, kind]) => ({ userId, kind }));
}

/** Share recipients: the added users, unless opted out or muted. */
export function resolveShareRecipients(opts: {
  addedUserIds: string[];
  actorId: string;
  documentId: string;
  prefs: Map<string, NotifyPref>;
}): Recipient[] {
  const { addedUserIds, actorId, documentId, prefs } = opts;
  return addedUserIds
    .filter((id) => id !== actorId)
    .filter((id) => {
      const pref = prefOf(prefs, id);
      return pref.level !== 'none' && !pref.mutedDocIds.includes(documentId);
    })
    .map((userId) => ({ userId, kind: 'share' as NotifyKind }));
}

/** Load prefs for a set of users in one query (missing rows = defaults). */
export async function loadPrefs(
  prisma: { notificationPreference: { findMany: (a: any) => Promise<Array<{ userId: string; level: string; mutedDocIds: string[] }>> } },
  userIds: string[]
): Promise<Map<string, NotifyPref>> {
  const rows = userIds.length
    ? await prisma.notificationPreference.findMany({ where: { userId: { in: [...new Set(userIds)] } } })
    : [];
  const map = new Map<string, NotifyPref>();
  for (const row of rows) {
    map.set(row.userId, {
      level: (['all', 'personal', 'none'] as NotifyLevel[]).includes(row.level as NotifyLevel)
        ? (row.level as NotifyLevel)
        : 'all',
      mutedDocIds: row.mutedDocIds || [],
    });
  }
  return map;
}
