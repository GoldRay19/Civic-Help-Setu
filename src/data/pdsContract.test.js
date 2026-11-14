import { describe, it, expect } from 'vitest';
import { validatePdsShopRecord, FORBIDDEN_PDS_FIELDS, PDS_SCHEMA_VERSION } from './pdsContract';
import { VERIFIED_PDS_SHOPS } from './pdsShops';

const createValidShop = () => ({
  id: 'delhi-fps-central-101',
  name: 'Fair Price Shop No. 101 - Paharganj',
  fpsId: 'DL-FPS-101-CEN',
  dealerName: 'Paharganj Consumer Cooperative Store',
  managingAuthority: 'Department of Food, Supplies & Consumer Affairs, GNCTD',
  state: 'Delhi',
  district: 'Central Delhi',
  block: 'Kotwali',
  locality: 'Paharganj Main Market',
  pincode: '110055',
  address: 'Shop No. 14, Main Bazaar, Paharganj, New Delhi',
  jurisdiction: {
    level: 'local',
    states: ['Delhi'],
    districts: ['Central Delhi'],
    localBody: 'Kotwali Tehsil Ward 84',
  },
  operatingHours: {
    regularHours: '09:00 - 13:00, 15:00 - 19:00',
    weeklyOff: 'Tuesday',
    distributionCycle: '1st to 20th of every calendar month',
    holidayNotice: 'Closed on Republic Day and National Holidays',
  },
  entitlements: {
    aayAllocation: '35 kg foodgrains per family per month',
    phhAllocation: '5 kg foodgrains per beneficiary per month',
    pricingPolicy: 'Zero cost / Subsidized under PMGKAY statutory allocation',
  },
  onorcPortability: {
    enabled: true,
    biometricAuthMode: 'e-POS fingerprint & Iris authentication',
    interstateAllowed: true,
  },
  officialContact: {
    nationalHelpline: '1967',
    stateTollFree: '1800-11-0841',
    grievanceOfficer: 'Assistant Commissioner (Central), Food & Supplies Dept',
    stateGrievancePortal: 'https://pgms.delhi.gov.in',
  },
  auditMetadata: {
    sourceUrl: 'https://nfs.delhi.gov.in',
    effectiveDate: '2026-01-01',
    lastVerified: '2026-02-01',
    verifiedBy: 'Civic Help Setu Public Distribution Auditor',
  },
});

describe('pdsContract schema validation (#723)', () => {
  it('passes validation for a fully conformant PDS Fair Price Shop record', () => {
    const shop = createValidShop();
    const errors = validatePdsShopRecord(shop);
    expect(errors).toEqual([]);
    expect(PDS_SCHEMA_VERSION).toBe(1);
  });

  it('rejects records containing forbidden citizen PII fields (Aadhaar, ration card numbers)', () => {
    FORBIDDEN_PDS_FIELDS.forEach((forbiddenField) => {
      const shop = createValidShop();
      shop[forbiddenField] = 'SENSITIVE_DATA_VALUE';
      const errors = validatePdsShopRecord(shop);
      expect(errors.some((e) => e.includes(forbiddenField) && e.includes('forbidden'))).toBe(true);
    });
  });

  it('rejects records claiming live stock without an authorized feed', () => {
    const shop = createValidShop();
    shop.liveStock = { wheatRemainingKg: 500, riceRemainingKg: 1200 };
    const errors = validatePdsShopRecord(shop);
    expect(errors.some((e) => e.includes('liveStock'))).toBe(true);
  });

  it('validates HTTPS protocol on official government sources', () => {
    const shop = createValidShop();
    shop.auditMetadata.sourceUrl = 'http://insecure-portal.nic.in';
    const errors = validatePdsShopRecord(shop);
    expect(errors.some((e) => e.includes('sourceUrl'))).toBe(true);
  });

  it('validates 6-digit Indian PIN codes', () => {
    const shop = createValidShop();
    shop.pincode = '11005'; // Only 5 digits
    const errors = validatePdsShopRecord(shop);
    expect(errors.some((e) => e.includes('pincode'))).toBe(true);
  });

  it('validates structured jurisdiction hierarchy', () => {
    const shop = createValidShop();
    shop.jurisdiction = {
      level: 'national',
      states: ['Delhi'], // Invalid: national level cannot list states
      districts: [],
      localBody: '',
    };
    const errors = validatePdsShopRecord(shop);
    expect(errors.some((e) => e.includes('jurisdiction'))).toBe(true);
  });

  it('guarantees all seed records in VERIFIED_PDS_SHOPS conform to schema', () => {
    expect(VERIFIED_PDS_SHOPS.length).toBeGreaterThan(0);
    VERIFIED_PDS_SHOPS.forEach((shop) => {
      const errors = validatePdsShopRecord(shop);
      expect(errors).toEqual([]);
    });
  });
});
