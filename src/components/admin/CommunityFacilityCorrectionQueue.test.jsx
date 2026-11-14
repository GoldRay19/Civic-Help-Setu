import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CommunityFacilityCorrectionQueue from './CommunityFacilityCorrectionQueue';
import { ToastProvider } from '../../context/ToastContext';

describe('CommunityFacilityCorrectionQueue Component (#716)', () => {
  it('renders queue items with verification seals, role badges, and actions', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <CommunityFacilityCorrectionQueue />
      </ToastProvider>
    );

    expect(html).toContain('Community Facility Corrections &amp; Audit Queue');
    expect(html).toContain('Dr. S.P. Mukherjee Civic Centre Auditorium');
    expect(html).toContain('CF-CORR-4A12-98E0');
    expect(html).toContain('Approve &amp; Verify');
    expect(html).toContain('Reject');
    expect(html).toContain('Official Source Document');
  });
});

