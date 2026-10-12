import { describe, it, expect } from 'vitest';
import { TOUR_STEPS } from './tourSteps';

describe('tourSteps', () => {
  it('has unique ids and valid placements', () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of TOUR_STEPS) {
      expect(['center', 'below', 'above']).toContain(s.placement);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.body.length).toBeGreaterThan(0);
    }
  });

  it('starts centered and ends with a creation CTA', () => {
    expect(TOUR_STEPS[0].placement).toBe('center');
    expect(TOUR_STEPS[0].target).toBeUndefined();
    const last = TOUR_STEPS[TOUR_STEPS.length - 1];
    expect(last.cta?.action).toBe('create-doc');
  });

  it('every anchored step has a data-tour selector', () => {
    for (const s of TOUR_STEPS) {
      if (s.target) expect(s.target.startsWith('[data-tour=')).toBe(true);
    }
  });
});
