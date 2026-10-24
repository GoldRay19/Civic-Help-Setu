import { describe, it, expect } from 'vitest';
import {
  getServiceRevisions,
  checkRecentRevisions,
  formatCircularCitation
} from './serviceChangelogService';

describe('serviceChangelogService - Official Revisions & Circular Tracker', () => {
  it('retrieves revisions for income-certificate', () => {
    const list = getServiceRevisions('income-certificate');
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0].version).toBe('v2.4');
    expect(list[0].circularNumber).toBe('GO-REV/2026/104-B');
  });

  it('returns empty array for service without tracked changes', () => {
    const list = getServiceRevisions('unknown-service-xyz');
    expect(list).toEqual([]);
  });

  it('formats official circular citation string correctly', () => {
    const rev = {
      circularNumber: 'GO-TEST/2026/01',
      effectiveDate: '2026-03-01',
      issuingAuthority: 'Ministry of Home Affairs'
    };
    const citation = formatCircularCitation(rev);
    expect(citation).toContain('GO-TEST/2026/01');
    expect(citation).toContain('Ministry of Home Affairs');
  });
});
