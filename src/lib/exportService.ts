import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import TurndownService from 'turndown';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, AlignmentType,
  ExternalHyperlink,
} from 'docx';

type DocxChild = Paragraph | Table;
type ParaChild = TextRun | ExternalHyperlink;

export class ExportService {
  // PDF Export - Multi-page A4 with margins and page numbers
  static async toPDF(element: HTMLElement, filename: string) {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidthPt = pageWidth - 2 * margin;
    const contentHeightPt = pageHeight - 2 * margin;

    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute; left: 0; top: 0; z-index: -1;
      width: ${contentWidthPt}px;
      background: white; padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6; color: #333;
    `;
    container.innerHTML = element.innerHTML;
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    document.body.removeChild(container);

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pxPerPage = Math.round(contentHeightPt * 2);
    const numPages = Math.max(1, Math.ceil(imgHeight / pxPerPage));

    for (let i = 0; i < numPages; i++) {
      if (i > 0) pdf.addPage();
      const srcY = i * pxPerPage;
      const srcH = Math.min(pxPerPage, imgHeight - srcY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = srcH;
      const ctx = pageCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, srcY, imgWidth, srcH, 0, 0, imgWidth, srcH);
      const imgData = pageCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidthPt, contentHeightPt);
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`${i + 1} / ${numPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    pdf.save(`${filename}.pdf`);
  }

  // Word Export - Proper .docx using the docx package
  static async toDOCX(html: string, filename: string) {
    const children = await ExportService.htmlToDocxChildren(html);
    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'bullet-list',
            levels: [
              { level: 0, format: 'bullet', text: '\u2022', alignment: 'left' as any },
              { level: 1, format: 'bullet', text: '\u25E6', alignment: 'left' as any },
            ],
          },
          {
            reference: 'ordered-list',
            levels: [
              { level: 0, format: 'decimal', text: '%1.', alignment: 'left' as any },
              { level: 1, format: 'lowerLetter', text: '%2)', alignment: 'left' as any },
            ],
          },
        ],
      },
      title: filename,
      sections: [{ children }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  }

  // --- HTML to DOCX conversion helpers ---

  private static async htmlToDocxChildren(html: string): Promise<DocxChild[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
    const body = doc.body;
    const result: DocxChild[] = [];
    for (const node of body.childNodes) {
      const elements = await ExportService.convertNode(node);
      result.push(...elements);
    }
    return result;
  }

  private static async convertNode(node: Node): Promise<DocxChild[]> {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (!text) return [];
      return [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text })] })];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    switch (tag) {
      case 'h1': return [ExportService.heading(el, 1)];
      case 'h2': return [ExportService.heading(el, 2)];
      case 'h3': return [ExportService.heading(el, 3)];
      case 'h4': return [ExportService.heading(el, 4)];
      case 'h5': return [ExportService.heading(el, 5)];
      case 'h6': return [ExportService.heading(el, 6)];
      case 'p': return [ExportService.paragraph(el)];
      case 'ul': return await ExportService.bulletList(el);
      case 'ol': return await ExportService.orderedList(el);
      case 'table': return [await ExportService.convertTable(el)];
      case 'blockquote': return [ExportService.blockquote(el)];
      case 'pre': return [ExportService.codeBlock(el)];
      case 'hr': return [new Paragraph({ thematicBreak: true, spacing: { before: 200, after: 200 } })];
      default: return [];
    }
  }

  private static getParaChildren(element: HTMLElement): ParaChild[] {
    const runs: ParaChild[] = [];
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text) runs.push(new TextRun({ text }));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const text = el.textContent || '';
        switch (tag) {
          case 'strong': case 'b':
            if (text) runs.push(new TextRun({ text, bold: true })); break;
          case 'em': case 'i':
            if (text) runs.push(new TextRun({ text, italics: true })); break;
          case 'u':
            if (text) runs.push(new TextRun({ text, underline: { type: 'single' } })); break;
          case 's': case 'strike':
            if (text) runs.push(new TextRun({ text, strike: true })); break;
          case 'code':
            if (text) runs.push(new TextRun({ text, font: 'Consolas', size: 20 })); break;
          case 'a': {
            const href = el.getAttribute('href') || '';
            if (text) {
              runs.push(new ExternalHyperlink({
                link: href,
                children: [new TextRun({ text, style: 'Hyperlink', color: '0563C1', underline: { type: 'single' } })],
              }));
            }
            break;
          }
          case 'br':
            runs.push(new TextRun({ break: 1 })); break;
          case 'span': case 'mark': {
            if (!text) break;
            const style = el.getAttribute('style') || '';
            const color = style.match(/color:\s*(#[a-f0-9]+)/i)?.[1];
            runs.push(new TextRun({ text, color }));
            break;
          }
          default:
            if (text) {
              runs.push(...ExportService.getParaChildren(el));
            }
        }
      }
    }
    return runs;
  }

  private static heading(el: HTMLElement, level: number): Paragraph {
    const hMap: Record<number, string> = {
      1: 'Heading1', 2: 'Heading2', 3: 'Heading3',
      4: 'Heading4', 5: 'Heading5', 6: 'Heading6',
    };
    return new Paragraph({
      heading: hMap[level] as any,
      spacing: { before: 240, after: 120 },
      children: ExportService.getParaChildren(el),
    });
  }

  private static paragraph(el: HTMLElement): Paragraph {
    return new Paragraph({
      alignment: ExportService.getAlignment(el),
      spacing: { after: 80 },
      children: ExportService.getParaChildren(el),
    });
  }

  private static async bulletList(el: HTMLElement): Promise<Paragraph[]> {
    const items: Paragraph[] = [];
    for (const child of el.children) {
      if (child.tagName.toLowerCase() === 'li') {
        items.push(new Paragraph({
          numbering: { reference: 'bullet-list', level: 0 },
          spacing: { after: 40 },
          children: ExportService.getParaChildren(child as HTMLElement),
        }));
      }
    }
    return items;
  }

  private static async orderedList(el: HTMLElement): Promise<Paragraph[]> {
    const items: Paragraph[] = [];
    for (const child of el.children) {
      if (child.tagName.toLowerCase() === 'li') {
        items.push(new Paragraph({
          numbering: { reference: 'ordered-list', level: 0 },
          spacing: { after: 40 },
          children: ExportService.getParaChildren(child as HTMLElement),
        }));
      }
    }
    return items;
  }

  private static async convertTable(el: HTMLElement): Promise<Table> {
    const rows: TableRow[] = [];
    for (const tr of el.children) {
      if (tr.tagName.toLowerCase() !== 'tr') continue;
      const cells: TableCell[] = [];
      for (const td of tr.children) {
        const tag = td.tagName.toLowerCase();
        if (tag !== 'td' && tag !== 'th') continue;
        const cellChildren: Paragraph[] = [];
        for (const child of td.childNodes) {
          const converted = await ExportService.convertNode(child);
          for (const item of converted) {
            if (item instanceof Paragraph) cellChildren.push(item);
          }
        }
        if (cellChildren.length === 0) {
          cellChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
        }
        const isHeader = tag === 'th';
        cells.push(new TableCell({
          children: cellChildren,
          ...(isHeader ? { shading: { type: 'clear', fill: 'f2f2f2' } as any } : {}),
        }));
      }
      rows.push(new TableRow({ children: cells }));
    }
    return new Table({ rows });
  }

  private static blockquote(el: HTMLElement): Paragraph {
    return new Paragraph({
      spacing: { before: 120, after: 120 },
      indent: { left: ExportService.inchToTwip(0.5) },
      children: ExportService.getParaChildren(el),
    });
  }

  private static codeBlock(el: HTMLElement): Paragraph {
    return new Paragraph({
      spacing: { before: 80, after: 80 },
      indent: { left: ExportService.inchToTwip(0.3) },
      children: [new TextRun({ text: el.textContent || '', font: 'Consolas', size: 18 })],
    });
  }

  private static getAlignment(el: HTMLElement): any | undefined {
    const align = el.getAttribute('align') || el.style.textAlign;
    if (!align) return undefined;
    const m: Record<string, any> = {
      left: AlignmentType.LEFT,
      center: AlignmentType.CENTER,
      right: AlignmentType.RIGHT,
      justify: AlignmentType.JUSTIFIED,
    };
    return m[align];
  }

  private static inchToTwip(inches: number): number {
    return Math.round(inches * 1440);
  }

  // Markdown Export
  static toMarkdown(html: string, filename: string) {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
    });
    const markdown = turndownService.turndown(html);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${filename}.md`);
  }

  // HTML Export
  static toHTML(html: string, filename: string) {
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${filename}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
    h1 { font-size: 2em; margin-top: 1.5em; }
    h2 { font-size: 1.5em; margin-top: 1.3em; }
    h3 { font-size: 1.25em; margin-top: 1.1em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    img { max-width: 100%; height: auto; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 1em 0; color: #666; }
  </style>
</head>
<body>${html}</body>
</html>`;
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `${filename}.html`);
  }

  // Plain Text Export
  static toText(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${filename}.txt`);
  }
}
