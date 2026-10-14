// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import {
  detectKind,
  deriveTitle,
  hasImportableContent,
  importErrorMessage,
  convertFile,
} from './importDoc';

function collectText(node: any): string {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return node.text || '';
  if (Array.isArray(node.content)) return node.content.map(collectText).join(' ');
  return '';
}

describe('detectKind', () => {
  it('routes by extension, case-insensitively', () => {
    expect(detectKind('a.docx')).toBe('docx');
    expect(detectKind('a.MD')).toBe('markdown');
    expect(detectKind('a.markdown')).toBe('markdown');
    expect(detectKind('a.txt')).toBe('text');
    expect(detectKind('a.HTML')).toBe('html');
    expect(detectKind('a.htm')).toBe('html');
  });

  it('rejects the rest', () => {
    expect(detectKind('a.pdf')).toBeNull();
    expect(detectKind('a.odt')).toBeNull();
    expect(detectKind('noext')).toBeNull();
  });
});

describe('deriveTitle', () => {
  it('cleans filenames', () => {
    expect(deriveTitle('my-trip_notes.docx')).toBe('my trip notes');
    expect(deriveTitle('Q3 Report.md')).toBe('Q3 Report');
    expect(deriveTitle('...')).toBe('Imported document');
  });
});

describe('hasImportableContent', () => {
  it('detects real vs empty docs', () => {
    expect(hasImportableContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] })).toBe(true);
    expect(hasImportableContent({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(false);
    expect(hasImportableContent({ type: 'doc', content: [] })).toBe(false);
    expect(hasImportableContent(null)).toBe(false);
    expect(hasImportableContent({ nope: 1 })).toBe(false);
  });
});

describe('importErrorMessage', () => {
  it('maps known codes and defaults', () => {
    expect(importErrorMessage('unsupported-type')).toContain('.docx');
    expect(importErrorMessage('too-large')).toContain('5MB');
    expect(importErrorMessage('whatever')).toBe('Could not import that file');
  });
});

describe('convertFile', () => {
  it('converts markdown to TipTap JSON', async () => {
    const file = new File(['# Hello\n\nSome **bold** text'], 'notes.md', { type: 'text/markdown' });
    const res = await convertFile(file);
    expect(res.title).toBe('notes');
    expect(collectText(res.json)).toContain('Hello');
    expect(collectText(res.json)).toContain('bold');
  });

  it('converts plain text blocks', async () => {
    const file = new File(['first para\n\nsecond para'], 'n.txt', { type: 'text/plain' });
    const res = await convertFile(file);
    expect(collectText(res.json)).toContain('second para');
  });

  it('converts HTML', async () => {
    const file = new File(['<h1>Title</h1><p>Body text</p>'], 'p.html', { type: 'text/html' });
    const res = await convertFile(file);
    expect(collectText(res.json)).toContain('Body text');
  });

  it('round-trips a real Word document', async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'Trip Report', heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: 'Flight was ', bold: false }), new TextRun({ text: 'delayed', bold: true })] }),
          new Paragraph({ text: 'Pack bags', bullet: { level: 0 } }),
        ],
      }],
    });
    const buffer = await Packer.toBuffer(doc);
    const file = new File([new Uint8Array(buffer)], 'trip-report.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const res = await convertFile(file);
    expect(res.title).toBe('trip report');
    const text = collectText(res.json);
    expect(text).toContain('Trip Report');
    expect(text).toContain('delayed');
    expect(text).toContain('Pack bags');
  }, 60000);

  it('rejects unsupported and empty files with codes', async () => {
    await expect(convertFile(new File(['x'], 'a.pdf'))).rejects.toThrow('unsupported-type');
    await expect(convertFile(new File([], 'empty.md'))).rejects.toThrow('empty-file');
  });
});
