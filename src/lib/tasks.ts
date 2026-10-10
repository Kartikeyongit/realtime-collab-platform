/**
 * Task aggregation (pure, $0): walks TipTap JSON documents and extracts
 * unchecked task items. Due dates follow the `@due YYYY-MM-DD` convention
 * written inside the task text — no editor schema change needed.
 */

export interface InboxTask {
  text: string;
  due: string | null; // YYYY-MM-DD or null
  documentId: string;
  documentTitle: string;
}

const DUE_RE = /@due\s+(\d{4}-\d{2}-\d{2})/;

function plainText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) return node.content.map(plainText).join('');
  return '';
}

export function parseDue(text: string): { text: string; due: string | null } {
  const m = text.match(DUE_RE);
  if (!m) return { text: text.trim(), due: null };
  const [, date] = m;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + 'T12:00:00').getTime())) {
    return { text: text.trim(), due: null };
  }
  return { text: text.replace(DUE_RE, '').replace(/\s+/g, ' ').trim(), due: date };
}

function walk(node: any, visit: (n: any) => void) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (Array.isArray(node.content)) {
    for (const child of node.content) walk(child, visit);
  }
}

/** Extract unchecked tasks from one document's TipTap JSON content. */
export function extractTasks(
  content: any,
  documentId: string,
  documentTitle: string
): InboxTask[] {
  const tasks: InboxTask[] = [];
  walk(content, (node) => {
    if (node.type !== 'taskItem') return;
    if (node.attrs?.checked) return; // only open tasks
    const raw = plainText(node);
    if (!raw.trim()) return; // skip empty checkboxes
    const { text, due } = parseDue(raw);
    tasks.push({ text, due, documentId, documentTitle });
  });
  return tasks;
}

export type TaskBucket = 'overdue' | 'today' | 'upcoming' | 'nodate';

export function todayStr(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Bucket tasks for the inbox view. */
export function bucketTasks(
  tasks: InboxTask[],
  now = new Date()
): Record<TaskBucket, InboxTask[]> {
  const today = todayStr(now);
  const buckets: Record<TaskBucket, InboxTask[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    nodate: [],
  };
  for (const task of tasks) {
    if (!task.due) buckets.nodate.push(task);
    else if (task.due < today) buckets.overdue.push(task);
    else if (task.due === today) buckets.today.push(task);
    else buckets.upcoming.push(task);
  }
  const byDue = (a: InboxTask, b: InboxTask) => (a.due || '').localeCompare(b.due || '');
  buckets.overdue.sort(byDue);
  buckets.upcoming.sort(byDue);
  return buckets;
}
