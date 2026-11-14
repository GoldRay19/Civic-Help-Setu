import { describe, it, expect } from 'vitest';
import {
  validateWaterTankerAuthorityRecord,
  validateWaterTankerDirectory,
  FORBIDDEN_TANKER_FIELDS,
} from './waterTankerContract';
import { VERIFIED_WATER_TANKER_AUTHORITIES } from './waterTankerAuthorities';

describe('waterTankerContract validation', () => {
  const validAuthority = {
    id: 'delhi-djb-central',
    name: 'Delhi Jal Board (DJB) - Central Division',
    shortCode: 'DJB',
    managingAuthority: 'Delhi Jal Board, Govt. of NCT of Delhi',
    city: 'Delhi',
    state: 'Delhi',
    jurisdiction: {
      level: 'local',
      states: ['Delhi'],
      districts: ['Central Delhi'],
      localBody: 'Delhi Jal Board',
    },
    zones: ['Central Zone', 'Karol Bagh Zone'],
    wards: ['Ward 78 - Karol Bagh', 'Ward 79 - Pahar Ganj'],
    officialChannels: [
      {
        type: 'portal',
        name: 'DJB RMS Booking',
        url: 'https://delhijalboard.delhi.gov.in/water-tanker-booking',
        phone: '1916',
        hours: '24x7',
        instructions: 'Online booking via K-No.',
      },
    ],
    eligibilityConditions: {
      freeSupplyCriteria: 'Free for pipeline emergency and notified clusters.',
      paidTankerRules: 'Max 1 tanker per 48 hours for domestic consumers.',
      consumerIdRequired: false,
      maxLitresPerOrder: 6000,
      quotaFrequencyDays: 2,
    },
    pricingStructure: {
      isFreeRationed: true,
      standardRateInr: 650,
      capacityLitres: 6000,
      officialOrderUrl: 'https://delhijalboard.delhi.gov.in/tanker-tariff-order',
      perKilolitreRateInr: 108.33,
      currency: 'INR',
    },
    escalationMatrix: [
      {
        tier: 1,
        role: 'Junior Engineer (Water Depot)',
        authority: 'DJB Jhandewalan Depot',
        grievancePortalUrl: 'https://delhijalboard.delhi.gov.in/grievance',
        statutorySlaHours: 12,
        phone: '011-23538495',
      },
    ],
    auditMetadata: {
      sourceUrl: 'https://delhijalboard.delhi.gov.in/water-supply-citizen-charter',
      effectiveDate: '2025-01-01',
      lastVerified: '2026-03-01',
      verifiedBy: 'Civic Help Setu Municipal Water Audit Desk',
    },
  };

  it('passes on a valid water authority record', () => {
    const errors = validateWaterTankerAuthorityRecord(validAuthority);
    expect(errors).toEqual([]);
  });

  it('rejects forbidden personal fields (address & PII privacy)', () => {
    FORBIDDEN_TANKER_FIELDS.forEach((forbiddenKey) => {
      const contaminated = { ...validAuthority, [forbiddenKey]: 'secret_data' };
      const errors = validateWaterTankerAuthorityRecord(contaminated);
      expect(errors.some((e) => e.field.includes(forbiddenKey))).toBe(true);
    });
  });

  it('strictly rejects live GPS tracking and speculative wait-time estimations', () => {
    const liveGPS = {
      ...validAuthority,
      liveTankerLocation: { lat: 28.65, lng: 77.22 },
      currentQueueWaitMinutes: 45,
    };
    const errors = validateWaterTankerAuthorityRecord(liveGPS);
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.some((e) => e.field.includes('liveTankerLocation'))).toBe(true);
    expect(errors.some((e) => e.field.includes('currentQueueWaitMinutes'))).toBe(true);
  });

  it('validates required fields: id, name, shortCode, managingAuthority, auditMetadata', () => {
    const incomplete = { ...validAuthority };
    delete incomplete.name;
    delete incomplete.shortCode;
    delete incomplete.managingAuthority;
    delete incomplete.auditMetadata;

    const errors = validateWaterTankerAuthorityRecord(incomplete);
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('name');
    expect(fields).toContain('shortCode');
    expect(fields).toContain('managingAuthority');
    expect(fields).toContain('auditMetadata');
  });

  it('enforces dated official https source URL in auditMetadata', () => {
    const invalidUrl = {
      ...validAuthority,
      auditMetadata: {
        ...validAuthority.auditMetadata,
        sourceUrl: 'http://unsecured-link.com',
      },
    };
    const errors = validateWaterTankerAuthorityRecord(invalidUrl);
    expect(errors.some((e) => e.field === 'auditMetadata.sourceUrl')).toBe(true);
  });

  it('validates entire directory envelope and catches duplicates', () => {
    const result = validateWaterTankerDirectory([validAuthority, validAuthority]);
    expect(result.valid).toBe(false);
    expect(result.errors['delhi-djb-central']).toBeDefined();
    expect(result.errors['delhi-djb-central'].some((m) => m.includes('Duplicate authority id'))).toBe(true);
  });

  it('validates every seed authority in VERIFIED_WATER_TANKER_AUTHORITIES', () => {
    expect(VERIFIED_WATER_TANKER_AUTHORITIES.length).toBeGreaterThanOrEqual(5);
    const result = validateWaterTankerDirectory(VERIFIED_WATER_TANKER_AUTHORITIES);
    expect(result.errors).toEqual({});
    expect(result.valid).toBe(true);
  });
});

