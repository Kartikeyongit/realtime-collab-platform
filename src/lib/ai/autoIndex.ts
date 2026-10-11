'use client';

import axios from 'axios';
import { docToChunks } from '@/lib/ai/chunks';
import { embedTexts } from '@/lib/ai/embeddings';

const OPTIN_KEY = 'ai-index-optin';
let inFlight = false;

/** Has this browser ever completed a full workspace index? */
export function autoIndexOptedIn(): boolean {
  try {
    return localStorage.getItem(OPTIN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Re-index one doc in the background after a successful save.
 * No-ops unless the user opted in (completed indexing once), a run isn't
 * already in flight, and the doc has enough text to be worth embedding.
 * Never throws — indexing must never break saving.
 */
export async function maybeAutoIndex(documentId: string, content: any): Promise<void> {
  if (inFlight || typeof window === 'undefined' || !autoIndexOptedIn()) return;
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
    // Silent: memory freshness is best-effort; next save retries.
  } finally {
    inFlight = false;
  }
}
