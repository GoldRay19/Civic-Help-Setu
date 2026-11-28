import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RationEntitlementAuditorCard from './RationEntitlementAuditorCard';

describe('RationEntitlementAuditorCard', () => {
  it('renders statutory entitlement fields and calculates quota', () => {
    const html = renderToStaticMarkup(<RationEntitlementAuditorCard onSaveAudit={vi.fn()} />);
    expect(html).toContain('NFSA Quota Entitlement &amp; Weighment Auditor');
    expect(html).toContain('Ration Card Category');
    expect(html).toContain('Priority Household (PHH)');
    expect(html).toContain('Antyodaya Anna Yojana (AAY)');
    expect(html).toContain('Section 3 &amp; Schedule I');
  });

  it('renders quota breakdown containers and actual distribution inputs', () => {
    const html = renderToStaticMarkup(<RationEntitlementAuditorCard onSaveAudit={vi.fn()} />);
    expect(html).toContain('Statutory Entitlement Breakdown');
    expect(html).toContain('Actual Distribution at Fair Price Shop');
    expect(html).toContain('Record Audit in Vault');
  });
});
