import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AadhaarGuidePage from './AadhaarGuidePage';

describe('AadhaarGuidePage Component (#530)', () => {
  it('renders within the standard page section and includes navigation and guide', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AadhaarGuidePage />
      </MemoryRouter>
    );

    expect(html).toContain('Back to All Services');
    expect(html).toContain('Aadhaar Enrolment &amp; Demographic Update Acknowledgement Guide');
    expect(html).toContain('Unique Identification Authority of India (UIDAI)');
    expect(html).toContain('New Aadhaar Enrolment');
    expect(html).toContain('Aadhaar Demographic Update');
  });
});
