/**
 * @file foodSafetyStorage.js
 * @description Local-first evidentiary storage layer for Food Safety & Standards cases with SHA-256 seal.
 */

export const FOOD_SAFETY_VAULT_KEY = 'civicbridge_food_safety_vault';
export const FOOD_SAFETY_SETTINGS_KEY = 'civicbridge_food_safety_settings';

export const OFFICIAL_STATUS_DISCLAIMER =
  'CITIZEN WORKSPACE RECORD & INTEGRITY SEAL: This food safety case record is created and stored strictly on your local browser device. It is intended for citizen evidentiary organization, Schedule 4 sanitary audits, and drafting petitions before the Adjudicating Officer (ADM) or Designated Officer. It does NOT constitute an official government case file or an automated filing on the FSSAI / FoSCoS portal.';

/**
 * Computes a deterministic SHA-256 hash digest for a food safety case.
 *
 * @param {Object} caseObj
 * @returns {Promise<string>} Hex digest
 */
export async function computeFoodSafetyDigest(caseObj) {
  if (!caseObj) return '';
  const canonicalPayload = {
    id: caseObj.id,
    fboName: caseObj.fboName || '',
    fboLicenseNumber: caseObj.fboLicenseNumber || '',
    productName: caseObj.productName || '',
    batchNumber: caseObj.batchNumber || '',
    purchaseDate: caseObj.purchaseDate || '',
    purchaseInvoice: caseObj.purchaseInvoice || '',
    injuryTier: caseObj.injuryTier || 'NONE',
    actualMedicalBills: Number(caseObj.actualMedicalBills) || 0,
    selectedViolations: (caseObj.selectedViolations || []).slice().sort(),
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

  // Fallback for non-browser environment
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    hash = (hash << 5) - hash + jsonStr.charCodeAt(i);
    hash |= 0;
  }
  return `sha256-mock-${Math.abs(hash).toString(16)}`;
}

/**
 * Verifies if a food safety case seal matches its canonical payload.
 *
 * @param {Object} caseObj
 * @returns {Promise<boolean>} True if digest matches
 */
export async function verifyFoodSafetyIntegrity(caseObj) {
  if (!caseObj || !caseObj.integritySeal) return false;
  const recomputed = await computeFoodSafetyDigest(caseObj);
  return recomputed === caseObj.integritySeal;
}

/**
 * Generates an initial sample case for immediate demonstrative usability.
 */
function createInitialSampleCase() {
  return {
    id: 'fssai-case-sample-001',
    complainantName: 'Meera Deshmukh',
    complainantAddress: 'Flat 402, Green Meadows, Baner, Pune 411045',
    complainantContact: 'meera.deshmukh@example.com / 9876543210',
    fboName: 'Royal Spice Cloud Kitchen (Tiffin Services)',
    fboAddress: 'Shop 12, High Street Commercial Hub, Baner, Pune',
    fboLicenseNumber: '11521038000412',
    productName: 'Paneer Butter Masala Packaged Meal',
    batchNumber: 'BATCH-2026-02-14-K1',
    purchaseDate: '2026-02-14',
    purchaseInvoice: 'INV-RS-99214',
    labReportNumber: '',
    injuryTier: 'TEMPORARY_INJURY',
    actualMedicalBills: 6450,
    daysHospitalized: 2,
    lostWages: 4000,
    selectedViolations: ['extraneous_matter', 'unhygienic_processing', 'unsafe_food'],
    schedule4Checks: {
      potable_water: false,
      cold_chain: false,
      medical_fitness: true,
      pest_control: false,
      cross_contamination: false,
      oil_quality: false,
      waste_disposal: true,
      traceability: true,
    },
    evidenceNotes: 'Dead insect and metallic paint chip discovered in sealed gravy. Severe bacterial gastroenteritis diagnosed at Jeevan Hospital.',
    status: 'FBO_NOTICE_ISSUED',
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z',
  };
}

/**
 * Retrieves all stored food safety cases. Seeds demonstrative sample if vault is empty.
 *
 * @returns {Array<Object>} List of cases
 */
export function getFoodSafetyCases() {
  try {
    const raw = localStorage.getItem(FOOD_SAFETY_VAULT_KEY);
    if (!raw) {
      const sample = createInitialSampleCase();
      localStorage.setItem(FOOD_SAFETY_VAULT_KEY, JSON.stringify([sample]));
      return [sample];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves a single case by ID.
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function getFoodSafetyCaseById(id) {
  const cases = getFoodSafetyCases();
  return cases.find((c) => c.id === id) || null;
}

/**
 * Saves or updates a food safety case with a computed SHA-256 seal.
 *
 * @param {Object} caseData
 * @returns {Promise<Object>} Saved case
 */
export async function saveFoodSafetyCase(caseData) {
  const cases = getFoodSafetyCases();
  const existingIdx = cases.findIndex((c) => c.id === caseData.id);

  const now = new Date().toISOString();
  const recordToSave = {
    ...caseData,
    id: caseData.id || `fssai-case-${Date.now()}`,
    updatedAt: now,
    createdAt: caseData.createdAt || now,
    officialDisclaimer: OFFICIAL_STATUS_DISCLAIMER,
  };

  const seal = await computeFoodSafetyDigest(recordToSave);
  recordToSave.integritySeal = seal;

  if (existingIdx >= 0) {
    cases[existingIdx] = recordToSave;
  } else {
    cases.unshift(recordToSave);
  }

  localStorage.setItem(FOOD_SAFETY_VAULT_KEY, JSON.stringify(cases));
  return recordToSave;
}

/**
 * Deletes a food safety case by ID.
 *
 * @param {string} id
 * @returns {boolean} True if deleted
 */
export function deleteFoodSafetyCase(id) {
  const cases = getFoodSafetyCases();
  const filtered = cases.filter((c) => c.id !== id);
  localStorage.setItem(FOOD_SAFETY_VAULT_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Exports all food safety cases as a JSON dossier.
 *
 * @returns {string} JSON string
 */
export function exportFoodSafetyCasesDossier() {
  const cases = getFoodSafetyCases();
  const dossier = {
    exportDate: new Date().toISOString(),
    totalCases: cases.length,
    disclaimer: OFFICIAL_STATUS_DISCLAIMER,
    cases,
  };
  return JSON.stringify(dossier, null, 2);
}
