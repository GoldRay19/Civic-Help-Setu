import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TatCompensationCalculatorCard from './TatCompensationCalculatorCard.jsx';

describe('TatCompensationCalculatorCard Component (#1341)', () => {
  it('renders channel choices, penalty rates, and compensation calculation', () => {
    const html = renderToStaticMarkup(
      <TatCompensationCalculatorCard
        channelId="ATM_CASH_FAILED"
        transactionDate="2026-02-01"
        resolutionDate="2026-02-16"
        transactionAmount={10000}
      />
    );

    expect(html).toContain('Harmonised TAT &amp; Delay Compensation Calculator');
    expect(html).toContain('ATM Cash Withdrawal');
    expect(html).toContain('₹100/day');
    expect(html).toContain('10 Days Delay');
    expect(html).toContain('₹1,000');
    expect(html).toContain('₹11,000');
  });

  it('renders property document delay channel with ₹5,000/day penalty rate', () => {
    const html = renderToStaticMarkup(
      <TatCompensationCalculatorCard
        channelId="PROPERTY_DOCS_DELAYED"
        transactionDate="2026-01-01"
        resolutionDate="2026-02-10"
        transactionAmount={0}
      />
    );

    expect(html).toContain('Delayed Return of Original Property Deeds');
    expect(html).toContain('₹5,000/day');
    expect(html).toContain('₹50,000');
  });
});
