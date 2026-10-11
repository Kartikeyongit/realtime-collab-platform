// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('renders bold/italic/lists instead of raw asterisks', () => {
    const { container } = render(<Markdown text={'The **[Research Paper]** doc *rocks*:\n\n- one\n- two'} />);
    expect(container.querySelector('strong')?.textContent).toBe('[Research Paper]');
    expect(container.querySelector('em')?.textContent).toBe('rocks');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(screen.queryByText(/\*\*/)).toBeNull();
  });

  it('strips scripts and event handlers (XSS-safe)', () => {
    const { container } = render(
      <Markdown text={'<script>alert(1)</script><img src=x onerror=alert(2)>hi'} />
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('hi');
  });

  it('renders inline code', () => {
    const { container } = render(<Markdown text={'Run `npm test` now'} />);
    expect(container.querySelector('code')?.textContent).toBe('npm test');
  });
});
