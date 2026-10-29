import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RouteErrorFallback from './RouteErrorFallback';

describe('RouteErrorFallback', () => {
  it('announces the problem and offers a way home and a reload', () => {
    const html = renderToStaticMarkup(<RouteErrorFallback />);
    expect(html).toContain('role="alert"');
    expect(html).toContain('Something went wrong');
    expect(html).toContain('href="/"');
    expect(html).toContain('Reload page');
    expect(html).not.toContain('Unexpected Application Error');
  });
});
