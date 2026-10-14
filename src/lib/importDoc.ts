import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

/**
 * Universal import engine ($0). Markdown/text/HTML convert synchronously;
 * Word (.docx) loads mammoth lazily so the main bundle never pays for it.
 */

export type ImportKind = 'markdown' | 'html' | 'text' | 'docx';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SINGLE_IMAGE_BYTES = 1024 * 1024;
export const MAX_IMAGES_TOTAL_BYTES = 2 * 1024 * 1024;

const IMPORT_EXTENSIONS: Record<string, ImportKind> = {
  md: 'markdown',
  markdown: 'markdown',
  txt: 'text',
  text: 'text',
  html: 'html',
  htm: 'html',
  docx: 'docx',
};

/** null = unsupported file type. */
export function detectKind(filename: string): ImportKind | null {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  return IMPORT_EXTENSIONS[ext] ?? null;
}

export function deriveTitle(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  const title = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!/[a-z0-9]/i.test(title)) return 'Imported document';
  return title.slice(0, 120);
}

function importExtensions() {
  return [
    StarterKit.configure({ history: false }),
    Underline,
    Link.configure({ openOnClick: false }),
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
  ];
}

export interface ImportResult {
  json: any;
  title: string;
  skippedImages: number;
}

/** True when the JSON has at least one non-empty block. */
export function hasImportableContent(json: any): boolean {
  if (!json || !Array.isArray(json.content)) return false;
  const walk = (nodes: any[]): boolean => {
    for (const n of nodes) {
      if (!n || typeof n !== 'object') continue;
      if (n.type === 'text' && typeof n.text === 'string' && n.text.trim()) return true;
      if (n.type === 'image') return true;
      if (Array.isArray(n.content) && walk(n.content)) return true;
    }
    return false;
  };
  return walk(json.content);
}

async function htmlToTipTap(html: string): Promise<any> {
  return generateJSON(html, importExtensions());
}

let skippedImages = 0;
let imagesBytes = 0;

async function convertDocx(arrayBuffer: ArrayBuffer): Promise<any> {
  // Lazy: main bundle never includes mammoth.
  const mammoth = (await import('mammoth')).default;
  skippedImages = 0;
  imagesBytes = 0;
  // Node entry wants { buffer }, browser entry wants { arrayBuffer };
  // pass both (openZip picks what it understands, ignores the rest).
  const input: any = { arrayBuffer };
  if (typeof Buffer !== 'undefined') {
    try {
      input.buffer = Buffer.from(arrayBuffer);
    } catch {}
  }
  const { value: html } = await mammoth.convertToHtml(
    input,
    {
      convertImage: mammoth.images.imgElement((image: any) =>
        image
          .readAsBase64String()
          .then((base64: string) => {
            // ~4/3 overhead decoding base64 back to bytes for the cap check.
            const bytes = Math.floor(base64.length * 0.75);
            if (bytes > MAX_SINGLE_IMAGE_BYTES || imagesBytes + bytes > MAX_IMAGES_TOTAL_BYTES) {
              skippedImages++;
              return {};
            }
            imagesBytes += bytes;
            const type = image.contentType || 'image/png';
            return { src: `data:${type};base64,${base64}` };
          })
          .catch(() => {
            skippedImages++;
            return {};
          })
      ),
      includeDefaultStyleMap: true,
    } as any
  );
  if (!html || !html.trim()) throw new Error('empty-docx');
  return htmlToTipTap(html);
}

export async function convertFile(file: File): Promise<ImportResult> {
  const kind = detectKind(file.name);
  if (!kind) throw new Error('unsupported-type');
  if (file.size > MAX_FILE_BYTES) throw new Error('too-large');
  if (file.size === 0) throw new Error('empty-file');

  const title = deriveTitle(file.name);
  let json: any;
  let skipped = 0;

  if (kind === 'docx') {
    json = await convertDocx(await file.arrayBuffer());
    skipped = skippedImages;
  } else {
    const text = await file.text();
    if (!text.trim()) throw new Error('empty-file');
    if (kind === 'markdown') {
      const html = marked.parse(text, { breaks: true, async: false }) as string;
      json = await htmlToTipTap(html);
    } else if (kind === 'html') {
      json = await htmlToTipTap(text);
    } else {
      // Plain text: one paragraph per blank-line-separated block.
      const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
      json = {
        type: 'doc',
        content: blocks.map((b) => ({
          type: 'paragraph',
          content: [{ type: 'text', text: b.slice(0, 5000) }],
        })),
      };
      if (json.content.length === 0) throw new Error('empty-file');
    }
  }

  if (!hasImportableContent(json)) throw new Error('nothing-importable');
  return { json, title, skippedImages: skipped };
}

export function importErrorMessage(code: string): string {
  switch (code) {
    case 'unsupported-type':
      return 'That file type isn’t supported — try .docx, .md, .html or .txt';
    case 'too-large':
      return 'File too large — 5MB max for import';
    case 'empty-file':
      return 'That file is empty — nothing to import';
    case 'empty-docx':
      return 'Word couldn’t read any content from that .docx';
    case 'nothing-importable':
      return 'No readable content found in that file';
    default:
      return 'Could not import that file';
  }
}
