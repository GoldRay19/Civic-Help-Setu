import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import WaterTankerReviewQueue from './WaterTankerReviewQueue';
import { ToastProvider } from '../../context/ToastContext';

describe('WaterTankerReviewQueue Component (#724)', () => {
  it('renders queue items with verification seals, role badges, and actions', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <WaterTankerReviewQueue />
      </ToastProvider>
    );

    expect(html).toContain('Water Tanker Citizen Inaccuracies');
    expect(html).toContain('bengaluru-bwssb-south');
    expect(html).toContain('WT-REP-5F12-88B1');
    expect(html).toContain('Verify &amp; Approve');
    expect(html).toContain('Reject');
    expect(html).toContain('tariff overcharge');
  });
});
