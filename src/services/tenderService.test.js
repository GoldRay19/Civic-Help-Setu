import { describe, it, expect } from 'vitest';
import {
  filterTenders,
  getTenderById,
  getClosingUrgency,
  getTenderFreshness,
  getUniqueAuthorities,
  getUniqueStates,
} from './tenderService';
import { VERIFIED_GOVERNMENT_TENDERS } from '../data/tenders';

describe('tenderService (#722)', () => {
  it('returns all verified tenders when no filters are set', () => {
    const list = filterTenders();
    expect(list.length).toBe(VERIFIED_GOVERNMENT_TENDERS.length);
  });

  it('filters by jurisdiction level (national vs state vs local)', () => {
    const national = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { jurisdictionLevel: 'national' });
    expect(national.every((t) => t.jurisdiction.level === 'national')).toBe(true);
    expect(national.length).toBeGreaterThan(0);

    const stateLevel = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { jurisdictionLevel: 'state' });
    expect(stateLevel.every((t) => t.jurisdiction.level === 'state')).toBe(true);

    const localLevel = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { jurisdictionLevel: 'local' });
    expect(localLevel.every((t) => t.jurisdiction.level === 'local')).toBe(true);
  });

  it('filters by specific state correctly (#722 req 15)', () => {
    const karnatakaTenders = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { state: 'Karnataka' });
    expect(karnatakaTenders.length).toBeGreaterThanOrEqual(2);
    expect(
      karnatakaTenders.every(
        (t) => t.jurisdiction.level === 'national' || t.jurisdiction.states?.includes('Karnataka')
      )
    ).toBe(true);
  });

  it('filters by MSME EMD exemption', () => {
    const msmeOnly = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { onlyMsmeExempt: true });
    expect(
      msmeOnly.every(
        (t) => t.financials.emd.isExemptForMsme || t.financials.tenderFee.isExemptForMsme
      )
    ).toBe(true);
  });

  it('filters by search query matching title or tender reference number', () => {
    const queryResult = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { searchQuery: 'solar' });
    expect(queryResult.some((t) => t.id === 'gem-2026-b-581902')).toBe(true);

    const refResult = filterTenders(VERIFIED_GOVERNMENT_TENDERS, { searchQuery: 'KPPP/PWD' });
    expect(refResult.some((t) => t.id === 'kppp-pwd-2026-9041')).toBe(true);
  });

  it('calculates closing urgency accurately against reference dates', () => {
    const scheduleSoon = { closingDate: '2026-11-20', isUnavailable: false };
    const soon = getClosingUrgency(scheduleSoon, '2026-11-15');
    expect(soon.status).toBe('closing_soon');
    expect(soon.daysRemaining).toBe(5);

    const scheduleClosed = { closingDate: '2026-11-10', isUnavailable: false };
    const closed = getClosingUrgency(scheduleClosed, '2026-11-15');
    expect(closed.status).toBe('closed');
    expect(closed.daysRemaining).toBe(-5);

    const scheduleActive = { closingDate: '2026-12-25', isUnavailable: false };
    const active = getClosingUrgency(scheduleActive, '2026-11-15');
    expect(active.status).toBe('active');
    expect(active.daysRemaining).toBe(40);

    const scheduleUnavailable = { closingDate: null, isUnavailable: true };
    const unavail = getClosingUrgency(scheduleUnavailable, '2026-11-15');
    expect(unavail.status).toBe('unavailable');
    expect(unavail.daysRemaining).toBeNull();
  });

  it('evaluates verification freshness tiers and flags stale data (#722 req 13)', () => {
    const freshTender = {
      auditMetadata: { lastVerified: '2026-11-10' },
    };
    const freshRes = getTenderFreshness(freshTender, '2026-11-15');
    expect(freshRes.tier).toBe('recent');
    expect(freshRes.isStale).toBe(false);

    const staleTender = {
      auditMetadata: { lastVerified: '2026-09-01' },
    };
    const staleRes = getTenderFreshness(staleTender, '2026-11-15');
    expect(staleRes.tier).toBe('stale');
    expect(staleRes.isStale).toBe(true);

    const unverifiedTender = { auditMetadata: {} };
    const unverifiedRes = getTenderFreshness(unverifiedTender, '2026-11-15');
    expect(unverifiedRes.tier).toBe('unverified');
    expect(unverifiedRes.isStale).toBe(true);
  });

  it('retrieves single tender by ID', () => {
    const tender = getTenderById('bbmp-waste-2026-4412');
    expect(tender).not.toBeNull();
    expect(tender.authority).toContain('BBMP');

    const notFound = getTenderById('non-existent-tender');
    expect(notFound).toBeNull();
  });

  it('extracts unique authorities and states', () => {
    const authorities = getUniqueAuthorities(VERIFIED_GOVERNMENT_TENDERS);
    expect(authorities.length).toBeGreaterThan(0);
    expect(authorities.some((a) => a.includes('Ministry') || a.includes('BBMP'))).toBe(true);

    const states = getUniqueStates(VERIFIED_GOVERNMENT_TENDERS);
    expect(states).toContain('Karnataka');
    expect(states).toContain('Maharashtra');
  });
});

