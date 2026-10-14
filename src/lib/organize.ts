/**
 * Tidy-up suggestions ($0, zero AI quota): match Unsorted docs to folders by
 * shared tags (strong) and shared distinctive title words (medium).
 * Suggest-only with a confidence floor — never auto-moves anything.
 */

export interface TidyDoc {
  id: string;
  title: string;
  tags: string[];
  folderId: string | null;
}

export interface TidyFolder {
  id: string;
  name: string;
}

export interface TidySuggestion {
  documentId: string;
  title: string;
  folderId: string;
  folderName: string;
  score: number;
  reasons: string[];
}

const STOPWORDS = new Set(
  'the,a,an,and,or,for,to,of,in,on,at,my,your,our,with,from,by,is,are,was,were,be,as,new,untitled,doc,document,note,notes,draft,copy'.split(
    ','
  )
);

export function wordsOf(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

export const SCORE_THRESHOLD = 3;

export function suggestFolders(
  unsortedDocs: TidyDoc[],
  folders: TidyFolder[],
  folderedDocs: TidyDoc[]
): TidySuggestion[] {
  if (folders.length === 0 || unsortedDocs.length === 0) return [];

  // Folder profiles from their current contents (capped for sanity).
  const profiles = new Map<string, { tags: Map<string, number>; words: Map<string, number> }>();
  for (const f of folders) profiles.set(f.id, { tags: new Map(), words: new Map() });
  let sampled = 0;
  for (const d of folderedDocs) {
    if (!d.folderId || !profiles.has(d.folderId) || sampled > 500) continue;
    sampled++;
    const p = profiles.get(d.folderId)!;
    for (const t of d.tags) p.tags.set(t.toLowerCase(), (p.tags.get(t.toLowerCase()) || 0) + 1);
    for (const w of wordsOf(d.title)) p.words.set(w, (p.words.get(w) || 0) + 1);
  }

  // Document frequency of folder-name words: a word unique to one folder
  // is a much stronger signal than one shared by several.
  const nameDf = new Map<string, number>();
  const folderNameWords = new Map<string, string[]>();
  for (const f of folders) {
    const ws = [...new Set(wordsOf(f.name))];
    folderNameWords.set(f.id, ws);
    for (const w of ws) nameDf.set(w, (nameDf.get(w) || 0) + 1);
  }

  const out: TidySuggestion[] = [];
  for (const doc of unsortedDocs) {
    const docTags = doc.tags.map((t) => t.toLowerCase());
    const docWords = new Set(wordsOf(doc.title));
    let best: TidySuggestion | null = null;
    for (const f of folders) {
      const p = profiles.get(f.id)!;
      let score = 0;
      const reasons: string[] = [];
      const sharedTags = docTags.filter((t) => p.tags.has(t));
      if (sharedTags.length > 0) {
        score += 3 * sharedTags.length;
        reasons.push(`shares tag${sharedTags.length === 1 ? '' : 's'} ${sharedTags.slice(0, 2).map((t) => `#${t}`).join(', ')}`);
      }
      const nameWords = folderNameWords.get(f.id)!;
      const titleHits = [...docWords].filter((w) => nameWords.includes(w));
      if (titleHits.length > 0) {
        const distinctive = titleHits.filter((w) => (nameDf.get(w) || 0) === 1).length;
        score += 2 * titleHits.length + distinctive;
        reasons.push(`title matches “${f.name}”`);
      }
      const contentHits = [...docWords].filter((w) => p.words.has(w)).slice(0, 3);
      if (contentHits.length > 0 && sharedTags.length === 0) {
        score += contentHits.length;
        reasons.push(`similar to docs already in “${f.name}”`);
      }
      if (score >= SCORE_THRESHOLD && (!best || score > best.score)) {
        best = { documentId: doc.id, title: doc.title, folderId: f.id, folderName: f.name, score, reasons };
      }
    }
    if (best) out.push(best);
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}

const DISMISS_KEY = 'collabdocs-tidy-dismissed';

export function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function dismissSuggestion(docId: string) {
  try {
    const set = readDismissed();
    set.add(docId);
    localStorage.setItem(DISMISS_KEY, JSON.stringify([...set].slice(-200)));
  } catch {}
}
