import { describe, it, expect } from 'vitest';
import { buildBriefing, greetingFor, startOfToday } from './briefing';

const NOW = new Date('2026-10-14T09:00:00');

describe('greetingFor', () => {
  it('greets by time of day', () => {
    expect(greetingFor(new Date('2026-10-14T08:00:00'))).toBe('Good morning');
    expect(greetingFor(new Date('2026-10-14T14:00:00'))).toBe('Good afternoon');
    expect(greetingFor(new Date('2026-10-14T20:00:00'))).toBe('Good evening');
    expect(greetingFor(new Date('2026-10-14T03:00:00'))).toBe('Up late');
  });
});

describe('buildBriefing', () => {
  const docs = [
    { id: 'a', title: 'Fresh', updatedAt: '2026-10-14T08:30:00' },
    { id: 'b', title: 'Stale', updatedAt: '2026-10-10T08:30:00' },
  ];
  const unread = [
    { type: 'comment', actorName: 'Al', documentTitle: 'Fresh', documentId: 'a', createdAt: '2026-10-14T08:00:00' },
    { type: 'share', actorName: 'Bo', documentTitle: 'Fresh', documentId: 'a', createdAt: '2026-10-09T08:00:00' },
    { type: 'mention', actorName: 'Cy', documentTitle: 'Fresh', documentId: 'a', createdAt: '2026-10-14T08:15:00' },
  ];

  it('filters to activity since last visit', () => {
    const b = buildBriefing({
      now: NOW,
      lastVisitIso: '2026-10-13T18:00:00',
      recentDocs: docs,
      unread,
      overdueCount: 2,
    });
    expect(b.changedDocs.map((d) => d.id)).toEqual(['a']);
    expect(b.comments).toHaveLength(1);
    expect(b.shares).toHaveLength(0);
    expect(b.mentions).toHaveLength(1);
    expect(b.overdueCount).toBe(2);
    expect(b.hasActivity).toBe(true);
  });

  it('falls back to start-of-today without a last visit', () => {
    const b = buildBriefing({ now: NOW, lastVisitIso: null, recentDocs: docs, unread, overdueCount: 0 });
    expect(b.changedDocs.map((d) => d.id)).toEqual(['a']);
    expect(b.baselineLabel).toBe('today');
  });

  it('reports no activity cleanly', () => {
    const b = buildBriefing({ now: NOW, lastVisitIso: NOW.toISOString(), recentDocs: docs, unread, overdueCount: 0 });
    expect(b.hasActivity).toBe(false);
    expect(b.changedDocs).toEqual([]);
  });

  it('startOfToday truncates time', () => {
    const s = startOfToday(NOW);
    expect(s.getHours()).toBe(0);
    expect(s.getDate()).toBe(14);
  });
});
