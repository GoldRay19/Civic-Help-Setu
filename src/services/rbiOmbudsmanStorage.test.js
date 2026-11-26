import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OFFICIAL_STATUS_DISCLAIMER,
  getBankingCases,
  getBankingCaseById,
  saveBankingCase,
  deleteBankingCase,
  exportBankingCasesDossier,
  verifyBankingIntegrity,
} from './rbiOmbudsmanStorage.js';

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

describe('rbiOmbudsmanStorage (#1341)', () => {
  let storage;

  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
  });

  it('seeds a demonstrative sample case when the vault is empty', () => {
    const cases = getBankingCases();
    expect(cases.length).toBeGreaterThan(0);
    expect(cases[0].id).toBe('rbi-case-sample-001');
    expect(cases[0].bankName).toContain('Apex National Commercial Bank');
  });

  it('saves and updates a banking case with SHA-256 seal', async () => {
    const newCase = {
      bankName: 'HDFC Bank',
      accountNumber: '501002345678',
      transactionAmount: 15000,
      disputeType: 'UNAUTHORIZED_DEBIT',
    };

    const saved = await saveBankingCase(newCase);
    expect(saved.id).toBeDefined();
    expect(saved.integritySeal).toBeDefined();
    expect(saved.officialDisclaimer).toBe(OFFICIAL_STATUS_DISCLAIMER);

    const fetched = getBankingCaseById(saved.id);
    expect(fetched.bankName).toBe('HDFC Bank');
  });

  it('verifies tamper-evident integrity seal and catches alterations', async () => {
    const newCase = {
      id: 'test-case-banking',
      bankName: 'State Bank of India',
      transactionAmount: 25000,
    };

    const saved = await saveBankingCase(newCase);
    const valid = await verifyBankingIntegrity(saved);
    expect(valid).toBe(true);

    const tampered = { ...saved, transactionAmount: 999999 };
    const tamperedValid = await verifyBankingIntegrity(tampered);
    expect(tamperedValid).toBe(false);
  });

  it('deletes a banking case by id', async () => {
    await saveBankingCase({
      id: 'case-to-delete-rbi',
      bankName: 'Punjab National Bank',
    });
    expect(getBankingCaseById('case-to-delete-rbi')).not.toBeNull();

    deleteBankingCase('case-to-delete-rbi');
    expect(getBankingCaseById('case-to-delete-rbi')).toBeNull();
  });

  it('exports cases into a structured JSON dossier with official disclaimer', () => {
    const jsonStr = exportBankingCasesDossier();
    const parsed = JSON.parse(jsonStr);
    expect(parsed.totalCases).toBeGreaterThan(0);
    expect(parsed.disclaimer).toBe(OFFICIAL_STATUS_DISCLAIMER);
    expect(Array.isArray(parsed.cases)).toBe(true);
  });
});
