/**
 * Morning briefing assembly ($0, zero AI quota): pure function over data the
 * dashboard already fetches. "Since last visit" uses a stored timestamp;
 * first run falls back to start-of-today.
 */

export interface BriefingDoc {
  id: string;
  title: string;
  updatedAt: string;
}

export interface BriefingNotification {
  type: string;
  actorName: string | null;
  documentTitle: string | null;
  documentId: string | null;
  createdAt: string;
}

export interface Briefing {
  greeting: string;
  baselineLabel: string;
  changedDocs: BriefingDoc[];
  comments: BriefingNotification[];
  shares: BriefingNotification[];
  mentions: BriefingNotification[];
  overdueCount: number;
  hasActivity: boolean;
}

export function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function buildBriefing(opts: {
  now: Date;
  lastVisitIso: string | null;
  recentDocs: BriefingDoc[];
  unread: BriefingNotification[];
  overdueCount: number;
}): Briefing {
  const { now, lastVisitIso, recentDocs, unread, overdueCount } = opts;
  let baseline = lastVisitIso ? new Date(lastVisitIso) : startOfToday(now);
  if (Number.isNaN(baseline.getTime())) baseline = startOfToday(now);
  const since = baseline.getTime();

  const changedDocs = recentDocs
    .filter((d) => {
      const t = new Date(d.updatedAt).getTime();
      return !Number.isNaN(t) && t > since;
    })
    .slice(0, 5);

  const fresh = unread.filter((n) => {
    const t = new Date(n.createdAt).getTime();
    return !Number.isNaN(t) && t > since;
  });
  const comments = fresh.filter((n) => n.type === 'comment' || n.type === 'reply').slice(0, 4);
  const shares = fresh.filter((n) => n.type === 'share').slice(0, 4);
  const mentions = fresh.filter((n) => n.type === 'mention').slice(0, 4);

  const sameDay =
    baseline.getFullYear() === now.getFullYear() &&
    baseline.getMonth() === now.getMonth() &&
    baseline.getDate() === now.getDate();

  return {
    greeting: greetingFor(now),
    baselineLabel: sameDay ? 'today' : 'since your last visit',
    changedDocs,
    comments,
    shares,
    mentions,
    overdueCount,
    hasActivity:
      changedDocs.length > 0 ||
      comments.length > 0 ||
      shares.length > 0 ||
      mentions.length > 0 ||
      overdueCount > 0,
  };
}

const DAY_KEY_PREFIX = 'collabdocs-briefing-shown-';

export function briefingShownToday(now = new Date()): boolean {
  try {
    const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    return localStorage.getItem(DAY_KEY_PREFIX + day) === '1';
  } catch {
    return true;
  }
}

export function markBriefingShown(now = new Date()) {
  try {
    const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    localStorage.setItem(DAY_KEY_PREFIX + day, '1');
  } catch {}
}

export const LAST_VISIT_KEY = 'collabdocs-last-visit';

export function readLastVisit(): string | null {
  try {
    return localStorage.getItem(LAST_VISIT_KEY);
  } catch {
    return null;
  }
}

export function writeLastVisit(now = new Date()) {
  try {
    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
  } catch {}
}
