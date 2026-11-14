import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RentalCorrectionQueue from './RentalCorrectionQueue';
import { ToastProvider } from '../../context/ToastContext';

describe('RentalCorrectionQueue Component (#726)', () => {
  it('renders queue items with verification seals and moderation actions', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <RentalCorrectionQueue />
      </ToastProvider>
    );

    expect(html).toContain('Rental Move-In/Out Civic Corrections Review Queue');
    expect(html).toContain('bescom-move-in-meter-recording');
    expect(html).toContain('RC-CORR-2B14-8E42');
    expect(html).toContain('Verify &amp; Approve');
    expect(html).toContain('Reject');
  });
});
