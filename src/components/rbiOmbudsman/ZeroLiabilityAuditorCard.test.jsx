import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ZeroLiabilityAuditorCard from './ZeroLiabilityAuditorCard.jsx';

describe('ZeroLiabilityAuditorCard Component (#1341)', () => {
  it('renders header, parameters, and Zero Customer Liability status when reported in 2 days', () => {
    const html = renderToStaticMarkup(
      <ZeroLiabilityAuditorCard
        reportingDays={2}
        transactionAmount={48500}
        accountType="SAVINGS_CURRENT"
      />
    );

    expect(html).toContain('RBI Zero Liability &amp; Customer Protection Auditor');
    expect(html).toContain('Zero Customer Liability');
    expect(html).toContain('₹48,500');
    expect(html).toContain('Within 10 Working Days');
  });

  it('renders limited liability when reported in 5 days', () => {
    const html = renderToStaticMarkup(
      <ZeroLiabilityAuditorCard
        reportingDays={5}
        transactionAmount={30000}
        accountType="SAVINGS_CURRENT"
      />
    );

    expect(html).toContain('Limited Liability Capped at ₹10,000');
    expect(html).toContain('₹10,000');
  });
});
