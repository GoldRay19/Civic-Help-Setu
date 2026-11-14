import { describe, it, expect } from 'vitest';
import {
  validateCommunityFacilityRecord,
  validateCommunityFacilityDirectory,
  COMMUNITY_FACILITY_SCHEMA_VERSION,
  FACILITY_TYPES,
} from './communityFacilityContract';
import { VERIFIED_COMMUNITY_FACILITIES } from './communityFacilities';

describe('communityFacilityContract validation', () => {
  it('exposes valid version number and facility types', () => {
    expect(COMMUNITY_FACILITY_SCHEMA_VERSION).toBe(1);
    expect(FACILITY_TYPES).toContain('community_hall');
    expect(FACILITY_TYPES).toContain('municipal_auditorium');
    expect(FACILITY_TYPES).toContain('sports_complex');
  });

  it('passes on a valid facility record', () => {
    const valid = {
      id: 'test-hall',
      name: 'Test Community Hall',
      facilityType: 'community_hall',
      managingAuthority: 'Municipal Corporation',
      jurisdiction: {
        level: 'local',
        states: ['Delhi'],
        districts: ['New Delhi'],
        localBody: 'MCD',
      },
      address: '123 Ring Road',
      district: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      officialContact: {
        phone: ['011-23456789'],
        portalUrl: 'https://mcd.gov.in',
      },
      capacity: {
        total: 500,
        seated: 400,
      },
      leadTimes: {
        minLeadDays: 10,
        maxAdvanceDays: 90,
      },
      permittedActivities: ['Cultural meetings', 'Seminars'],
      prohibitedActivities: ['Commercial trade without permit'],
      operatingHours: {
        hours: '09:00 - 18:00',
      },
      statutoryCharges: {
        isFree: false,
        feeSchedule: [
          { slotOrCategory: 'Full Day', tariff: 10000, notes: 'Includes power backup' },
        ],
      },
      securityDeposit: {
        required: true,
        amount: 5000,
        refundable: true,
        refundTimeline: 'Within 15 days',
        forfeitureConditions: 'Damages',
      },
      cancellationPolicy: {
        isAvailable: true,
        rules: [
          { timeline: '30 days prior', refundPercentage: 80, deductionNotes: 'Admin fee' },
        ],
      },
      accessibility: {
        wheelchairAccessible: true,
      },
      auditMetadata: {
        sourceUrl: 'https://mcd.gov.in/rules',
        effectiveDate: '2026-01-01',
        lastVerified: '2026-02-01',
        verifiedBy: 'Auditor',
      },
    };

    const errors = validateCommunityFacilityRecord(valid);
    expect(errors).toEqual([]);
  });

  it('rejects forbidden personal applicant fields to preserve citizen privacy', () => {
    const badRecord = {
      ...VERIFIED_COMMUNITY_FACILITIES[0],
      aadhaar: '1234-5678-9012',
      applicantName: 'Citizen Doe',
    };
    const errors = validateCommunityFacilityRecord(badRecord);
    expect(errors.some((e) => e.field.includes('aadhaar'))).toBe(true);
    expect(errors.some((e) => e.field.includes('applicantName'))).toBe(true);
  });

  it('strictly rejects live-slot claims to prevent false availability claims', () => {
    const badRecord = {
      ...VERIFIED_COMMUNITY_FACILITIES[0],
      liveSlots: ['2026-03-01: Available'],
      instantBooking: true,
    };
    const errors = validateCommunityFacilityRecord(badRecord);
    expect(errors.some((e) => e.field.includes('liveSlots'))).toBe(true);
    expect(errors.some((e) => e.field.includes('instantBooking'))).toBe(true);
  });

  it('validates required fields: id, name, facilityType, managingAuthority, auditMetadata', () => {
    const emptyRecord = {};
    const errors = validateCommunityFacilityRecord(emptyRecord);
    const fields = errors.map((e) => e.field);
    expect(fields).toContain('id');
    expect(fields).toContain('name');
    expect(fields).toContain('facilityType');
    expect(fields).toContain('managingAuthority');
    expect(fields).toContain('auditMetadata');
  });

  it('enforces dated official https source URL in auditMetadata', () => {
    const badRecord = {
      ...VERIFIED_COMMUNITY_FACILITIES[0],
      auditMetadata: {
        sourceUrl: 'http://insecure-site.com',
        effectiveDate: 'invalid-date',
        lastVerified: '2026-02-01',
        verifiedBy: 'Admin',
      },
    };
    const errors = validateCommunityFacilityRecord(badRecord);
    expect(errors.some((e) => e.field === 'auditMetadata.sourceUrl')).toBe(true);
    expect(errors.some((e) => e.field === 'auditMetadata.effectiveDate')).toBe(true);
  });

  it('enforces that conditional event permits and required documents must include conditions', () => {
    const invalidConditional = {
      ...VERIFIED_COMMUNITY_FACILITIES[0],
      eventPermits: [
        { name: 'Sound NOC', authority: 'Police', type: 'conditional', condition: '' },
      ],
      requiredDocuments: [
        { name: 'NOC Letter', type: 'conditional', condition: '   ' },
      ],
    };
    const errors = validateCommunityFacilityRecord(invalidConditional);
    expect(errors.some((e) => e.field === 'eventPermits[0].condition')).toBe(true);
    expect(errors.some((e) => e.field === 'requiredDocuments[0].condition')).toBe(true);
  });

  it('validates entire directory envelope and catches duplicates', () => {
    const dirResult = validateCommunityFacilityDirectory([
      VERIFIED_COMMUNITY_FACILITIES[0],
      VERIFIED_COMMUNITY_FACILITIES[0], // Duplicate!
    ]);
    expect(dirResult.valid).toBe(false);
    expect(dirResult.errors.some((e) => e.reason.includes('duplicate'))).toBe(true);
  });

  it('validates every seed facility in VERIFIED_COMMUNITY_FACILITIES', () => {
    const dirResult = validateCommunityFacilityDirectory(VERIFIED_COMMUNITY_FACILITIES);
    expect(dirResult.errors).toEqual([]);
    expect(dirResult.valid).toBe(true);
    expect(VERIFIED_COMMUNITY_FACILITIES.length).toBeGreaterThanOrEqual(5);
  });
});
