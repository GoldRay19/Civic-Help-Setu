import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TenderCorrectionQueue from './TenderCorrectionQueue';
import { ToastProvider } from '../../context/ToastContext';

describe('TenderCorrectionQueue Component (#722)', () => {
  it('renders queue items with verification seals, role badges, and actions', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <TenderCorrectionQueue />
      </ToastProvider>
    );

    expect(html).toContain('Government Tender Notices &amp; Corrigenda Review Queue (#722)');
    expect(html).toContain('GEM/2026/B/581902');
    expect(html).toContain('TR-CORR-4A12-9F81');
    expect(html).toContain('Approve &amp; Verify');
    expect(html).toContain('Reject');
    expect(html).toContain('Click-Check Official Government Portal');
  });
});

