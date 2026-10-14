// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { ExportService } from './exportService';

describe('safeFilename', () => {
  it('strips illegal characters and trims', () => {
    expect(ExportService.safeFilename('Q3: Planning?/Final*')).toBe('Q3 PlanningFinal');
    expect(ExportService.safeFilename('  spaced   out  ')).toBe('spaced out');
    expect(ExportService.safeFilename('...dots')).toBe('dots');
  });

  it('caps length and falls back', () => {
    expect(ExportService.safeFilename('x'.repeat(200)).length).toBeLessThanOrEqual(100);
    expect(ExportService.safeFilename('')).toBe('document');
    expect(ExportService.safeFilename('///')).toBe('document');
  });
});

describe('withTaskMarkers', () => {
  it('converts checked/unchecked boxes to markers', () => {
    const html =
      '<ul><li><label><input type="checkbox" checked="checked"><span></span></label><div><p>Done</p></div></li>' +
      '<li><label><input type="checkbox"><span></span></label><div><p>Todo</p></div></li></ul>';
    const out = ExportService.withTaskMarkers(html);
    expect(out).toContain('[x] ');
    expect(out).toContain('[ ] ');
    expect(out).not.toContain('<input');
  });

  it('leaves html without checkboxes untouched', () => {
    const html = '<p>plain <strong>text</strong></p>';
    expect(ExportService.withTaskMarkers(html)).toBe(html);
  });
});
