import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import SavedEmptyState from './SavedEmptyState';

describe('SavedEmptyState', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <SavedEmptyState />
    </MemoryRouter>
  );

  it('links to the services directory with descriptive text', () => {
    expect(html).toContain('href="/services"');
    expect(html).toContain('Browse the services directory');
  });

  it('has a labelled heading', () => {
    expect(html).toContain('aria-labelledby="saved-empty-title"');
    expect(html).toContain('<h2 id="saved-empty-title"');
  });
});
