import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CrematoriumCorrectionQueue from './CrematoriumCorrectionQueue';
import { ToastProvider } from '../../context/ToastContext';

describe('CrematoriumCorrectionQueue Component (#728)', () => {
  it('renders queue items with verification seals, role badges, and actions', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <CrematoriumCorrectionQueue />
      </ToastProvider>
    );

    expect(html).toContain('Public Facility Corrections &amp; Audit Queue');
    expect(html).toContain('Wilson Garden Electric Crematorium');
    expect(html).toContain('CB-CORR-5A21-99F0');
    expect(html).toContain('Approve &amp; Verify');
    expect(html).toContain('Reject');
    expect(html).toContain('Official Source Document');
  });
});
