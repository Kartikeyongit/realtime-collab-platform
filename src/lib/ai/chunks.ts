/**
 * Pure chunking helpers ($0, zero deps): TipTap JSON → plain text →
 * overlapping windows for embeddings.
 */

export interface TextChunk {
  index: number;
  text: string;
}

function nodeText(node: any): string {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) {
    const joiner =
      node.type === 'doc' || node.type === 'paragraph' || node.type === 'heading' ||
      node.type === 'listItem' || node.type === 'tableRow' || node.type === 'tableCell' ||
      node.type === 'tableHeader' || node.type === 'blockquote' || node.type === 'codeBlock'
        ? '\n\n'
        : node.type === 'table' || node.type === 'bulletList' || node.type === 'orderedList' ||
          node.type === 'taskList' || node.type === 'taskItem'
          ? '\n'
          : '';
    return node.content.map(nodeText).join(joiner);
  }
  return '';
}

/** Flatten TipTap JSON to searchable plain text. */
export function docToText(content: any): string {
  if (!content || typeof content !== 'object') return '';
  return nodeText(content)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Split text into overlapping windows (~2000 chars ≈ 500 tokens).
 * Splits on blank lines first so chunks respect paragraph boundaries.
 */
export function chunkText(
  text: string,
  maxChars = 2000,
  overlap = 200,
  maxChunks = 100
): TextChunk[] {
  const clean = (text || '').trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [{ index: 0, text: clean }];

  const paras = clean.split(/\n\s*\n/).filter((p) => p.trim());
  const chunks: TextChunk[] = [];
  let current = '';

  const push = () => {
    const t = current.trim();
    if (t) chunks.push({ index: chunks.length, text: t });
  };

  for (const para of paras) {
    if ((current + '\n\n' + para).trim().length <= maxChars) {
      current = current ? current + '\n\n' + para : para;
      continue;
    }
    if (current.trim()) {
      push();
      // Overlap: carry the tail of the previous chunk forward.
      current = current.slice(-overlap) + '\n\n' + para;
      if (current.trim().length > maxChars * 2) {
        // Single giant paragraph: hard-slice it.
        let rest = current.trim();
        current = '';
        while (rest.length > maxChars) {
          chunks.push({ index: chunks.length, text: rest.slice(0, maxChars) });
          rest = rest.slice(maxChars - overlap);
        }
        current = rest;
      }
    } else {
      // Para itself exceeds max: hard-slice.
      let rest = para;
      while (rest.length > maxChars) {
        chunks.push({ index: chunks.length, text: rest.slice(0, maxChars) });
        rest = rest.slice(maxChars - overlap);
      }
      current = rest;
    }
    if (chunks.length >= maxChunks) break;
  }
  if (current.trim() && chunks.length < maxChunks) push();
  return chunks.slice(0, maxChunks);
}

/** One call: document JSON → embeddable chunks (skips tiny docs). */
export function docToChunks(content: any): TextChunk[] {
  const text = docToText(content);
  if (text.replace(/\s/g, '').length < 40) return [];
  return chunkText(text);
}
