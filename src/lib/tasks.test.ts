import { describe, it, expect } from 'vitest';
import { extractTasks, parseDue, bucketTasks, todayStr } from './tasks';

const doc = (content: any) => ({
  id: 'doc1',
  title: 'My Doc',
  content,
});

function taskItem(text: string, checked = false) {
  return {
    type: 'taskItem',
    attrs: { checked },
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  };
}

const wrapTasks = (items: any[]) => ({
  type: 'doc',
  content: [{ type: 'taskList', content: items }],
});

describe('parseDue', () => {
  it('extracts @due dates', () => {
    expect(parseDue('Pay rent @due 2026-10-12')).toEqual({ text: 'Pay rent', due: '2026-10-12' });
  });

  it('returns null due when absent or invalid', () => {
    expect(parseDue('Just a task')).toEqual({ text: 'Just a task', due: null });
    expect(parseDue('Bad @due 2026-13-99')).toEqual({ text: 'Bad @due 2026-13-99', due: null });
  });
});

describe('extractTasks', () => {
  it('collects only unchecked, non-empty tasks', () => {
    const d = doc(wrapTasks([
      taskItem('Open one @due 2026-10-12'),
      taskItem('Done one', true),
      taskItem('   '),
      taskItem('Plain one'),
    ]));
    const tasks = extractTasks(d.content, d.id, d.title);
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({ text: 'Open one', due: '2026-10-12', documentId: 'doc1' });
    expect(tasks[1]).toMatchObject({ text: 'Plain one', due: null });
  });

  it('finds nested tasks and ignores non-task content', () => {
    const d = doc({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'taskList', content: [taskItem('Nested @due 2026-01-01')] },
        { type: 'paragraph', content: [{ type: 'text', text: 'plain @due 2026-01-01 (not a task)' }] },
      ],
    });
    const tasks = extractTasks(d.content, d.id, d.title);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('Nested');
  });

  it('handles empty/garbage content safely', () => {
    expect(extractTasks(null, 'x', 'T')).toEqual([]);
    expect(extractTasks(undefined, 'x', 'T')).toEqual([]);
    expect(extractTasks({ type: 'doc' }, 'x', 'T')).toEqual([]);
  });
});

describe('bucketTasks', () => {
  it('buckets by due relative to today', () => {
    const now = new Date('2026-10-10T12:00:00');
    expect(todayStr(now)).toBe('2026-10-10');
    const buckets = bucketTasks(
      [
        { text: 'late', due: '2026-10-09', documentId: 'a', documentTitle: 'A' },
        { text: 'now', due: '2026-10-10', documentId: 'a', documentTitle: 'A' },
        { text: 'later', due: '2026-10-11', documentId: 'a', documentTitle: 'A' },
        { text: 'none', due: null, documentId: 'a', documentTitle: 'A' },
      ],
      now
    );
    expect(buckets.overdue.map((t) => t.text)).toEqual(['late']);
    expect(buckets.today.map((t) => t.text)).toEqual(['now']);
    expect(buckets.upcoming.map((t) => t.text)).toEqual(['later']);
    expect(buckets.nodate.map((t) => t.text)).toEqual(['none']);
  });
});
