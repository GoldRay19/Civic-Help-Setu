import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PdsObservationQueue from './PdsObservationQueue';
import { ToastProvider } from '../../context/ToastContext';

describe('PdsObservationQueue Component (#723)', () => {
  it('renders observation queue title and seed submissions with verification seals', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PdsObservationQueue />
      </ToastProvider>
    );

    expect(html).toContain('PDS Fair Price Shop Observation &amp; Correction Queue');
    expect(html).toContain('Fair Price Shop No. 101 - Paharganj');
    expect(html).toContain('PDS-OBS-4F12-88B1');
    expect(html).toContain('Approve &amp; Verify');
    expect(html).toContain('Reject');
    expect(html).toContain('PENDING REVIEW');
  });
});
