import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RbiOmbudsmanDrafterModal from './RbiOmbudsmanDrafterModal.jsx';

describe('RbiOmbudsmanDrafterModal Component (#1341)', () => {
  const sampleCase = {
    id: 'rbi-case-101',
    complainantName: 'Ananya Sengupta',
    complainantContact: 'ananya@example.com / 9830012345',
    complainantAddress: 'Salt Lake, Kolkata',
    bankName: 'Apex National Commercial Bank',
    branchName: 'Salt Lake Branch',
    accountNumber: '918020048123',
    disputeType: 'UNAUTHORIZED_DEBIT',
    transactionAmount: 48500,
    transactionDate: '2026-02-12',
    reportingDays: 2,
    pnoRefNumber: 'PNO-8812',
    pnoComplaintDate: '2026-02-15',
    incidentDetails: 'Unauthorized digital debit without OTP.',
  };

  it('renders modal header, tab buttons, and draft editor', () => {
    const html = renderToStaticMarkup(
      <RbiOmbudsmanDrafterModal caseData={sampleCase} onClose={() => {}} />
    );

    expect(html).toContain('RBI Banking Ombudsman Redressal &amp; Petition Drafter');
    expect(html).toContain('Bank Principal Nodal Officer (PNO) Letter');
    expect(html).toContain('RBI Ombudsman CMS Petition (Clause 11)');
    expect(html).toContain('Ananya Sengupta');
    expect(html).toContain('Apex National Commercial Bank');
  });

  it('renders statutory disclaimer in modal footer', () => {
    const html = renderToStaticMarkup(
      <RbiOmbudsmanDrafterModal caseData={sampleCase} onClose={() => {}} />
    );

    expect(html).toContain('Statutory Notice: This draft is generated locally under the RBI Integrated Ombudsman Scheme, 2021');
  });
});
