import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OFFICIAL_STATUS_DISCLAIMER,
  getStoredRationRecords,
  saveRationRecord,
  deleteRationRecord,
  getRationSettings,
  saveRationSettings,
  exportRationDossier,
  seedSampleRationRecords
} from './nfsaRationStorage';

describe('nfsaRationStorage', () => {
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    const mockStorage = {
      getItem: vi.fn((key) => (key in mockStore ? mockStore[key] : null)),
      setItem: vi.fn((key, val) => {
        mockStore[key] = String(val);
      }),
      removeItem: vi.fn((key) => {
        delete mockStore[key];
      }),
      clear: vi.fn(() => {
        mockStore = {};
      }),
      get length() {
        return Object.keys(mockStore).length;
      },
      key: vi.fn((i) => Object.keys(mockStore)[i] || null)
    };
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('provides the mandatory statutory disclaimer', () => {
    expect(OFFICIAL_STATUS_DISCLAIMER).toContain('Statutory Notice & Advisory');
    expect(OFFICIAL_STATUS_DISCLAIMER).toContain('National Food Security Act');
  });

  it('saves, retrieves, and deletes ration dispute records with integrity seal', async () => {
    const record = {
      cardType: 'PHH',
      familyMembers: 4,
      maskedRationCard: 'RC-12****34',
      deficitKg: 5,
      fsaAmount: 114.50,
      dealerShopId: 'FPS-789'
    };

    const saved = await saveRationRecord(record);
    expect(saved.id).toBeDefined();
    expect(saved.integritySeal).toBeDefined();

    const list = getStoredRationRecords();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(saved.id);

    deleteRationRecord(saved.id);
    expect(getStoredRationRecords().length).toBe(0);
  });

  it('manages beneficiary ration settings', () => {
    const initial = getRationSettings();
    expect(initial.cardType).toBeDefined();

    saveRationSettings({ cardType: 'AAY', familyMembers: 5, district: 'Gorakhpur' });
    const updated = getRationSettings();
    expect(updated.cardType).toBe('AAY');
    expect(updated.district).toBe('Gorakhpur');
  });

  it('seeds sample records when vault is empty', async () => {
    const samples = await seedSampleRationRecords();
    expect(samples.length).toBe(2);
    expect(samples[0].id).toContain('SAMPLE');
    expect(samples[0].integritySeal).toBeDefined();

    // second call should return existing without re-seeding
    const repeated = await seedSampleRationRecords();
    expect(repeated.length).toBe(2);
  });

  it('exports a compliant dossier with disclaimer', () => {
    const record = { id: 'TEST-1', cardType: 'AAY', deficitKg: 7 };
    const exported = exportRationDossier(record);
    const parsed = JSON.parse(exported);
    expect(parsed.dossierType).toBe('NFSA_2013_RATION_DISPUTE_DOSSIER');
    expect(parsed.disclaimer).toBeDefined();
    expect(parsed.record.id).toBe('TEST-1');
  });
});
