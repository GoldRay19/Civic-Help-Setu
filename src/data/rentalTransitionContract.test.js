import { describe, it, expect } from 'vitest';
import {
  validateRentalTransitionRecord,
  validateRentalTransitionDirectory,
  RENTAL_TRANSITION_SCHEMA_VERSION,
} from './rentalTransitionContract';
import { RENTAL_TRANSITION_DIRECTORY_DATA } from './rentalTransitions';

const createValidRecord = (overrides = {}) => ({
  id: 'bescom-tenant-meter-handover',
  title: 'BESCOM Electricity Meter Handover & Account Transfer',
  stage: 'move_in',
  category: 'electricity',
  authority: 'Bangalore Electricity Supply Company Limited (BESCOM)',
  jurisdiction: {
    level: 'local',
    states: ['Karnataka'],
    districts: ['Bengaluru Urban'],
    localBody: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
  },
  sourceUrl: 'https://bescom.karnataka.gov.in',
  publishedDate: '2026-01-15',
  turnaroundSchedule: {
    workingDays: 7,
    isUnavailable: false,
  },
  meterReadingConfig: {
    isApplicable: true,
    meterType: 'electricity',
    unit: 'kWh',
    requiresJointConfirmation: true,
  },
  handoverInventory: [
    { id: 'inv-keys', label: 'Main Door & Room Key Sets', requiredForMoveOut: true },
    { id: 'inv-mcb', label: 'MCB & Electricity Meter Box Access Key', requiredForMoveOut: true },
  ],
  officialInstructions: [
    'Record dated meter reading on Form-6 prior to taking occupancy.',
    'Clear all unpaid previous electricity bills with sub-division junior engineer.',
  ],
  editorialNotes: [
    'Take a dated time-stamped photo of the physical meter glass for mutual documentation.',
  ],
  auditMetadata: {
    effectiveDate: '2026-01-01',
    lastVerified: '2026-02-10',
    verifiedBy: 'Civic Help Setu Operations Team',
    sourceUrl: 'https://bescom.karnataka.gov.in',
    status: 'verified',
  },
  ...overrides,
});

describe('rentalTransitionContract validation (#726)', () => {
  it('passes on a valid rental transition record', () => {
    const record = createValidRecord();
    const errors = validateRentalTransitionRecord(record);
    expect(errors).toEqual([]);
  });

  it('rejects forbidden personal fields (citizen privacy & dispute parameters)', () => {
    const forbiddenKeys = [
      'userId', 'tenantName', 'landlordName', 'personalPhone', 'personalEmail',
      'aadhaar', 'panNumber', 'bankAccountNumber', 'securityDepositAmount',
      'rentAmount', 'leaseAgreementFile', 'disputeClaimAmount',
    ];

    forbiddenKeys.forEach((key) => {
      const record = createValidRecord({ [key]: 'prohibited_value' });
      const errors = validateRentalTransitionRecord(record);
      expect(errors.some((e) => e.field === key)).toBe(true);
    });
  });

  it('enforces dated official https source URL', () => {
    const invalidUrlRecord = createValidRecord({
      sourceUrl: 'http://insecure-portal.gov.in',
    });
    const errors = validateRentalTransitionRecord(invalidUrlRecord);
    expect(errors.some((e) => e.field === 'sourceUrl')).toBe(true);
  });

  it('requires explicit unavailable flag when turnaround schedule is missing', () => {
    const recordWithoutSla = createValidRecord({
      turnaroundSchedule: {
        workingDays: null,
        isUnavailable: false,
      },
    });
    const errors = validateRentalTransitionRecord(recordWithoutSla);
    expect(errors.some((e) => e.field.startsWith('turnaroundSchedule'))).toBe(true);

    const validUnavailableRecord = createValidRecord({
      turnaroundSchedule: {
        workingDays: null,
        isUnavailable: true,
        unavailableReason: 'Municipal office does not maintain a published SLA for physical tenant meter inspections.',
      },
    });
    expect(validateRentalTransitionRecord(validUnavailableRecord)).toEqual([]);
  });

  it('validates meter reading config applicability', () => {
    const badMeterRecord = createValidRecord({
      meterReadingConfig: {
        isApplicable: true,
        meterType: 'invalid_meter',
        unit: '',
        requiresJointConfirmation: true,
      },
    });
    const errors = validateRentalTransitionRecord(badMeterRecord);
    expect(errors.some((e) => e.field.startsWith('meterReadingConfig'))).toBe(true);
  });

  it('validates full directory envelope and catches duplicate IDs', () => {
    const record1 = createValidRecord({ id: 'trans-1' });
    const record2 = createValidRecord({ id: 'trans-1' });

    const envelope = {
      schemaVersion: RENTAL_TRANSITION_SCHEMA_VERSION,
      transitions: [record1, record2],
    };

    const errors = validateRentalTransitionDirectory(envelope);
    expect(errors.some((e) => e.field === 'transitions[1].id')).toBe(true);
  });

  it('validates every seed transition in RENTAL_TRANSITION_DIRECTORY_DATA without errors', () => {
    const errors = validateRentalTransitionDirectory(RENTAL_TRANSITION_DIRECTORY_DATA);
    expect(errors).toEqual([]);
  });
});
