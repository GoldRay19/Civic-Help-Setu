import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import TrackEmptyState from './TrackEmptyState';

describe('TrackEmptyState', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <TrackEmptyState onAdd={() => {}} />
    </MemoryRouter>
  );

  it('explains how to start tracking', () => {
    expect(html).toContain('<ol');
    expect(html).toContain('reference or receipt ID');
    expect(html).toContain('Add Application');
  });

  it('links to the services directory', () => {
    expect(html).toContain('href="/services"');
  });

  it('has a labelled heading', () => {
    expect(html).toContain('aria-labelledby="track-empty-title"');
    expect(html).toContain('<h2 id="track-empty-title"');
  });
});
