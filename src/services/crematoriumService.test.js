import { describe, it, expect } from 'vitest';
import {
  filterCrematoriumFacilities,
  getCrematoriumById,
  formatCrematoriumInstructions,
  buildBereavementChecklistItems,
} from './crematoriumService';
import { VERIFIED_CREMATORIUM_FACILITIES } from '../data/crematoriumFacilities';

describe('crematoriumService', () => {
  it('filters facilities by state and district cleanly without cross-state leakage', () => {
    const delhiResults = filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, {
      state: 'Delhi',
    });
    expect(delhiResults.length).toBeGreaterThan(0);
    delhiResults.forEach((f) => expect(f.state).toBe('Delhi'));

    const karnatakaResults = filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, {
      state: 'Karnataka',
      district: 'Bengaluru Urban',
    });
    expect(karnatakaResults.length).toBeGreaterThan(0);
    karnatakaResults.forEach((f) => {
      expect(f.state).toBe('Karnataka');
      expect(f.district).toBe('Bengaluru Urban');
    });
  });

  it('filters by facilityType', () => {
    const electricOnly = filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, {
      facilityType: 'electric_crematorium',
    });
    expect(electricOnly.length).toBeGreaterThan(0);
    electricOnly.forEach((f) => expect(f.facilityType).toBe('electric_crematorium'));
  });

  it('filters by accessibility and out-of-hours criteria', () => {
    const coldStorageFacilities = filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, {
      onlyColdStorage: true,
    });
    expect(coldStorageFacilities.length).toBeGreaterThan(0);
    coldStorageFacilities.forEach((f) => {
      expect(f.accessibility.mortuaryColdStorage).toBe(true);
    });

    const outOfHoursFacilities = filterCrematoriumFacilities(VERIFIED_CREMATORIUM_FACILITIES, {
      onlyOutOfHours: true,
    });
    expect(outOfHoursFacilities.length).toBeGreaterThan(0);
    outOfHoursFacilities.forEach((f) => {
      expect(f.operatingHours.outOfHoursServices).toBe(true);
    });
  });

  it('retrieves facility by id', () => {
    const facility = getCrematoriumById('delhi-nigambodh-ghat');
    expect(facility).toBeDefined();
    expect(facility.name).toContain('Nigambodh Ghat');
  });

  it('formats plain-text instructions keeping official rules separate and including disclaimers', () => {
    const facility = VERIFIED_CREMATORIUM_FACILITIES[0];
    const text = formatCrematoriumInstructions(facility);

    expect(text).toContain(facility.name);
    expect(text).toContain('Managing Authority:');
    expect(text).toContain('Official Procedures:');
    expect(text).toContain('Statutory Charges:');
    expect(text).toContain('Official Source & Audit Provenance:');
    expect(text).toContain('Live slot availability is NOT tracked or implied');
    expect(text).not.toContain('undefined');
  });

  it('builds bereavement checklist items with required documents', () => {
    const facility = VERIFIED_CREMATORIUM_FACILITIES[0];
    const items = buildBereavementChecklistItems(facility);
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items).toContain('Hospital / Doctor Medical Certificate of Cause of Death (Form 4/4A)');
    expect(items).toContain('Municipal Cremation / Burial Registration Pass');
  });
});

