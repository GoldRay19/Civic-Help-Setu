/**
 * @file trafficChallanStorage.js
 * @description Local-first evidentiary storage layer for Traffic E-Challan disputes with SHA-256 seal.
 */

export const TRAFFIC_CHALLAN_VAULT_KEY = 'civicbridge_echallan_dispute_vault';
export const TRAFFIC_CHALLAN_SETTINGS_KEY = 'civicbridge_echallan_settings';

export const OFFICIAL_STATUS_DISCLAIMER =
  'CITIZEN WORKSPACE RECORD & INTEGRITY SEAL: This traffic e-challan dispute record is generated and stored locally in your browser for evidentiary preparation and drafting representations under Rule 167A and Section 208 of the Motor Vehicles Act. It does NOT automatically cancel the fine, lodge court contestation, or communicate with the official Parivahan or Virtual Court systems.';

/**
 * Computes a deterministic SHA-256 hash digest for a traffic challan case.
 *
 * @param {Object} caseObj
 * @returns {Promise<string>} Hex digest
 */
export async function computeChallanDigest(caseObj) {
  if (!caseObj) return '';
  const canonicalPayload = {
    id: caseObj.id,
    vehicleNumber: caseObj.vehicleNumber || '',
    challanNumber: caseObj.challanNumber || '',
    challanDate: caseObj.challanDate || '',
    fineAmount: Number(caseObj.fineAmount) || 0,
    allegedOffence: caseObj.allegedOffence || '',
    selectedDefects: (caseObj.selectedDefects || []).slice().sort(),
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
 * Verifies if a challan case seal matches its canonical payload.
 *
 * @param {Object} caseObj
 * @returns {Promise<boolean>} True if digest matches
 */
export async function verifyChallanIntegrity(caseObj) {
  if (!caseObj || !caseObj.integritySeal) return false;
  const recomputed = await computeChallanDigest(caseObj);
  return recomputed === caseObj.integritySeal;
}

/**
 * Creates initial demonstrative sample case for immediate testing.
 */
function createInitialSampleCase() {
  return {
    id: 'challan-case-sample-001',
    ownerName: 'Vikramaditya Rao',
    ownerContact: 'vikram.rao@example.com / 9845012345',
    ownerAddress: '14, Palm Avenue, Indiranagar, Bengaluru 560038',
    vehicleNumber: 'KA-01-MJ-4099',
    vehicleClass: 'Motor Car (Light Motor Vehicle)',
    challanNumber: 'KA26110998341A',
    challanDate: '2026-02-18',
    challanTime: '14:22:10',
    location: 'Outer Ring Road, Near Bellandur Junction, Bengaluru',
    allegedOffence: 'Section 183 - Exceeding Permissible Speed Limit (Alleged: 88 km/h in 60 km/h zone)',
    fineAmount: 2000,
    daysToService: 24, // Exceeded 15-day service window
    selectedDefects: ['uncalibrated_camera', 'delayed_notice', 'cloned_plate_alibi'],
    rule167AChecks: {
      clear_number_plate: false,
      vehicle_characteristics: true,
      lane_demarcation: false,
      exact_gps_location: true,
      precise_timestamp: true,
      annual_calibration: false,
    },
    defectNotes: 'ANPR camera capture heavily blurred by rain reflection. Speed radar calibration expired 4 months prior to capture date. Fastag records verify vehicle was parked at Kempegowda Airport T2 at 14:22 hrs.',
    alibiDetails: 'Fastag Transaction ID FT-9901412 timestamped 13:45 to 16:15 at Airport T2 parking gate.',
    status: 'VIRTUAL_COURT_CONTESTED',
    createdAt: '2026-02-20T11:00:00.000Z',
    updatedAt: '2026-02-20T11:00:00.000Z',
  };
}

/**
 * Retrieves all stored challan cases. Seeds initial demonstrative record if empty.
 *
 * @returns {Array<Object>} List of cases
 */
export function getChallanCases() {
  try {
    const raw = localStorage.getItem(TRAFFIC_CHALLAN_VAULT_KEY);
    if (!raw) {
      const sample = createInitialSampleCase();
      localStorage.setItem(TRAFFIC_CHALLAN_VAULT_KEY, JSON.stringify([sample]));
      return [sample];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves a single challan case by ID.
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function getChallanCaseById(id) {
  const cases = getChallanCases();
  return cases.find((c) => c.id === id) || null;
}

/**
 * Saves or updates a challan case with SHA-256 integrity seal.
 *
 * @param {Object} caseData
 * @returns {Promise<Object>} Saved record
 */
export async function saveChallanCase(caseData) {
  const cases = getChallanCases();
  const existingIdx = cases.findIndex((c) => c.id === caseData.id);

  const now = new Date().toISOString();
  const recordToSave = {
    ...caseData,
    id: caseData.id || `challan-case-${Date.now()}`,
    updatedAt: now,
    createdAt: caseData.createdAt || now,
    officialDisclaimer: OFFICIAL_STATUS_DISCLAIMER,
  };

  const seal = await computeChallanDigest(recordToSave);
  recordToSave.integritySeal = seal;

  if (existingIdx >= 0) {
    cases[existingIdx] = recordToSave;
  } else {
    cases.unshift(recordToSave);
  }

  localStorage.setItem(TRAFFIC_CHALLAN_VAULT_KEY, JSON.stringify(cases));
  return recordToSave;
}

/**
 * Deletes a challan case by ID.
 *
 * @param {string} id
 * @returns {boolean} True if deleted
 */
export function deleteChallanCase(id) {
  const cases = getChallanCases();
  const filtered = cases.filter((c) => c.id !== id);
  localStorage.setItem(TRAFFIC_CHALLAN_VAULT_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Exports all challan cases as a structured JSON dossier.
 *
 * @returns {string} JSON string
 */
export function exportChallanCasesDossier() {
  const cases = getChallanCases();
  const dossier = {
    exportDate: new Date().toISOString(),
    totalCases: cases.length,
    disclaimer: OFFICIAL_STATUS_DISCLAIMER,
    cases,
  };
  return JSON.stringify(dossier, null, 2);
}
