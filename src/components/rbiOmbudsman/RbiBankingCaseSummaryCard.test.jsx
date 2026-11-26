import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RbiBankingCaseSummaryCard from './RbiBankingCaseSummaryCard.jsx';
import { OFFICIAL_STATUS_DISCLAIMER } from '../../services/rbiOmbudsmanStorage.js';

describe('RbiBankingCaseSummaryCard Component (#1341)', () => {
  const sampleCase = {
    id: 'rbi-case-101',
    bankName: 'Apex National Commercial Bank',
    branchName: 'Salt Lake City Centre Branch',
    accountNumber: '918020048123',
    disputeType: 'UNAUTHORIZED_DEBIT',
    transactionAmount: 48500,
    transactionDate: '2026-02-12',
    reportingDays: 2,
    status: 'PNO_ESCALATED',
    pnoRefNumber: 'PNO-8812',
  };

  it('renders bank name, account number, disputed amount, and action buttons', () => {
    const html = renderToStaticMarkup(
      <RbiBankingCaseSummaryCard caseData={sampleCase} />
    );

    expect(html).toContain('Apex National Commercial Bank');
    expect(html).toContain('918020048123');
    expect(html).toContain('₹48,500');
    expect(html).toContain('Draft PNO / Ombudsman Petition');
  });

  it('renders statutory disclaimer in card footer', () => {
    const html = renderToStaticMarkup(
      <RbiBankingCaseSummaryCard caseData={sampleCase} />
    );

    expect(html).toContain(OFFICIAL_STATUS_DISCLAIMER.replace('&', '&amp;'));
  });
});
