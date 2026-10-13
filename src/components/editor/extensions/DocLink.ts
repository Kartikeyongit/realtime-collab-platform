import { Node, mergeAttributes } from '@tiptap/core';

export interface DocLinkAttributes {
  documentId: string | null;
  title: string;
}

/**
 * Inline document link (`[[Title]]`): atom pill storing the target doc ID,
 * so renames never break it. Click navigates via a window event the doc
 * page listens for (keeps routing out of the extension). Broken targets
 * (deleted docs) render dimmed but keep their title.
 */
export const DocLink = Node.create({
  name: 'docLink',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      documentId: { default: null },
      title: { default: 'Untitled' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-doc-link]' }];
  },

  renderHTML({ node }) {
    const hasTarget = !!node.attrs.documentId;
    return [
      'span',
      mergeAttributes({
        'data-doc-link': node.attrs.documentId ?? '',
        'data-title': node.attrs.title,
        class: hasTarget ? 'doc-link' : 'doc-link doc-link-broken',
      }),
      `📄 ${node.attrs.title}`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const el = document.createElement('span');
      const hasTarget = !!node.attrs.documentId;
      el.className = hasTarget ? 'doc-link' : 'doc-link doc-link-broken';
      el.textContent = `📄 ${node.attrs.title}`;
      el.title = hasTarget ? `${node.attrs.title} — click to open` : 'Linked document unavailable';
      el.dataset.docLink = node.attrs.documentId ?? '';
      el.style.cursor = hasTarget ? 'pointer' : 'default';
      if (hasTarget) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(
            new CustomEvent('collabdocs-open-doc', { detail: { id: node.attrs.documentId } })
          );
        });
      }
      return { dom: el };
    };
  },
});
