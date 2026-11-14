import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import TreePermissionGuidePage from './TreePermissionGuidePage';

describe('TreePermissionGuidePage Component (#717)', () => {
  it('renders within the standard page section and includes navigation and tree guide', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TreePermissionGuidePage />
      </MemoryRouter>
    );

    expect(html).toContain('Back to All Services');
    expect(html).toContain('Tree-Pruning Permission &amp; Urban Tree Protection Guide');
    expect(html).toContain('Official local-authority statutory guidance');
  });
});

