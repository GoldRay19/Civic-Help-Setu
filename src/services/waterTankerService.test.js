import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterWaterAuthorities,
  getAvailableCities,
  getAvailableWards,
  maskResidentialAddress,
  calculateSlaStatus,
  buildWaterTankerChecklistItems,
  generateEscalationLetterText,
  getSavedRequests,
  saveRequest,
  deleteSavedRequest,
  clearAllSavedRequests,
} from './waterTankerService';
import { VERIFIED_WATER_TANKER_AUTHORITIES } from '../data/waterTankerAuthorities';

describe('waterTankerService', () => {
  let mockStorage;
  let store;

  beforeEach(() => {
    store = {};
    mockStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => {
        store[key] = String(value);
      },
      removeItem: (key) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  });

  describe('filtering and discovery', () => {
    it('filters authorities by city', () => {
      const delhi = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { city: 'Delhi' });
      expect(delhi.length).toBeGreaterThanOrEqual(1);
      delhi.forEach((a) => expect(a.city).toBe('Delhi'));

      const blr = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { city: 'Bengaluru' });
      expect(blr.length).toBeGreaterThanOrEqual(1);
      blr.forEach((a) => expect(a.city).toBe('Bengaluru'));
    });

    it('filters authorities by ward', () => {
      const results = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { ward: 'Bellandur' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].shortCode).toBe('BWSSB');
    });

    it('filters authorities by free vs paid supply', () => {
      const freeOnly = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { supplyType: 'free' });
      freeOnly.forEach((a) => expect(a.pricingStructure.isFreeRationed).toBe(true));
    });

    it('searches by keyword across name, shortCode, and zones', () => {
      const byShortCode = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { search: 'CMWSSB' });
      expect(byShortCode.length).toBeGreaterThanOrEqual(1);
      expect(byShortCode[0].city).toBe('Chennai');

      const byZone = filterWaterAuthorities(VERIFIED_WATER_TANKER_AUTHORITIES, { search: 'Khairatabad' });
      expect(byZone.length).toBeGreaterThanOrEqual(1);
      expect(byZone[0].city).toBe('Hyderabad');
    });

    it('extracts available cities and wards', () => {
      const cities = getAvailableCities(VERIFIED_WATER_TANKER_AUTHORITIES);
      expect(cities).toContain('All');
      expect(cities).toContain('Delhi');
      expect(cities).toContain('Bengaluru');

      const delhiWards = getAvailableWards(VERIFIED_WATER_TANKER_AUTHORITIES, 'Delhi');
      expect(delhiWards).toContain('All');
      expect(delhiWards.some((w) => w.includes('Karol Bagh'))).toBe(true);
    });
  });

  describe('address privacy masking', () => {
    it('masks exact house and flat numbers while retaining ward and locality', () => {
      const raw = 'Flat 402, Block B, Green Heights, Ward 150 Bellandur, Bengaluru';
      const masked = maskResidentialAddress(raw, 'Ward 150 Bellandur', 'Bengaluru');
      expect(masked).not.toContain('Flat 402');
      expect(masked).toContain('Ward 150 Bellandur');
      expect(masked).toContain('Bengaluru');
      expect(masked).toContain('[Residential Unit Masked]');
    });

    it('masks phone numbers and personal IDs in address lines', () => {
      const raw = 'Plot 12, Contact: +91 9876543210, Karol Bagh, Delhi';
      const masked = maskResidentialAddress(raw);
      expect(masked).not.toContain('9876543210');
      expect(masked).toContain('[REDACTED_PHONE]');
    });

    it('handles empty or missing address gracefully', () => {
      expect(maskResidentialAddress('', 'Ward 80', 'Delhi')).toBe('[Residential Address Redacted], Ward 80, Delhi');
      expect(maskResidentialAddress(null)).toBe('[Residential Address Redacted]');
    });
  });

  describe('SLA breach calculation', () => {
    it('reports within SLA when request is recent', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const sla = calculateSlaStatus(twoHoursAgo, 24);
      expect(sla.isDelayed).toBe(false);
      expect(sla.status).toBe('within_sla');
      expect(sla.elapsedHours).toBe(2);
    });

    it('reports nearing SLA when 75% of window elapsed', () => {
      const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
      const sla = calculateSlaStatus(twentyHoursAgo, 24);
      expect(sla.isDelayed).toBe(false);
      expect(sla.status).toBe('nearing_sla');
    });

    it('reports overdue when elapsed time exceeds statutory SLA hours', () => {
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
      const sla = calculateSlaStatus(thirtyHoursAgo, 24);
      expect(sla.isDelayed).toBe(true);
      expect(sla.status).toBe('overdue');
      expect(sla.label).toContain('Delayed by 6 hours');
    });
  });

  describe('checklist generation & escalation letter', () => {
    const testAuthority = VERIFIED_WATER_TANKER_AUTHORITIES[0];

    it('builds standard preparation checklist items', () => {
      const items = buildWaterTankerChecklistItems(testAuthority);
      expect(items.length).toBeGreaterThanOrEqual(5);
      expect(items.some((i) => i.includes('sump'))).toBe(true);
      expect(items.some((i) => i.includes('token'))).toBe(true);
    });

    it('generates structured formal escalation letter with masked address', () => {
      const requestLog = {
        bookingReference: 'DJB-2026-TOKEN-101',
        requestDate: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        address: 'House No 12/B, Street 4, Karol Bagh, Delhi',
        ward: 'Ward 78 - Karol Bagh',
        capacityLitres: 6000,
      };

      const letter = generateEscalationLetterText({
        requestLog,
        authority: testAuthority,
        tierIndex: 0,
      });

      expect(letter).toContain('FORMAL CITIZEN REPRESENTATION');
      expect(letter).toContain('DJB-2026-TOKEN-101');
      expect(letter).toContain('Junior Engineer');
      expect(letter).not.toContain('House No 12/B');
      expect(letter).toContain('[Residential Unit Masked]');
      expect(letter).toContain('Delayed by 24 hours');
    });
  });

  describe('local storage request log CRUD', () => {
    it('saves, retrieves, updates, and deletes request logs', () => {
      expect(getSavedRequests(mockStorage)).toEqual([]);

      const sampleReq = {
        id: 'req_001',
        authorityId: 'delhi-djb-central',
        bookingReference: 'DJB-TK-99',
        requestDate: '2026-11-14T10:00:00.000Z',
        ward: 'Ward 78 - Karol Bagh',
        status: 'requested',
      };

      const saved = saveRequest(sampleReq, mockStorage);
      expect(saved).toBe(true);

      const list = getSavedRequests(mockStorage);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('req_001');
      expect(list[0].bookingReference).toBe('DJB-TK-99');

      // Update status
      const updatedReq = { ...sampleReq, status: 'delivered' };
      saveRequest(updatedReq, mockStorage);
      const updatedList = getSavedRequests(mockStorage);
      expect(updatedList.length).toBe(1);
      expect(updatedList[0].status).toBe('delivered');

      // Delete request
      deleteSavedRequest('req_001', mockStorage);
      expect(getSavedRequests(mockStorage)).toEqual([]);
    });

    it('clears all requests from storage', () => {
      saveRequest({ id: 'req_1' }, mockStorage);
      saveRequest({ id: 'req_2' }, mockStorage);
      expect(getSavedRequests(mockStorage).length).toBe(2);

      clearAllSavedRequests(mockStorage);
      expect(getSavedRequests(mockStorage)).toEqual([]);
    });
  });
});

