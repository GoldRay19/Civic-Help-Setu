import { describe, it, expect } from 'vitest';
import {
  validateCrematoriumRecord,
  validateCrematoriumDirectory,
  FORBIDDEN_FACILITY_FIELDS,
} from './crematoriumContract';
import { VERIFIED_CREMATORIUM_FACILITIES } from './crematoriumFacilities';

describe('crematoriumContract validation', () => {
  const validFacility = {
    id: 'delhi-nigambodh-ghat-cng',
    name: 'Nigambodh Ghat Crematorium (CNG Wing)',
    facilityType: 'cng_crematorium',
    managingAuthority: 'Municipal Corporation of Delhi (MCD)',
    jurisdiction: {
      level: 'local',
      states: ['Delhi'],
      districts: ['Central Delhi'],
      localBody: 'Municipal Corporation of Delhi',
    },
    address: 'Ring Road, Kashmere Gate, Yamuna Riverfront, Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    pincode: '110006',
    coordinates: { lat: 28.6657, lng: 77.2341 },
    officialContact: {
      phone: ['+91 11 2386 1234', '1800 11 0033'],
      portalUrl: 'https://mcdonline.nic.in/crematorium',
    },
    operatingHours: {
      days: 'Monday to Sunday (All 7 Days)',
      hours: '07:00 AM - 08:00 PM',
      outOfHoursServices: true,
      outOfHoursNotes: 'Caretaker stationed for nighttime emergency intake.',
    },
    bookingProcedures: [
      { step: 1, title: 'Intimation', description: 'Present medical certificate / death memo at the admission counter.' },
      { step: 2, title: 'Entry in Statutory Register', description: 'Municipal registrar issues formal cremation receipt.' },
    ],
    statutoryCharges: {
      isFree: true,
      feeSchedule: [],
      publishedDate: '2024-01-01',
    },
    requiredDocuments: [
      { name: 'Doctor / Hospital Death Slip (Form 4/4A)', type: 'required', source: { name: 'MCD Public Health Dept', url: 'https://mcdonline.nic.in/crematorium' } },
      { name: 'Police NOC (Form 25)', type: 'conditional', condition: 'Mandatory in unnatural, accidental, or medico-legal deaths' },
      { name: 'Deceased Govt Photo ID photocopy', type: 'optional' },
      { name: 'Local Resident Certificate', type: 'unverified' },
    ],
    accessibility: {
      wheelchairAccessible: true,
      hearseAccess: true,
      mortuaryColdStorage: true,
      coveredWaitingArea: true,
      accessibleRestroom: true,
    },
    auditMetadata: {
      sourceUrl: 'https://mcdonline.nic.in/crematorium-guidelines',
      effectiveDate: '2025-01-01',
      lastVerified: '2026-01-15',
      verifiedBy: 'Delhi Civic Operations Desk',
    },
  };

  it('passes on a valid facility record', () => {
    const errors = validateCrematoriumRecord(validFacility);
    expect(errors).toEqual([]);
  });

  it('rejects forbidden personal fields (bereaved family privacy)', () => {
    FORBIDDEN_FACILITY_FIELDS.forEach((forbiddenField) => {
      const record = { ...validFacility, [forbiddenField]: 'confidential' };
      const errors = validateCrematoriumRecord(record);
      expect(errors.some((e) => e.field === forbiddenField)).toBe(true);
    });
  });

  it('strictly rejects live-slot claims to prevent false availability claims', () => {
    const record = { ...validFacility, liveSlots: 3 };
    const errors = validateCrematoriumRecord(record);
    expect(errors.some((e) => e.field === 'liveSlots')).toBe(true);
  });

  it('validates required fields: id, name, facilityType, managingAuthority, auditMetadata', () => {
    const invalidRecord = { id: 'bad ID with spaces', name: '' };
    const errors = validateCrematoriumRecord(invalidRecord);
    expect(errors.some((e) => e.field === 'id')).toBe(true);
    expect(errors.some((e) => e.field === 'name')).toBe(true);
    expect(errors.some((e) => e.field === 'facilityType')).toBe(true);
    expect(errors.some((e) => e.field === 'managingAuthority')).toBe(true);
    expect(errors.some((e) => e.field === 'auditMetadata')).toBe(true);
  });

  it('enforces dated official https source URL in auditMetadata', () => {
    const recordWithHttp = {
      ...validFacility,
      auditMetadata: {
        ...validFacility.auditMetadata,
        sourceUrl: 'http://insecure.mcd.gov.in',
      },
    };
    const errors = validateCrematoriumRecord(recordWithHttp);
    expect(errors.some((e) => e.field === 'auditMetadata.sourceUrl')).toBe(true);
  });

  it('validates entire directory envelope and catches duplicates', () => {
    const directory = [validFacility, { ...validFacility }];
    const result = validateCrematoriumDirectory(directory);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.reason.includes('duplicate facility id'))).toBe(true);
  });

  it('validates every seed facility in VERIFIED_CREMATORIUM_FACILITIES', () => {
    const result = validateCrematoriumDirectory(VERIFIED_CREMATORIUM_FACILITIES);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(VERIFIED_CREMATORIUM_FACILITIES.length).toBeGreaterThanOrEqual(5);
  });
});
