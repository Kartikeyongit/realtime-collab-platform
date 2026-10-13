/**
 * Shared knowledge-graph helpers ($0, zero deps): walk TipTap JSON for
 * stored docLink IDs (rename-proof) and plain-text title mentions.
 */

export function walkJson(node: any, visit: (n: any) => void) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (Array.isArray(node.content)) {
    for (const child of node.content) walkJson(child, visit);
  }
}

/** IDs referenced by docLink pills in a document. */
export function extractDocLinkIds(content: any): string[] {
  const ids = new Set<string>();
  try {
    walkJson(content, (n) => {
      if (n.type === 'docLink' && typeof n.attrs?.documentId === 'string' && n.attrs.documentId) {
        ids.add(n.attrs.documentId);
      }
    });
  } catch {}
  return [...ids];
}

/** Plain text of a TipTap doc (for title-mention matching). */
export function docJsonText(content: any): string {
  if (!content || typeof content !== 'object') return '';
  if (content.type === 'text') return content.text || '';
  if (Array.isArray(content.content)) {
    return content.content.map(docJsonText).join(' ');
  }
  return '';
}

/** Does the doc's text mention this title (min length guards noise)? */
export function mentionsTitle(content: any, title: string): boolean {
  const needle = (title || '').trim().toLowerCase();
  if (needle.length < 3) return false;
  try {
    return docJsonText(content).toLowerCase().includes(needle);
  } catch {
    return false;
  }
}
