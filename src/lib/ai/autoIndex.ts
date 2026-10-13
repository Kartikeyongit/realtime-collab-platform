'use client';

import axios from 'axios';
import { docToChunks } from '@/lib/ai/chunks';
import { embedTexts } from '@/lib/ai/embeddings';

const OPTIN_KEY = 'ai-index-optin';
// Idle delay before re-embedding: ONNX inference runs on the main thread,
// so it must never start while the user might still be typing. Each save
// pushes the run further out; it fires only after a full quiet period.
const IDLE_MS = 60000;

let inFlight = false;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Has this browser ever completed a full workspace index? */
export function autoIndexOptedIn(): boolean {
  try {
    return localStorage.getItem(OPTIN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Schedule a background re-index of one doc after a successful save.
 * No-ops unless the user opted in (completed indexing once). The actual
 * embedding runs only after IDLE_MS with no further saves — never mid-burst.
 * Content is read fresh at run time via getContent, so edits made during the
 * wait are included. Never throws — indexing must never break saving.
 */
export function maybeAutoIndex(documentId: string, getContent: () => any): void {
  if (typeof window === 'undefined' || !autoIndexOptedIn()) return;
  const prev = timers.get(documentId);
  if (prev) clearTimeout(prev);
  timers.set(
    documentId,
    setTimeout(() => {
      timers.delete(documentId);
      void runAutoIndex(documentId, getContent);
    }, IDLE_MS)
  );
}

async function runAutoIndex(documentId: string, getContent: () => any): Promise<void> {
  if (inFlight) return;
  let content: any = null;
  try {
    content = getContent();
  } catch {
    return;
  }
  const chunks = docToChunks(content);
  if (chunks.length === 0) return;
  inFlight = true;
  try {
    const vecs = await embedTexts(chunks.map((c) => c.text));
    await axios.post('/api/ai/index', {
      documentId,
      chunks: chunks.map((c, i) => ({ index: c.index, text: c.text, embedding: vecs[i] })),
    });
  } catch {
    // Silent: memory freshness is best-effort; next idle window retries.
  } finally {
    inFlight = false;
  }
}
