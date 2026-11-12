/**
 * Civic Service Accessibility and Language Coverage Service (#146)
 *
 * Normalizes, filters, and formats verified public office accessibility features,
 * language support capabilities, and facility review metadata.
 *
 * Strict Compliance:
 * - Unknown attributes are NEVER treated as available or unavailable; they are explicitly 'unknown'.
 * - Incomplete or unverified records are handled gracefully without runtime errors.
 */

export const ACCESSIBILITY_FACILITIES = {
  WHEELCHAIR_RAMP: 'wheelchairRamp',
  ELEVATOR: 'elevator',
  ACCESSIBLE_RESTROOM: 'accessibleRestroom',
  BRAILLE_SIGNAGE: 'brailleSignage',
  ASSISTIVE_LISTENING: 'assistiveListening',
  SIGN_LANGUAGE: 'signLanguageSupport',
  TACTILE_PAVING: 'tactilePaving',
  ACCESSIBLE_PARKING: 'accessibleParking',
};

export const FACILITY_LABELS = {
  [ACCESSIBILITY_FACILITIES.WHEELCHAIR_RAMP]: 'Wheelchair Ramp / Step-Free Entry',
  [ACCESSIBILITY_FACILITIES.ELEVATOR]: 'Accessible Lift / Elevator',
  [ACCESSIBILITY_FACILITIES.ACCESSIBLE_RESTROOM]: 'Accessible Restroom',
  [ACCESSIBILITY_FACILITIES.BRAILLE_SIGNAGE]: 'Braille & High-Contrast Signage',
  [ACCESSIBILITY_FACILITIES.ASSISTIVE_LISTENING]: 'Assistive Listening System',
  [ACCESSIBILITY_FACILITIES.SIGN_LANGUAGE]: 'Sign Language Support',
  [ACCESSIBILITY_FACILITIES.TACTILE_PAVING]: 'Tactile Paving Guiding Paths',
  [ACCESSIBILITY_FACILITIES.ACCESSIBLE_PARKING]: 'Designated Accessible Parking',
};

export const COMMON_OFFICE_LANGUAGES = [
  'Hindi',
  'English',
  'Bengali',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Gujarati',
  'Malayalam',
  'Odia',
  'Punjabi',
  'Assamese',
  'Urdu',
];

/**
 * Normalizes boolean/unknown flag.
 * If boolean, returns boolean. If null/undefined/unspecified, returns null (unknown).
 */
export const normalizeAttributeStatus = (val) => {
  if (typeof val === 'boolean') return val;
  if (val === 'available' || val === 'yes' || val === 1) return true;
  if (val === 'unavailable' || val === 'no' || val === 0) return false;
  return null; // Explicitly unknown
};

/**
 * Returns readable status tag for a facility attribute: 'available' | 'unavailable' | 'unknown'
 */
export const getAttributeStatus = (val) => {
  const norm = normalizeAttributeStatus(val);
  if (norm === true) return 'available';
  if (norm === false) return 'unavailable';
  return 'unknown';
};

