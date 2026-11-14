import { describe, it, expect } from 'vitest';
import {
  filterRentalTransitions,
  getUniqueAuthorities,
  getUniqueStates,
  isRecordStale,
} from './rentalTransitionService';
import { VERIFIED_RENTAL_TRANSITIONS } from '../data/rentalTransitions';

describe('rentalTransitionService (#726)', () => {
  it('filters by workflow stage (move_in vs move_out)', () => {
    const moveIn = filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, { stage: 'move_in' });
    expect(moveIn.length).toBeGreaterThan(0);
    expect(moveIn.every((r) => r.stage === 'move_in')).toBe(true);

    const moveOut = filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, { stage: 'move_out' });
    expect(moveOut.length).toBeGreaterThan(0);
    expect(moveOut.every((r) => r.stage === 'move_out')).toBe(true);
  });

  it('filters by utility category (electricity, water, piped_gas, etc.)', () => {
    const electricity = filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, { category: 'electricity' });
    expect(electricity.length).toBeGreaterThan(0);
    expect(electricity.every((r) => r.category === 'electricity')).toBe(true);
  });

  it('handles jurisdiction switching (National vs State-specific)', () => {
    // When filtering by Karnataka, includes Karnataka-specific records and National records
    const karnataka = filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, { state: 'Karnataka' });
    const hasBescom = karnataka.some((r) => r.id.includes('bescom'));
    const hasUidai = karnataka.some((r) => r.jurisdiction.level === 'national');
    expect(hasBescom).toBe(true);
    expect(hasUidai).toBe(true);

    // When filtering strictly by level === 'national'
    const nationalOnly = filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, { jurisdictionLevel: 'national' });
    expect(nationalOnly.every((r) => r.jurisdiction.level === 'national')).toBe(true);
  });

  it('filters by meter reading applicability', () => {
    const meterOnly = filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, { onlyMeterApplicable: true });
    expect(meterOnly.length).toBeGreaterThan(0);
    expect(meterOnly.every((r) => r.meterReadingConfig?.isApplicable)).toBe(true);
  });

  it('searches by keyword across title and official instructions', () => {
    const results = filterRentalTransitions(VERIFIED_RENTAL_TRANSITIONS, { searchQuery: 'meter' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('extracts unique authorities and states', () => {
    const authorities = getUniqueAuthorities(VERIFIED_RENTAL_TRANSITIONS);
    expect(authorities.length).toBeGreaterThan(0);
    expect(authorities).toContain('Bangalore Electricity Supply Company Limited (BESCOM)');

    const states = getUniqueStates(VERIFIED_RENTAL_TRANSITIONS);
    expect(states).toContain('Karnataka');
    expect(states).toContain('Delhi');
  });

  it('audits record staleness correctly', () => {
    const freshRecord = { auditMetadata: { lastVerified: '2026-02-01' } };
    expect(isRecordStale(freshRecord, 180, new Date('2026-02-15'))).toBe(false);

    const oldRecord = { auditMetadata: { lastVerified: '2025-01-01' } };
    expect(isRecordStale(oldRecord, 180, new Date('2026-02-15'))).toBe(true);
  });
});

