/**
 * NFSA Ration Entitlement & Biometric Exception Storage
 * Local-first client vault using localStorage with SHA-256 integrity seal,
 * sample seed data, and official status disclaimers.
 */

export const STORAGE_KEYS = {
  VAULT: 'civicbridge_nfsa_ration_vault',
  SETTINGS: 'civicbridge_nfsa_ration_settings'
};

export const OFFICIAL_STATUS_DISCLAIMER =
  'Statutory Notice & Advisory: The National Food Security Act (NFSA 2013) Redressal Workspace is an independent, client-side civic empowerment tool designed to assist citizens in auditing grain entitlements, calculating Food Security Allowances, and preparing statutory petitions for the District Grievance Redressal Officer (Section 15) and State Food Commission (Section 16). This platform operates purely offline in your local browser and does not constitute formal filing until submitted directly to your district administration.';

/**
 * Generate a deterministic SHA-256-like hex seal for integrity verification
 */
export async function generateIntegritySeal(record) {
  try {
    const payload = JSON.stringify({
      id: record.id,
      cardType: record.cardType,
      maskedRationCard: record.maskedRationCard,
      deficitKg: record.deficitKg,
      fsaAmount: record.fsaAmount,
      dealerShopId: record.dealerShopId,
      timestamp: record.createdAt || record.date
    });

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    }
  } catch {
    // fallback if web crypto is unavailable
  }
  // deterministic hash fallback
  let hash = 0;
  const str = JSON.stringify(record);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `NFSA-${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export function getStoredRationRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VAULT);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read NFSA ration records from storage', err);
    return [];
  }
}

export async function saveRationRecord(record) {
  try {
    const records = getStoredRationRecords();
    const id = record.id || `NFSA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = record.createdAt || new Date().toISOString();
    
    const prepared = {
      ...record,
      id,
      createdAt,
      updatedAt: new Date().toISOString()
    };

    if (!prepared.integritySeal) {
      prepared.integritySeal = await generateIntegritySeal(prepared);
    }

    const existingIndex = records.findIndex(r => r.id === id);
    if (existingIndex >= 0) {
      records[existingIndex] = prepared;
    } else {
      records.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(records));
    return prepared;
  } catch (err) {
    console.error('Failed to save NFSA ration record', err);
    return null;
  }
}

export function deleteRationRecord(id) {
  try {
    const records = getStoredRationRecords().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(records));
    return true;
  } catch (err) {
    console.error('Failed to delete NFSA ration record', err);
    return false;
  }
}

export function clearAllRationRecords() {
  try {
    localStorage.removeItem(STORAGE_KEYS.VAULT);
    return true;
  } catch (err) {
    console.error('Failed to clear NFSA ration storage', err);
    return false;
  }
}

export function getRationSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      return {
        cardType: 'PHH',
        familyMembers: 4,
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        scheme: 'PMGKAY_FREE',
        fairPriceShopNo: 'FPS-4421-VNS',
        dealerName: 'Shri Kashi PDS Center'
      };
    }
    return JSON.parse(raw);
  } catch {
    return { cardType: 'PHH', familyMembers: 4 };
  }
}

export function saveRationSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('Failed to save NFSA ration settings', err);
    return false;
  }
}

export function exportRationDossier(record) {
  return JSON.stringify({
    dossierType: 'NFSA_2013_RATION_DISPUTE_DOSSIER',
    exportedAt: new Date().toISOString(),
    disclaimer: OFFICIAL_STATUS_DISCLAIMER,
    record
  }, null, 2);
}

/**
 * Seeds sample records if the vault is currently empty
 */
export async function seedSampleRationRecords() {
  const existing = getStoredRationRecords();
  if (existing.length > 0) return existing;

  const samples = [
    {
      id: 'NFSA-SAMPLE-001',
      title: 'Biometric Sensor Failure & Refusal of Fallback at FPS #142',
      beneficiaryName: 'Rameshwar Lal',
      maskedRationCard: 'RC-UP****8921',
      maskedAadhaar: '98******4321',
      cardType: 'PHH',
      familyMembers: 5,
      fairPriceShopNo: 'FPS-142-VARANASI',
      dealerName: 'Suresh Chandra PDS Retailer',
      shopLocation: 'Shivpur Ward 14, Varanasi',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      distributionMonth: 'October 2026',
      entitledKg: 25,
      actualDeliveredKg: 0,
      deficitKg: 25,
      deficitPercentage: 100,
      expectedCost: 0,
      actualChargedRupees: 0,
      overchargeRupees: 0,
      fsaAmount: 572.50,
      fsaStatus: 'CLAIM_SUBMITTED_DGRO',
      biometricFailureMode: 'FINGERPRINT_ATTRITION',
      fallbackOffered: 'NONE',
      isIllegalDenial: true,
      selectedViolations: [
        'Refusal of ration solely due to fingerprint attrition (manual laborer)',
        'Unlawful denial of OTP or Manual Exemption Register fallback under Section 12',
        'Failure to distribute monthly entitlement within prescribed calendar month'
      ],
      stage: 'DGRO_PETITION_READY',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'NFSA-SAMPLE-002',
      title: 'AAY 35kg Entitlement Short-Weighing & Illegal ₹150 Handling Charge',
      beneficiaryName: 'Smt. Shanti Devi',
      maskedRationCard: 'RC-UP****1108',
      maskedAadhaar: '45******8819',
      cardType: 'AAY',
      familyMembers: 6,
      fairPriceShopNo: 'FPS-089-BHADOHI',
      dealerName: 'Gyanpur Consumer Co-op Store',
      shopLocation: 'Main Bazar, Gyanpur, Bhadohi',
      district: 'Bhadohi',
      state: 'Uttar Pradesh',
      distributionMonth: 'September 2026',
      entitledKg: 35,
      actualDeliveredKg: 28,
      deficitKg: 7,
      deficitPercentage: 20,
      expectedCost: 0,
      actualChargedRupees: 150,
      overchargeRupees: 150,
      fsaAmount: 160.50,
      fsaStatus: 'DGRO_ORDER_PENDING',
      biometricFailureMode: 'NONE',
      fallbackOffered: 'NOT_APPLICABLE',
      isIllegalDenial: false,
      selectedViolations: [
        'Unlawful deduction of 7 kg foodgrains citing "tare/sack weight"',
        'Extortion of ₹150 under unauthorized pretext of transport and handling',
        'Refusal to provide printed e-PoS transaction receipt'
      ],
      stage: 'FOOD_COMMISSION_APPEAL_READY',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    }
  ];

  for (const s of samples) {
    s.integritySeal = await generateIntegritySeal(s);
  }

  localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(samples));
  return samples;
}