const isValidVerificationDate = (date) =>
  typeof date === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`));

const isDirectSourceUrl = (url) => {
  if (typeof url !== 'string') return false;
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Normalizes an office's accessibility and language metadata safely.
 */
export const normalizeAccessibilityRecord = (raw = {}) => {
  const rawAccess = raw.accessibility || {};
  const rawLang = raw.languageCoverage || {};
  const rawAudit = raw.auditMetadata || {};
  const attributeKeys = Object.values(ACCESSIBILITY_FACILITIES);
  const accessibilityEvidence = Object.fromEntries(
    attributeKeys.map((key) => {
      const evidence = rawAudit.accessibilityAttributes?.[key];
      if (!evidence || !isDirectSourceUrl(evidence.sourceUrl) || !isValidVerificationDate(evidence.verificationDate)) {
        return [key, null];
      }
      return [
        key,
        {
          sourceUrl: evidence.sourceUrl,
          sourceName: typeof evidence.sourceName === 'string' ? evidence.sourceName.trim() : evidence.sourceUrl,
          verificationDate: evidence.verificationDate,
        },
      ];
    })
  );
  const accessibility = Object.fromEntries(
    attributeKeys.map((key) => [
      key,
      accessibilityEvidence[key] ? normalizeAttributeStatus(rawAccess[key]) : null,
    ])
  );

  const cleanLangList = (list) =>
    Array.isArray(list)
      ? [...new Set(list.filter((l) => typeof l === 'string' && l.trim()).map((l) => l.trim()))]
      : [];

  const languageCoverage = {
    supportedLanguages: cleanLangList(rawLang.supportedLanguages),
    helpdeskLanguages: cleanLangList(rawLang.helpdeskLanguages),
    formsAvailableLanguages: cleanLangList(rawLang.formsAvailableLanguages),
    hasSignLanguageInterpreter: normalizeAttributeStatus(rawLang.hasSignLanguageInterpreter),
  };

  const hasAttributeEvidence = Object.values(accessibilityEvidence).some(Boolean);
  const auditMetadata = {
    verifiedBy: hasAttributeEvidence && typeof rawAudit.verifiedBy === 'string' ? rawAudit.verifiedBy.trim() : null,
    reviewDate: hasAttributeEvidence && isValidVerificationDate(rawAudit.reviewDate) ? rawAudit.reviewDate : null,
    sourceUrl: hasAttributeEvidence && isDirectSourceUrl(rawAudit.sourceUrl) ? rawAudit.sourceUrl.trim() : '',
    verificationNotes: hasAttributeEvidence && typeof rawAudit.verificationNotes === 'string' ? rawAudit.verificationNotes.trim() : '',
  };

  return {
    ...raw,
    accessibility,
    accessibilityEvidence,
    languageCoverage,
    auditMetadata,
  };
};

/**
 * Aggregates summary counts of verified, unverified and unavailable facilities
 */
export const getFacilityAuditSummary = (office) => {
  if (!office) {
    return { availableCount: 0, unavailableCount: 0, unknownCount: 0, total: 0, reviewDate: null };
  }

  const record = normalizeAccessibilityRecord(office);
  const entries = Object.values(record.accessibility);

  let availableCount = 0;
  let unavailableCount = 0;
  let unknownCount = 0;

  for (const val of entries) {
    if (val === true) availableCount++;
    else if (val === false) unavailableCount++;
    else unknownCount++;
  }

  return {
    availableCount,
    unavailableCount,
    unknownCount,
    total: entries.length,
    reviewDate: record.auditMetadata.reviewDate,
    verifiedBy: record.auditMetadata.verifiedBy,
  };
};

/**
 * Filters offices by accessibility facilities, language coverage, and locality
 * without requiring GPS coordinates.
 */
export const filterOfficesByAccessibilityAndLanguage = ({
  offices = [],
  requiredFacilities = [],
  requiredLanguages = [],
  localityQuery = '',
  state = '',
  district = '',
}) => {
  const cleanLocality = (localityQuery || '').trim().toLowerCase();

  return offices
    .map(normalizeAccessibilityRecord)
    .filter((office) => {
      // 1. Locality text search (does NOT require geolocation)
      if (cleanLocality) {
        const nameMatch = (office.name || '').toLowerCase().includes(cleanLocality);
        const cityMatch = (office.city || '').toLowerCase().includes(cleanLocality);
        const districtMatch = (office.district || '').toLowerCase().includes(cleanLocality);
        const stateMatch = (office.state || '').toLowerCase().includes(cleanLocality);
        const pinMatch = (office.pincode || '').includes(cleanLocality);
        const addrMatch = (office.address || '').toLowerCase().includes(cleanLocality);
        const landmarkMatch = (office.landmark || '').toLowerCase().includes(cleanLocality);

        if (!nameMatch && !cityMatch && !districtMatch && !stateMatch && !pinMatch && !addrMatch && !landmarkMatch) {
          return false;
        }
      }

      // 2. State & District filter
      if (state && office.state && office.state.toLowerCase() !== state.toLowerCase()) {
        return false;
      }
      if (district && office.district && office.district.toLowerCase() !== district.toLowerCase()) {
        return false;
      }

      // 3. Required facilities filter: ONLY offices where attribute === true
      // (unknown or false offices are excluded from strict positive filter)
      if (Array.isArray(requiredFacilities) && requiredFacilities.length > 0) {
        for (const facilityKey of requiredFacilities) {
          if (office.accessibility[facilityKey] !== true) {
            return false;
          }
        }
      }

      // 4. Required languages filter
      if (Array.isArray(requiredLanguages) && requiredLanguages.length > 0) {
        const supported = (office.languageCoverage.supportedLanguages || []).map((l) => l.toLowerCase());
        const helpdesk = (office.languageCoverage.helpdeskLanguages || []).map((l) => l.toLowerCase());
        const combined = [...new Set([...supported, ...helpdesk])];

        const matchesAll = requiredLanguages.every((reqLang) =>
          combined.includes(reqLang.trim().toLowerCase())
        );

        if (!matchesAll) {
          return false;
        }
      }

      return true;
    });
};


export const OFFICE_AUDIT_STORAGE_KEY = 'civicbridge_office_accessibility_audits';

let memoryStore = {};
const getStorage = () => {
  try {
    if (typeof globalThis.localStorage !== 'undefined' && globalThis.localStorage !== null) {
      return globalThis.localStorage;
    }
  } catch {
    // fallback
  }
  return {
    getItem: (key) => memoryStore[key] ?? null,
    setItem: (key, val) => {
      memoryStore[key] = String(val);
    },
    removeItem: (key) => {
      delete memoryStore[key];
    },
    clear: () => {
      memoryStore = {};
    },
  };
};

const FACILITY_WEIGHTS = {
  [ACCESSIBILITY_FACILITIES.WHEELCHAIR_RAMP]: 25,
  [ACCESSIBILITY_FACILITIES.ELEVATOR]: 25,
  [ACCESSIBILITY_FACILITIES.ACCESSIBLE_RESTROOM]: 20,
  [ACCESSIBILITY_FACILITIES.ACCESSIBLE_PARKING]: 15,
  [ACCESSIBILITY_FACILITIES.TACTILE_PAVING]: 15,
};

export const getOfficeAccessibilityAudits = (officeId) => {
  if (!officeId) return [];
  try {
    const raw = getStorage().getItem(OFFICE_AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw);
    return all.filter((a) => a.officeId === String(officeId));
  } catch {
    return [];
  }
};

export const recordOfficeAccessibilityAudit = (officeId, auditPayload = {}) => {
  if (!officeId) return null;
  const newAudit = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    officeId: String(officeId),
    timestamp: new Date().toISOString(),
    facilities: auditPayload.facilities || {},
    notes: typeof auditPayload.notes === 'string' ? auditPayload.notes.slice(0, 300) : '',
    verifiedByCitizen: true,
  };

  try {
    const storage = getStorage();
    const raw = storage.getItem(OFFICE_AUDIT_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [newAudit, ...existing].slice(0, 100);
    storage.setItem(OFFICE_AUDIT_STORAGE_KEY, JSON.stringify(updated));
    return newAudit;
  } catch {
    return newAudit;
  }
};

export const calculateOfficeAccessibilityScore = (office) => {
  if (!office) {
    return { score: null, level: 'UNKNOWN', color: '#64748b', badges: [] };
  }

  const record = normalizeAccessibilityRecord(office);
  const communityAudits = getOfficeAccessibilityAudits(record.id);

  let earnedPoints = 0;
  let totalPossible = 0;
  const badges = [];

  for (const [facilityKey, weight] of Object.entries(FACILITY_WEIGHTS)) {
    const status = record.accessibility[facilityKey];
    if (status !== null) totalPossible += weight;
    if (status === true) {
      earnedPoints += weight;
      badges.push({ id: facilityKey, label: FACILITY_LABELS[facilityKey], status: 'available' });
    } else if (status === false) {
      badges.push({ id: facilityKey, label: FACILITY_LABELS[facilityKey], status: 'unavailable' });
    } else {
      badges.push({ id: facilityKey, label: FACILITY_LABELS[facilityKey], status: 'unknown' });
    }
  }

  if (totalPossible === 0) {
    return {
      score: null,
      level: 'UNKNOWN',
      color: '#64748b',
      badges,
      communityAuditsCount: communityAudits.length,
      lastAudited: null,
    };
  }

  const score = Math.round((earnedPoints / (totalPossible || 1)) * 100);
  let level = 'LOW';
  let color = '#ef4444';

  if (score >= 70) {
    level = 'HIGH';
    color = '#10b981';
  } else if (score >= 40) {
    level = 'MODERATE';
    color = '#f59e0b';
  }

  return {
    score,
    level,
    color,
    badges,
    communityAuditsCount: communityAudits.length,
    lastAudited: communityAudits[0]?.timestamp || record.auditMetadata.reviewDate || null,
  };
};
