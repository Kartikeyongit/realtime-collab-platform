/**
 * Guided tour script ($0, zero deps). Pure data — copy lives in one place
 * and step order/guards are unit-testable.
 */

export type TourPlacement = 'center' | 'below' | 'above';

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** CSS selector for the spotlight anchor; omitted = centered modal. */
  target?: string;
  placement: TourPlacement;
  cta?: { label: string; action: 'create-doc' };
}

export const TOUR_KEY = 'collabdocs-tour-done';
export const TOUR_REPLAY_KEY = 'collabdocs-tour-replay';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to CollabDocs 👋',
    body: 'Your realtime second brain — write, organize, and ask questions across all your notes. This 30-second tour shows the essentials.',
    placement: 'center',
  },
  {
    id: 'create',
    title: 'Create in one click',
    body: 'The + New button starts a blank doc instantly. Pro tip: Alt+N captures a quick note from anywhere.',
    target: '[data-tour="new-doc"]',
    placement: 'below',
  },
  {
    id: 'organize',
    title: 'Find anything fast',
    body: 'Search, filter by folder or tag, and sort your way. ⌘K jumps anywhere; starring pins what matters.',
    target: '[data-tour="filters"]',
    placement: 'below',
  },
  {
    id: 'journal',
    title: 'A journal that keeps itself',
    body: 'The month calendar opens any day’s note — green dots mark written days. Hit Today and just write.',
    target: '[data-tour="week"]',
    placement: 'below',
  },
  {
    id: 'ask',
    title: 'Ask across everything',
    body: 'Once indexed, Ask searches all your notes with cited answers. Ready? Create your first document now.',
    target: '[data-tour="ask"]',
    placement: 'below',
    cta: { label: 'Create my first document', action: 'create-doc' },
  },
];

export function isTourDone(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === '1';
  } catch {
    return true; // private mode: never nag
  }
}

export function markTourDone() {
  try {
    localStorage.setItem(TOUR_KEY, '1');
    sessionStorage.removeItem(TOUR_REPLAY_KEY);
  } catch {}
}
