import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OFFICIAL_STATUS_DISCLAIMER,
  getFoodSafetyCases,
  getFoodSafetyCaseById,
  saveFoodSafetyCase,
  deleteFoodSafetyCase,
  exportFoodSafetyCasesDossier,
  verifyFoodSafetyIntegrity,
} from './foodSafetyStorage.js';

const makeStorage = () => {
  const data = new Map();
  return {
    getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
    setItem: vi.fn((k, v) => data.set(k, String(v))),
    removeItem: vi.fn((k) => data.delete(k)),
    clear: vi.fn(() => data.clear()),
    key: vi.fn((i) => [...data.keys()][i] ?? null),
    get length() {
      return data.size;
    },
  };
};

describe('foodSafetyStorage (#1339)', () => {
  let storage;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
  });

  it('seeds a demonstrative sample case when the vault is empty', () => {
    const cases = getFoodSafetyCases();
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].id).toBe('fssai-case-sample-001');
    expect(cases[0].productName).toContain('Paneer Butter Masala');
  });

  it('saves, computes SHA-256 seal, and updates a food safety case', async () => {
    const newCase = {
      fboName: 'Fresh Dairy Parlour',
      productName: 'Full Cream Milk 500ml',
      batchNumber: 'MLK-001',
      actualMedicalBills: 3500,
      injuryTier: 'TEMPORARY_INJURY',
    };

    const saved = await saveFoodSafetyCase(newCase);
    expect(saved.id).toBeDefined();
    expect(saved.integritySeal).toBeDefined();
    expect(saved.officialDisclaimer).toBe(OFFICIAL_STATUS_DISCLAIMER);

    const fetched = getFoodSafetyCaseById(saved.id);
    expect(fetched.productName).toBe('Full Cream Milk 500ml');
  });

  it('verifies tamper-evident integrity seal properly and detects alteration', async () => {
    const newCase = {
      id: 'test-case-integrity',
      fboName: 'Spicy Treats',
      productName: 'Chilli Powder 100g',
      purchaseInvoice: 'BILL-123',
    };

    const saved = await saveFoodSafetyCase(newCase);
    const isValid = await verifyFoodSafetyIntegrity(saved);
    expect(isValid).toBe(true);

    // Tamper with record
    const tampered = { ...saved, actualMedicalBills: 999999 };
    const isTamperedValid = await verifyFoodSafetyIntegrity(tampered);
    expect(isTamperedValid).toBe(false);
  });

  it('deletes a case by id', async () => {
    await saveFoodSafetyCase({
      id: 'case-to-delete',
      fboName: 'Quick Bakery',
    });
    expect(getFoodSafetyCaseById('case-to-delete')).not.toBeNull();

    deleteFoodSafetyCase('case-to-delete');
    expect(getFoodSafetyCaseById('case-to-delete')).toBeNull();
  });

  it('exports cases into a structured JSON dossier with official disclaimer', () => {
    const dossierStr = exportFoodSafetyCasesDossier();
    const parsed = JSON.parse(dossierStr);
    expect(parsed.totalCases).toBeGreaterThan(0);
    expect(parsed.disclaimer).toBe(OFFICIAL_STATUS_DISCLAIMER);
    expect(Array.isArray(parsed.cases)).toBe(true);
  });
});
