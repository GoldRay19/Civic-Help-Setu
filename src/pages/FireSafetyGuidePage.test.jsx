import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import FireSafetyGuidePage from './FireSafetyGuidePage';

describe('FireSafetyGuidePage Component (#719)', () => {
  it('renders within the standard page section and includes back navigation and guide', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <FireSafetyGuidePage />
      </MemoryRouter>
    );

    expect(html).toContain('Back to All Services');
    expect(html).toContain('Fire NOC &amp; Fire-Safety Compliance Preparation Guide');
    expect(html).toContain('NBC 2016 Part 4 &amp; State Fire Safety Compliance');
    expect(html).toContain('State &amp; Municipal Territory');
  });
});

