import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServiceCardSkeletonGrid } from './ServiceCardSkeleton';

describe('ServiceCardSkeletonGrid', () => {
  it('renders the requested number of placeholder cards', () => {
    const html = renderToStaticMarkup(<ServiceCardSkeletonGrid count={4} />);
    expect(html.match(/skeleton-card/g)).toHaveLength(4);
  });

  it('announces loading to assistive tech and hides the placeholders', () => {
    const html = renderToStaticMarkup(<ServiceCardSkeletonGrid label="Loading services" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Loading services...');
    expect(html).toContain('aria-hidden="true"');
  });
});
