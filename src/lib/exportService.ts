import { saveAs } from 'file-saver';
import TurndownService from 'turndown';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, ImageRun } from 'docx';

// TipTap JSON node shape
interface TNode {
  type?: string;
  content?: TNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, any> }[];
  attrs?: Record<string, any>;
}

type ParaChild = TextRun | ImageRun;

export class ExportService {
  // ── PDF — uses browser native print ──
  static toPDF(element: HTMLElement, _filename: string): Promise<void> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position: fixed; width: 0; height: 0; border: 0; visibility: hidden;';
      document.body.appendChild(iframe);
      const w = iframe.contentWindow!;
      const d = w.document;
      d.open();
      d.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm; }
  @media print {
    html, body { margin: 0; padding: 0; background: white; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #222; font-size: 11pt; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
    td, th { border: 1px solid #bbb; padding: 6px 8px; text-align: left; font-size: 10pt; }
    th { background: #f5f5f5; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; page-break-inside: avoid; font-size: 9pt; }
    code { background: #f5f5f5; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; }
    blockquote { border-left: 4px solid #888; padding-left: 14px; margin: 1em 0; color: #555; page-break-inside: avoid; }
    h1, h2, h3, h4 { page-break-after: avoid; }
    pre, blockquote, table, img { page-break-inside: avoid; }
    a { color: #0563C1; text-decoration: underline; }
  }
</style>
</head><body>${element.innerHTML}</body></html>`);
      d.close();
      setTimeout(() => { w.focus(); w.print(); document.body.removeChild(iframe); resolve(); }, 600);
    });
  }

  // ── Word — build proper .docx from TipTap JSON ──
  static async toDOCX(json: TNode, filename: string) {
    const children = await ExportService.convertDoc(json.content || []);
    const doc = new Document({
      title: filename,
      creator: 'CollabDocs',
      description: `Exported from CollabDocs`,
      sections: [{ children }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  }

  // ── Convert TipTap nodes → docx Paragraph / Table ──
  private static async convertDoc(nodes: TNode[]): Promise<(Paragraph | Table)[]> {
    const out: (Paragraph | Table)[] = [];
    for (const n of nodes) {
      try {
        const t = n.type || '';
        switch (t) {
          case 'paragraph':          out.push(await ExportService.p(n)); break;
          case 'heading':            out.push(await ExportService.h(n)); break;
          case 'bulletList':         out.push(...await ExportService.ul(n)); break;
          case 'orderedList':        out.push(...await ExportService.ol(n)); break;
          case 'taskList':           out.push(...await ExportService.tl(n)); break;
          case 'table':              out.push(await ExportService.tbl(n)); break;
          case 'blockquote':         out.push(await ExportService.bq(n)); break;
          case 'codeBlock':          out.push(ExportService.cb(n)); break;
          case 'horizontalRule':     out.push(new Paragraph({ thematicBreak: true, spacing: { before: 200, after: 200 } })); break;
          case 'image':              out.push(await ExportService.imgBlock(n)); break;
          case 'text':               break;
          default:                   if (n.content) out.push(...await ExportService.convertDoc(n.content)); break;
        }
      } catch (e) {
        console.warn('Skipping node type:', n.type, e);
      }
    }
    return out;
  }

  // ── Fetch image data — handles data URLs directly, falls back to fetch for remote ──
  private static async fetchImage(src: string): Promise<{ data: ArrayBuffer; type: 'png' | 'jpg' | 'gif' | 'bmp' | 'svg' } | null> {
    try {
      if (src.startsWith('data:')) {
        const data = ExportService.dataUrlToArrayBuffer(src);
        if (!data) return null;
        const type = ExportService.imageType(src);
        return { data, type };
      }
      const r = await fetch(src, { mode: 'cors' });
      if (!r.ok) return null;
      const data = await r.arrayBuffer();
      const type = ExportService.imageType(src);
      return { data, type };
    } catch { return null; }
  }

  // ── Decode a data URL to ArrayBuffer without fetch ──
  private static dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer | null {
    try {
      const comma = dataUrl.indexOf(',');
      if (comma === -1) return null;
      const raw = dataUrl.slice(comma + 1);
      const binary = atob(raw);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch { return null; }
  }

  // ── ImageRun builder ──
  private static async imgRun(n: TNode): Promise<ParaChild | null> {
    const src = n.attrs?.src || '';
    if (!src) return null;
    const w = n.attrs?.width ? Number(n.attrs.width) : 300;
    const h = n.attrs?.height ? Number(n.attrs.height) : 200;
    const img = await ExportService.fetchImage(src);
    if (!img) return null;
    return new ImageRun({ data: img.data, transformation: { width: w, height: h }, type: img.type } as any);
  }

  // ── Block-level image (own paragraph) ──
  private static async imgBlock(n: TNode): Promise<Paragraph> {
    const alt = n.attrs?.alt || '';
    const run = await ExportService.imgRun(n);
    if (run instanceof ImageRun) {
      return new Paragraph({ spacing: { before: 80, after: 80 }, children: [run] });
    }
    return new Paragraph({ children: [new TextRun({ text: `[Image${alt ? ': ' + alt : ''}]`, italics: true, color: '888888' })] });
  }

  // ── Build paragraph children (TextRun + inline ImageRun) ──
  private static async inline(nodes: TNode[] | undefined): Promise<ParaChild[]> {
    if (!nodes) return [];
    const out: ParaChild[] = [];
    for (const n of nodes) {
      if (n.type === 'image') {
        const run = await ExportService.imgRun(n);
        if (run) out.push(run);
        else out.push(new TextRun({ text: '[Image]', italics: true, color: '888888' }));
      } else {
        out.push(...ExportService.tr(n));
      }
    }
    return out;
  }

  // ── Build text runs from marks ──
  private static tr(n: TNode): TextRun[] {
    if (!n.text) return [];
    const text = n.text;
    if (!text) return [];
    const marks = n.marks || [];
    const opts: Record<string, any> = { text };
    for (const m of marks) {
      switch (m.type) {
        case 'bold':           opts.bold = true; break;
        case 'italic':         opts.italics = true; break;
        case 'underline':      opts.underline = { type: 'single' }; break;
        case 'strike':         opts.strike = true; break;
        case 'code':           opts.font = 'Consolas'; opts.size = 20; break;
        case 'link':           opts.color = '0563C1'; opts.underline = { type: 'single' }; break;
        case 'highlight':      break;
        case 'textStyle':      if (m.attrs?.color) opts.color = m.attrs.color; break;
      }
    }
    return [new TextRun(opts)];
  }

  // ── Paragraph ──
  private static async p(n: TNode): Promise<Paragraph> {
    return new Paragraph({ spacing: { after: 80 }, children: await ExportService.inline(n.content) });
  }

  // ── Heading ──
  private static async h(n: TNode): Promise<Paragraph> {
    const lvl = n.attrs?.level ? Number(n.attrs.level) : 1;
    const hh: any = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4, 5: HeadingLevel.HEADING_5, 6: HeadingLevel.HEADING_6 };
    return new Paragraph({ heading: hh[lvl] || HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: await ExportService.inline(n.content) });
  }

  // ── Bullet list ──
  private static async ul(n: TNode): Promise<Paragraph[]> {
    const out: Paragraph[] = [];
    for (const li of n.content || []) {
      out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: '\u2022  ' }), ...await ExportService.inline(li.content)] }));
      if (li.content) {
        for (const child of li.content) {
          if (child.type === 'bulletList') out.push(...await ExportService.ul(child));
          if (child.type === 'orderedList') out.push(...await ExportService.ol(child));
        }
      }
    }
    return out;
  }

  // ── Ordered list ──
  private static async ol(n: TNode): Promise<Paragraph[]> {
    const out: Paragraph[] = [];
    let idx = 1;
    for (const li of n.content || []) {
      out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: `${idx}.  ` }), ...await ExportService.inline(li.content)] }));
      idx++;
      if (li.content) {
        for (const child of li.content) {
          if (child.type === 'bulletList') out.push(...await ExportService.ul(child));
          if (child.type === 'orderedList') out.push(...await ExportService.ol(child));
        }
      }
    }
    return out;
  }

  // ── Task list ──
  private static async tl(n: TNode): Promise<Paragraph[]> {
    const out: Paragraph[] = [];
    for (const li of n.content || []) {
      const checked = li.attrs?.checked;
      const prefix = checked ? '\u2611  ' : '\u2610  ';
      out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: prefix }), ...await ExportService.inline(li.content)] }));
    }
    return out;
  }

  // ── Table ──
  private static async tbl(n: TNode): Promise<Table> {
    const rows: TableRow[] = [];
    for (const trNode of n.content || []) {
      const cells: TableCell[] = [];
      for (const tdNode of trNode.content || []) {
        const cellItems = await ExportService.convertDoc(tdNode.content || []);
        const pars = cellItems.filter(p => p instanceof Paragraph) as Paragraph[];
        if (!pars.length) pars.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
        const isH = tdNode.type === 'tableHeader' || tdNode.type === 'th';
        cells.push(new TableCell({ children: pars, ...(isH ? { shading: { type: 'clear', fill: 'f2f2f2' } as any } : {}) }));
      }
      rows.push(new TableRow({ children: cells }));
    }
    return new Table({ rows });
  }

  // ── Blockquote ──
  private static async bq(n: TNode): Promise<Paragraph> {
    return new Paragraph({ spacing: { before: 120, after: 120 }, indent: { left: ExportService.twip(0.5) }, children: await ExportService.inline(n.content) });
  }

  // ── Code block ──
  private static cb(n: TNode): Paragraph {
    const text = n.content?.map(c => c.text || '').join('\n') || '';
    return new Paragraph({ spacing: { before: 80, after: 80 }, indent: { left: ExportService.twip(0.3) }, children: [new TextRun({ text, font: 'Consolas', size: 18 })] });
  }

  // ── Image type detection ──
  private static imageType(src: string): 'png' | 'jpg' | 'gif' | 'bmp' | 'svg' {
    if (src.startsWith('data:image/png')) return 'png';
    if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) return 'jpg';
    if (src.startsWith('data:image/gif')) return 'gif';
    if (src.startsWith('data:image/webp')) return 'png';
    if (src.startsWith('data:image/bmp')) return 'bmp';
    if (src.startsWith('data:image/svg+xml')) return 'svg';
    const m = src.match(/\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i);
    if (m) {
      if (m[1] === 'jpg' || m[1] === 'jpeg') return 'jpg';
      if (m[1] === 'webp') return 'png';
      if (m[1] === 'bmp') return 'bmp';
      if (m[1] === 'svg') return 'svg';
      if (m[1] === 'png') return 'png';
      if (m[1] === 'gif') return 'gif';
    }
    return 'png';
  }

  private static twip(inches: number) { return Math.round(inches * 1440); }

  // ── Markdown ──
  static toMarkdown(html: string, filename: string) {
    saveAs(new Blob([new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', emDelimiter: '*' }).turndown(html)], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`);
  }

  // ── HTML ──
  static toHTML(html: string, filename: string) {
    saveAs(new Blob([`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${filename}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}h1{font-size:2em;margin-top:1.5em}h2{font-size:1.5em;margin-top:1.3em}h3{font-size:1.25em;margin-top:1.1em}table{border-collapse:collapse;width:100%;margin:1em 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}img{max-width:100%;height:auto}pre{background:#f5f5f5;padding:15px;border-radius:8px;overflow-x:auto}code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:.9em}blockquote{border-left:4px solid #3b82f6;padding-left:16px;margin:1em 0;color:#666}</style></head><body>${html}</body></html>`], { type: 'text/html;charset=utf-8' }), `${filename}.html`);
  }

  // ── Text ──
  static toText(text: string, filename: string) {
    saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${filename}.txt`);
  }
}
