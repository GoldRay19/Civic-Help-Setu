/**
 * @file rbiOmbudsmanStorage.js
 * @description Local-first evidentiary storage layer for RBI Banking Ombudsman disputes with SHA-256 seal.
 */

export const RBI_BANKING_VAULT_KEY = 'civicbridge_rbi_banking_vault';
export const RBI_BANKING_SETTINGS_KEY = 'civicbridge_rbi_banking_settings';

export const OFFICIAL_STATUS_DISCLAIMER =
  'CITIZEN WORKSPACE RECORD & INTEGRITY SEAL: This banking service deficiency and compensation case record is generated and stored locally in your browser. It is intended for citizen evidentiary organization, TAT penalty calculation, and drafting petitions to the Bank Principal Nodal Officer (PNO) and RBI Ombudsman. It does NOT automatically file complaints on the RBI CMS portal (cms.rbi.org.in) or execute monetary awards.';

/**
 * Computes a deterministic SHA-256 hash digest for an RBI banking case.
 *
 * @param {Object} caseObj
 * @returns {Promise<string>} Hex digest
 */
export async function computeBankingDigest(caseObj) {
  if (!caseObj) return '';
  const canonicalPayload = {
    id: caseObj.id,
    bankName: caseObj.bankName || '',
    accountNumber: caseObj.accountNumber || '',
    disputeType: caseObj.disputeType || '',
    transactionAmount: Number(caseObj.transactionAmount) || 0,
    transactionDate: caseObj.transactionDate || '',
    reportingDays: Number(caseObj.reportingDays) || 0,
    selectedDeficiencies: (caseObj.selectedDeficiencies || []).slice().sort(),
    createdAt: caseObj.createdAt || '',
  };

  const jsonStr = JSON.stringify(canonicalPayload);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonStr);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for non-browser / unit test mock environment
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    hash = (hash << 5) - hash + jsonStr.charCodeAt(i);
    hash |= 0;
  }
  return `sha256-mock-${Math.abs(hash).toString(16)}`;
}

/**
 * Verifies if a banking case seal matches its canonical payload.
 *
 * @param {Object} caseObj
 * @returns {Promise<boolean>} True if digest matches
 */
export async function verifyBankingIntegrity(caseObj) {
  if (!caseObj || !caseObj.integritySeal) return false;
  const recomputed = await computeBankingDigest(caseObj);
  return recomputed === caseObj.integritySeal;
}

/**
 * Generates an initial sample case for immediate demonstrative usability.
 */
function createInitialSampleCase() {
  return {
    id: 'rbi-case-sample-001',
    complainantName: 'Ananya Sengupta',
    complainantContact: 'ananya.s@example.com / 9830012345',
    complainantAddress: 'Flat 3B, Lake View Enclave, Salt Lake Sector 2, Kolkata 700091',
    bankName: 'Apex National Commercial Bank',
    branchName: 'Salt Lake City Centre Branch (IFSC: APEX0001099)',
    accountNumber: '918020048123',
    accountType: 'SAVINGS_CURRENT',
    disputeType: 'UNAUTHORIZED_DEBIT',
    channelId: 'UPI_FAILED',
    transactionAmount: 48500,
    transactionDate: '2026-02-12',
    reportingDays: 2, // Reported in 2 days -> Zero Customer Liability
    pnoRefNumber: 'PNO-APEX-2026-8812',
    pnoComplaintDate: '2026-02-15',
    selectedDeficiencies: ['unauthorized_debit', 'failed_transaction_delay'],
    incidentDetails: 'Fraudulent UPI debit of ₹48,500 without SMS OTP or transaction trigger while phone was in custody. Reported to bank fraud desk within 18 hours. Bank failed to credit shadow reversal within 10 days.',
    status: 'PNO_ESCALATED',
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z',
  };
}

/**
 * Retrieves all stored banking cases. Seeds initial demonstrative record if empty.
 *
 * @returns {Array<Object>} List of cases
 */
export function getBankingCases() {
  try {
    const raw = localStorage.getItem(RBI_BANKING_VAULT_KEY);
    if (!raw) {
      const sample = createInitialSampleCase();
      localStorage.setItem(RBI_BANKING_VAULT_KEY, JSON.stringify([sample]));
      return [sample];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves a single banking case by ID.
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function getBankingCaseById(id) {
  const cases = getBankingCases();
  return cases.find((c) => c.id === id) || null;
}

/**
 * Saves or updates a banking case with SHA-256 integrity seal.
 *
 * @param {Object} caseData
 * @returns {Promise<Object>} Saved record
 */
export async function saveBankingCase(caseData) {
  const cases = getBankingCases();
  const existingIdx = cases.findIndex((c) => c.id === caseData.id);

  const now = new Date().toISOString();
  const recordToSave = {
    ...caseData,
    id: caseData.id || `rbi-case-${Date.now()}`,
    updatedAt: now,
    createdAt: caseData.createdAt || now,
    officialDisclaimer: OFFICIAL_STATUS_DISCLAIMER,
  };

  const seal = await computeBankingDigest(recordToSave);
  recordToSave.integritySeal = seal;

  if (existingIdx >= 0) {
    cases[existingIdx] = recordToSave;
  } else {
    cases.unshift(recordToSave);
  }

  localStorage.setItem(RBI_BANKING_VAULT_KEY, JSON.stringify(cases));
  return recordToSave;
}

/**
 * Deletes a banking case by ID.
 *
 * @param {string} id
 * @returns {boolean} True if deleted
 */
export function deleteBankingCase(id) {
  const cases = getBankingCases();
  const filtered = cases.filter((c) => c.id !== id);
  localStorage.setItem(RBI_BANKING_VAULT_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Exports all banking cases as a structured JSON dossier.
 *
 * @returns {string} JSON string
 */
export function exportBankingCasesDossier() {
  const cases = getBankingCases();
  const dossier = {
    exportDate: new Date().toISOString(),
    totalCases: cases.length,
    disclaimer: OFFICIAL_STATUS_DISCLAIMER,
    cases,
  };
  return JSON.stringify(dossier, null, 2);
}
