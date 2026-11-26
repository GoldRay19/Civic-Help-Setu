import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OFFICIAL_STATUS_DISCLAIMER,
  getChallanCases,
  getChallanCaseById,
  saveChallanCase,
  deleteChallanCase,
  exportChallanCasesDossier,
  verifyChallanIntegrity,
} from './trafficChallanStorage.js';

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

describe('trafficChallanStorage (#1340)', () => {
  let storage;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
  });

  it('seeds demonstrative sample case when the vault is empty', () => {
    const cases = getChallanCases();
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].id).toBe('challan-case-sample-001');
    expect(cases[0].vehicleNumber).toBe('KA-01-MJ-4099');
  });

  it('saves and updates a challan case with SHA-256 integrity seal', async () => {
    const newCase = {
      vehicleNumber: 'DL-01-AB-1234',
      challanNumber: 'DL12345678',
      fineAmount: 1000,
      allegedOffence: 'Section 184 - Red Light Violation',
    };

    const saved = await saveChallanCase(newCase);
    expect(saved.id).toBeDefined();
    expect(saved.integritySeal).toBeDefined();
    expect(saved.officialDisclaimer).toBe(OFFICIAL_STATUS_DISCLAIMER);

    const retrieved = getChallanCaseById(saved.id);
    expect(retrieved.vehicleNumber).toBe('DL-01-AB-1234');
  });

  it('verifies tamper-evident integrity seal and flags alterations', async () => {
    const newCase = {
      id: 'test-case-seal',
      vehicleNumber: 'MH-02-CD-5678',
      challanNumber: 'MH99887766',
      fineAmount: 500,
    };

    const saved = await saveChallanCase(newCase);
    const valid = await verifyChallanIntegrity(saved);
    expect(valid).toBe(true);

    const tampered = { ...saved, fineAmount: 50000 };
    const tamperedValid = await verifyChallanIntegrity(tampered);
    expect(tamperedValid).toBe(false);
  });

  it('deletes a challan case by id', async () => {
    await saveChallanCase({
      id: 'case-to-delete',
      vehicleNumber: 'UP-32-ZZ-9999',
    });
    expect(getChallanCaseById('case-to-delete')).not.toBeNull();

    deleteChallanCase('case-to-delete');
    expect(getChallanCaseById('case-to-delete')).toBeNull();
  });

  it('exports cases into a structured JSON dossier with official disclaimer', () => {
    const jsonStr = exportChallanCasesDossier();
    const dossier = JSON.parse(jsonStr);
    expect(dossier.totalCases).toBeGreaterThan(0);
    expect(dossier.disclaimer).toBe(OFFICIAL_STATUS_DISCLAIMER);
    expect(Array.isArray(dossier.cases)).toBe(true);
  });
});
