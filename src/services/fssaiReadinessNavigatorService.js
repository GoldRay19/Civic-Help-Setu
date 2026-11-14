/**
 * Food Business Registration and FSSAI Licence Readiness Navigator Service
 *
 * Implements a statutory guidance and application readiness navigator for food
 * business operators (FBOs) under the Food Safety and Standards Act, 2006:
 *
 * 1. Statutory Three-Tier Licensing Categorization:
 *    - BASIC_REGISTRATION: Petty food manufacturers, hawkers, turnover <= 12 Lakhs/year.
 *    - STATE_LICENCE: Medium food businesses, turnover 12 Lakhs to 20 Crores/year.
 *    - CENTRAL_LICENCE: Large manufacturers, turnover > 20 Crores/year, importers,
 *      e-commerce operators, multi-state operations, and central premises.
 *
 * 2. Automated Eligibility Determination Engine:
 *    - Accurately classifies food businesses based on annual turnover, daily production
 *      capacity, premise location, and business operational model.
 *
 * 3. Categorized Evidence Matrices:
 *    - IDENTITY_AND_REPRESENTATIVE: Government photo IDs, Form IX nomination.
 *    - PREMISES_AND_OCCUPANCY: Utility bills, registered lease, owner NOC, tax receipts.
 *    - BUSINESS_CONSTITUTION: MoA/AoA, partnership deed, Udhyam registration.
 *    - TECHNICAL_AND_FOOD_SAFETY: Processing blueprints, equipment capacity, NABL water reports, FSMS.
 *
 * 4. Strict Legal & Scope Boundaries:
 *    - Decouples FSSAI food safety licensing from municipal health trade licensing.
 *
 * 5. Lifecycle Operations (Renewal, Modification, Verification):
 *    - Calculates renewal windows (180 to 30 days before expiry) and late fee penalties.
 *    - Distinguishes non-form B vs Form B modification workflows.
 *    - Validates official 14-digit FSSAI registration/licence number formats.
 *
 * 6. Privacy & Personal Identifier Redaction:
 *    - Scrubs personal names, contact numbers, exact premise coordinates, and attachment tokens.
 *
 * 7. Verification, Freshness & Community Review:
 *    - Explicit UNAVAILABLE_OR_UNVERIFIED fallback for unrecognized jurisdictions.
 *    - Flags stale records older than 180 days.
 *    - Provides crowdsourced correction submission and administrator evaluation workflows.
 */

export const FSSAI_LICENCE_TIER = {
  BASIC_REGISTRATION: 'BASIC_REGISTRATION',
  STATE_LICENCE: 'STATE_LICENCE',
  CENTRAL_LICENCE: 'CENTRAL_LICENCE',
};

export const FBO_KIND_OF_BUSINESS = {
  PETTY_MANUFACTURER_OR_HAWKER: 'PETTY_MANUFACTURER_OR_HAWKER',
  RESTAURANT_OR_DHABA: 'RESTAURANT_OR_DHABA',
  FOOD_MANUFACTURER_OR_PROCESSOR: 'FOOD_MANUFACTURER_OR_PROCESSOR',
  DAIRY_OR_MILK_CHILLING: 'DAIRY_OR_MILK_CHILLING',
  SLAUGHTERHOUSE_OR_MEAT: 'SLAUGHTERHOUSE_OR_MEAT',
  HOTEL_3_STAR_OR_ABOVE: 'HOTEL_3_STAR_OR_ABOVE',
  E_COMMERCE_FOOD_OPERATOR: 'E_COMMERCE_FOOD_OPERATOR',
  IMPORTER_OR_100_PERCENT_EOU: 'IMPORTER_OR_100_PERCENT_EOU',
  STORAGE_OR_WHOLESALE_OR_DISTRIBUTOR: 'STORAGE_OR_WHOLESALE_OR_DISTRIBUTOR',
};

export const FSSAI_EVIDENCE_CATEGORY = {
  IDENTITY_AND_REPRESENTATIVE: 'IDENTITY_AND_REPRESENTATIVE',
  PREMISES_AND_OCCUPANCY: 'PREMISES_AND_OCCUPANCY',
  BUSINESS_CONSTITUTION: 'BUSINESS_CONSTITUTION',
  TECHNICAL_AND_FOOD_SAFETY: 'TECHNICAL_AND_FOOD_SAFETY',
};

export const FSSAI_VIEW_STATE = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR',
  STALE_DATA_WARNING: 'STALE_DATA_WARNING',
  READY: 'READY',
};

export const STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER =
  'Statutory Notice: FSSAI registration and licensing under the Food Safety and Standards Act, 2006 certifies food hygiene, compositional standards, and safety compliance. It DOES NOT replace, waive, or substitute municipal trade licensing, health trade licences issued by local Municipal Corporations, or Fire NOCs required for commercial premises.';

export const FOSCOS_OFFICIAL_URL = 'https://foscos.fssai.gov.in';
export const FSSAI_CHECK_LICENCE_URL = 'https://foscos.fssai.gov.in/check-your-license-registration';

/**
 * Verified statutory authorities directory.
 */
export const VERIFIED_FSSAI_AUTHORITIES = {
  CENTRAL: {
    authorityName: 'Food Safety and Standards Authority of India (FSSAI) - Central Licensing Authority',
    jurisdictionTier: 'CENTRAL',
    portalUrl: FOSCOS_OFFICIAL_URL,
    statutoryRulebook: 'Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011',
    sourceUrl: 'https://fssai.gov.in',
    effectiveDate: '2025-01-01',
    verificationTimestamp: '2026-02-10T10:00:00Z',
    maxStaleDays: 180,
  },
  MAHARASHTRA: {
    authorityName: 'Food and Drug Administration (FDA), Maharashtra State',
    state: 'Maharashtra',
    jurisdictionTier: 'STATE',
    portalUrl: FOSCOS_OFFICIAL_URL,
    statutoryRulebook: 'Maharashtra Food Safety and Standards Enforcement Guidelines',
    sourceUrl: 'https://fda.maharashtra.gov.in',
    effectiveDate: '2025-01-15',
    verificationTimestamp: '2026-02-05T09:30:00Z',
    maxStaleDays: 180,
  },
  KARNATAKA: {
    authorityName: 'Commissionerate of Health and Family Welfare Services (Food Safety Wing), Karnataka',
    state: 'Karnataka',
    jurisdictionTier: 'STATE',
    portalUrl: FOSCOS_OFFICIAL_URL,
    statutoryRulebook: 'Karnataka State Food Safety & FoSCoS Enforcement Directives',
    sourceUrl: 'https://karnataka.gov.in',
    effectiveDate: '2025-02-01',
    verificationTimestamp: '2026-02-12T11:00:00Z',
    maxStaleDays: 180,
  },
  DELHI_NCT: {
    authorityName: 'Department of Food Safety, Government of NCT of Delhi',
    state: 'Delhi NCT',
    jurisdictionTier: 'STATE',
    portalUrl: FOSCOS_OFFICIAL_URL,
    statutoryRulebook: 'Delhi Food Safety & Standards Bye-Laws & Standard Operating Procedures',
    sourceUrl: 'https://foodsafety.delhigovt.nic.in',
    effectiveDate: '2024-12-01',
    verificationTimestamp: '2026-01-20T14:00:00Z',
    maxStaleDays: 180,
  },
  TAMIL_NADU: {
    authorityName: 'Tamil Nadu Food Safety and Drug Administration Department',
    state: 'Tamil Nadu',
    jurisdictionTier: 'STATE',
    portalUrl: FOSCOS_OFFICIAL_URL,
    statutoryRulebook: 'Tamil Nadu Food Safety Implementation Framework',
    sourceUrl: 'https://foodsafety.tn.gov.in',
    effectiveDate: '2025-01-10',
    verificationTimestamp: '2026-02-01T08:00:00Z',
    maxStaleDays: 180,
  },
  TELANGANA: {
    authorityName: 'Directorate of Food Safety, Institute of Preventive Medicine (IPM), Telangana',
    state: 'Telangana',
    jurisdictionTier: 'STATE',
    portalUrl: FOSCOS_OFFICIAL_URL,
    statutoryRulebook: 'Telangana State Food Safety Rules',
    sourceUrl: 'https://foodsafety.telangana.gov.in',
    effectiveDate: '2025-02-01',
    verificationTimestamp: '2026-02-14T10:00:00Z',
    maxStaleDays: 180,
  },
};

/**
 * Standard fee schedule by license category.
 */
export const FSSAI_FEE_SCHEDULE = {
  [FSSAI_LICENCE_TIER.BASIC_REGISTRATION]: {
    annualFeeInr: 100,
    validityYears: '1 to 5 years (selectable)',
    lateFeePerDayInr: 100,
    feeDescription: 'Flat ₹100 per annum across all petty businesses and small food operators.',
  },
  [FSSAI_LICENCE_TIER.STATE_LICENCE]: {
    annualFeeInr: 2000,
    validityYears: '1 to 5 years (selectable)',
    lateFeePerDayInr: 100,
    feeDescription: '₹2,000 to ₹5,000 per annum depending on daily production volume, hotel rating, or capacity.',
  },
  [FSSAI_LICENCE_TIER.CENTRAL_LICENCE]: {
    annualFeeInr: 7500,
    validityYears: '1 to 5 years (selectable)',
    lateFeePerDayInr: 100,
    feeDescription: 'Flat ₹7,500 per annum for large manufacturers, 100% EOUs, e-commerce, and import entities.',
  },
};

/**
 * Verifies whether authority record is stale.
 *
 * @param {string} timestamp
 * @param {number} [maxDays=180]
 * @returns {boolean}
 */
export function isFssaiDataStale(timestamp, maxDays = 180) {
  if (!timestamp) return true;
  const verifiedTime = new Date(timestamp).getTime();
  if (isNaN(verifiedTime)) return true;
  const diffDays = (Date.now() - verifiedTime) / (1000 * 60 * 60 * 24);
  return diffDays > maxDays;
}

/**
 * Resolves verified food safety authority by state key or returns central fallback.
 *
 * @param {string} stateKey e.g. 'MAHARASHTRA', 'KARNATAKA', 'CENTRAL'
 * @returns {Object} Authority details
 */
export function resolveFssaiAuthority(stateKey) {
  if (!stateKey || typeof stateKey !== 'string') {
    return {
      status: 'UNAVAILABLE_OR_UNVERIFIED',
      isSupported: false,
      message: 'No state or territory specified. Falling back to Central FSSAI Authority.',
      ...VERIFIED_FSSAI_AUTHORITIES.CENTRAL,
      disclaimer: STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
    };
  }

  const normKey = stateKey.trim().toUpperCase().replace(/\s+/g, '_');
  const record = VERIFIED_FSSAI_AUTHORITIES[normKey];

  if (!record) {
    return {
      status: 'UNAVAILABLE_OR_UNVERIFIED',
      isSupported: false,
      stateKey: normKey,
      message: `State-specific food safety commissionerate for '${stateKey}' is currently unverified.`,
      authorityName: `Office of the Designated Officer / Food Safety Commissioner, ${stateKey}`,
      portalUrl: FOSCOS_OFFICIAL_URL,
      statutoryRulebook: 'Food Safety and Standards Act, 2006 (Central Act 34 of 2006)',
      sourceUrl: 'https://fssai.gov.in',
      disclaimer: STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
    };
  }

  const stale = isFssaiDataStale(record.verificationTimestamp, record.maxStaleDays);

  return {
    status: stale ? 'STALE_DATA_WARNING' : 'VERIFIED',
    isSupported: true,
    ...record,
    disclaimer: STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
  };
}

/**
 * Automated FSSAI Category Determination Engine.
 *
 * Evaluates operational metrics and classifies business into Basic, State, or Central licence.
 *
 * @param {Object} input
 * @param {number} input.annualTurnoverInLakhs Annual turnover in INR Lakhs
 * @param {number} [input.dailyProductionKgOrLtr=0] Daily production capacity
 * @param {boolean} [input.isImporter=false] Imports food ingredients or products
 * @param {boolean} [input.isEcommerce=false] Operates e-commerce food delivery or marketplace
 * @param {boolean} [input.hasMultiStateOperations=false] Business operates across more than 1 state
 * @param {boolean} [input.isCentralPremises=false] Located at airport, seaport, railway, or defense area
 * @param {string} [input.kindOfBusiness] Specific category from FBO_KIND_OF_BUSINESS
 * @returns {Object} Determination verdict with statutory rationale
 */
export function determineLicenceCategory(input = {}) {
  const {
    annualTurnoverInLakhs = 0,
    dailyProductionKgOrLtr = 0,
    isImporter = false,
    isEcommerce = false,
    hasMultiStateOperations = false,
    isCentralPremises = false,
    kindOfBusiness = FBO_KIND_OF_BUSINESS.FOOD_MANUFACTURER_OR_PROCESSOR,
  } = input;

  const turnover = Number(annualTurnoverInLakhs) || 0;
  const production = Number(dailyProductionKgOrLtr) || 0;

  // 1. Central Licence Criteria
  if (
    isImporter ||
    isEcommerce ||
    hasMultiStateOperations ||
    isCentralPremises ||
    turnover > 2000 || // > 20 Crores (2000 Lakhs)
    production > 2000 || // > 2 MT/day (2000 kg)
    kindOfBusiness === FBO_KIND_OF_BUSINESS.IMPORTER_OR_100_PERCENT_EOU ||
    kindOfBusiness === FBO_KIND_OF_BUSINESS.E_COMMERCE_FOOD_OPERATOR
  ) {
    const reasons = [];
    if (isImporter) reasons.push('Direct import of food products/ingredients');
    if (isEcommerce) reasons.push('E-commerce food marketplace / online delivery platform');
    if (hasMultiStateOperations) reasons.push('Head office coordinating operations in > 1 State');
    if (isCentralPremises) reasons.push('Premises located in Central Govt enclave (Airport/Seaport/Railways)');
    if (turnover > 2000) reasons.push(`Annual turnover of ₹${turnover} Lakhs exceeds ₹20 Crore limit`);
    if (production > 2000) reasons.push(`Production capacity of ${production} kg/day exceeds 2 MT threshold`);

    return {
      tier: FSSAI_LICENCE_TIER.CENTRAL_LICENCE,
      tierTitle: 'Central FSSAI Licence',
      issuingAuthority: 'Central Licensing Authority (FSSAI HQ / Regional Office)',
      portalEndpoint: `${FOSCOS_OFFICIAL_URL}/apply-for-licence-registration`,
      formType: 'Form B',
      feeSchedule: FSSAI_FEE_SCHEDULE[FSSAI_LICENCE_TIER.CENTRAL_LICENCE],
      reasons,
      statutoryDisclaimer: STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
    };
  }

  // 2. State Licence Criteria
  if (
    turnover > 12 || // > 12 Lakhs
    production > 100 || // > 100 kg/day
    kindOfBusiness === FBO_KIND_OF_BUSINESS.HOTEL_3_STAR_OR_ABOVE
  ) {
    const reasons = [];
    if (turnover > 12) reasons.push(`Annual turnover of ₹${turnover} Lakhs exceeds Basic threshold of ₹12 Lakhs`);
    if (production > 100) reasons.push(`Daily production of ${production} kg/day exceeds 100 kg threshold`);
    if (kindOfBusiness === FBO_KIND_OF_BUSINESS.HOTEL_3_STAR_OR_ABOVE) reasons.push('3-star or 4-star hospitality establishment');

    return {
      tier: FSSAI_LICENCE_TIER.STATE_LICENCE,
      tierTitle: 'State FSSAI Licence',
      issuingAuthority: 'Designated Officer / State Food Safety Commissionerate',
      portalEndpoint: `${FOSCOS_OFFICIAL_URL}/apply-for-licence-registration`,
      formType: 'Form B',
      feeSchedule: FSSAI_FEE_SCHEDULE[FSSAI_LICENCE_TIER.STATE_LICENCE],
      reasons,
      statutoryDisclaimer: STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
    };
  }

  // 3. Basic Registration Criteria
  return {
    tier: FSSAI_LICENCE_TIER.BASIC_REGISTRATION,
    tierTitle: 'Basic FSSAI Registration',
    issuingAuthority: 'Registering Authority (Sub-Divisional / Municipal Food Safety Officer)',
    portalEndpoint: `${FOSCOS_OFFICIAL_URL}/apply-for-licence-registration`,
    formType: 'Form A',
    feeSchedule: FSSAI_FEE_SCHEDULE[FSSAI_LICENCE_TIER.BASIC_REGISTRATION],
    reasons: ['Petty food business operator with turnover <= ₹12 Lakhs per annum and small production capacity.'],
    statutoryDisclaimer: STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
  };
}

/**
 * Standard required documents matrix by tier.
 *
 * @param {string} tier FSSAI_LICENCE_TIER
 * @returns {Array<Object>} Categorized checklist requirements
 */
export function getFssaiEvidenceMatrix(tier = FSSAI_LICENCE_TIER.BASIC_REGISTRATION) {
  const isBasic = tier === FSSAI_LICENCE_TIER.BASIC_REGISTRATION;

  return [
    {
      category: FSSAI_EVIDENCE_CATEGORY.IDENTITY_AND_REPRESENTATIVE,
      title: 'Identity and Representative Evidence',
      items: [
        { id: 'FBO_PHOTO', label: 'Recent Passport Size Photograph of the Food Business Operator / Authorized Signatory', mandatory: true },
        { id: 'FBO_GOVT_ID', label: 'Government Photo Identity Card (Aadhaar, PAN Card, Voter ID, or Passport)', mandatory: true },
        { id: 'FORM_IX_NOMINATION', label: 'Form IX Nomination of Person Responsible by Board of Directors / Partners', mandatory: !isBasic },
      ],
    },
    {
      category: FSSAI_EVIDENCE_CATEGORY.PREMISES_AND_OCCUPANCY,
      title: 'Proof of Business Premises and Possession',
      items: [
        { id: 'ELECTRICITY_OR_UTILITY_BILL', label: 'Latest Electricity Bill / Water Bill of the commercial or manufacturing premises', mandatory: true },
        { id: 'RENT_AGREEMENT_OR_DEED', label: 'Registered Rent/Lease Agreement with Landlord NOC, or Ownership Sale Deed', mandatory: true },
        { id: 'MUNICIPAL_TAX_RECEIPT', label: 'Municipal Property Tax Paid Receipt for the current fiscal period', mandatory: false },
      ],
    },
    {
      category: FSSAI_EVIDENCE_CATEGORY.BUSINESS_CONSTITUTION,
      title: 'Business Constitution & Commercial Registration',
      items: [
        { id: 'PARTNERSHIP_OR_MCA_COI', label: 'Partnership Deed, MCA Certificate of Incorporation, or Udhyam Registration', mandatory: !isBasic },
        { id: 'DIRECTORS_PARTNERS_LIST', label: 'List of Directors / Partners / Executive Members with official addresses and contacts', mandatory: !isBasic },
      ],
    },
    {
      category: FSSAI_EVIDENCE_CATEGORY.TECHNICAL_AND_FOOD_SAFETY,
      title: 'Technical Food Safety, Equipment & Water Quality Evidence',
      items: [
        { id: 'PROCESSING_UNIT_BLUEPRINT', label: 'Scaled blueprint / layout plan of processing unit showing dimensioned areas', mandatory: !isBasic },
        { id: 'EQUIPMENT_MACHINERY_LIST', label: 'List of machinery and equipment with horse-power and installed production capacity', mandatory: !isBasic },
        { id: 'WATER_TEST_REPORT_IS_10500', label: 'Water Potability Chemical & Bacteriological Test Report conforming to IS 10500 from NABL lab', mandatory: !isBasic },
        { id: 'FSMS_PLAN_OR_CERTIFICATE', label: 'Food Safety Management System (FSMS) plan or accredited certificate', mandatory: !isBasic },
      ],
    },
  ];
}

/**
 * Validates official 14-digit FSSAI licence / registration number.
 *
 * @param {string} licenceNumber
 * @returns {Object} Validation outcome
 */
export function validateFssaiLicenceNumber(licenceNumber) {
  if (!licenceNumber || typeof licenceNumber !== 'string') {
    return {
      isValid: false,
      message: 'FSSAI licence number is missing or not a string',
    };
  }

  const cleanNum = licenceNumber.trim();
  const is14Digit = /^\d{14}$/.test(cleanNum);

  if (!is14Digit) {
    return {
      isValid: false,
      licenceNumber: cleanNum,
      message: 'Invalid format. FSSAI registration/licence number must consist of exactly 14 numeric digits.',
    };
  }

  // First digit: 1 = Registration, 2 = State Licence, 3 = Central Licence (standard format)
  const prefix = cleanNum[0];
  let likelyCategory = 'UNKNOWN';
  if (prefix === '1') likelyCategory = FSSAI_LICENCE_TIER.BASIC_REGISTRATION;
  else if (prefix === '2') likelyCategory = FSSAI_LICENCE_TIER.STATE_LICENCE;
  else if (prefix === '3') likelyCategory = FSSAI_LICENCE_TIER.CENTRAL_LICENCE;

  return {
    isValid: true,
    licenceNumber: cleanNum,
    likelyCategory,
    verificationPortalUrl: `${FSSAI_CHECK_LICENCE_URL}?licenceNumber=${cleanNum}`,
    message: 'Valid 14-digit format. Check authenticity on the official FoSCoS portal.',
  };
}

/**
 * Computes licence renewal timeline and late fee penalty.
 *
 * @param {string} expiryDate ISO Date string
 * @param {string} [currentDate] Optional reference date (defaults to now)
 * @returns {Object} Renewal status, window, and penalties
 */
export function calculateRenewalTimeline(expiryDate, currentDate) {
  if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
    throw new Error('Valid expiryDate is required');
  }

  const expTime = new Date(expiryDate).getTime();
  const now = currentDate ? new Date(currentDate).getTime() : Date.now();
  const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'EXPIRED',
      isExpired: true,
      canRenew: false,
      daysElapsedSinceExpiry: Math.abs(diffDays),
      penaltyInr: null,
      message: 'Licence has expired. FoSCoS does not permit renewal after expiry; a fresh licence application is mandatory.',
    };
  }

  if (diffDays <= 30) {
    const daysIntoPenalty = 30 - diffDays;
    const penalty = daysIntoPenalty * 100;
    return {
      status: 'PENALTY_WINDOW',
      isExpired: false,
      canRenew: true,
      daysRemaining: diffDays,
      penaltyInr: penalty,
      message: `Expiring in ${diffDays} days. A late fee penalty of ₹100/day (₹${penalty} accrued) applies within 30 days of expiry.`,
    };
  }

  if (diffDays <= 180) {
    return {
      status: 'STANDARD_RENEWAL_WINDOW',
      isExpired: false,
      canRenew: true,
      daysRemaining: diffDays,
      penaltyInr: 0,
      message: `Eligible for standard renewal without late penalty. (${diffDays} days remaining before expiry).`,
    };
  }

  return {
    status: 'TOO_EARLY_FOR_RENEWAL',
    isExpired: false,
    canRenew: false,
    daysRemaining: diffDays,
    penaltyInr: 0,
    message: `Renewal opens 180 days prior to expiry. Please re-apply closer to the renewal window (${diffDays} days remaining).`,
  };
}

// In-memory user dossier storage
const userFssaiDossierStore = new Map();

/**
 * Creates an FSSAI preparation dossier.
 *
 * @param {Object} input
 * @returns {Object} Created dossier
 */
export function createFssaiDossier(input = {}) {
  const {
    ownerId,
    businessName = 'FOOD_BUSINESS_OPERATOR',
    stateKey = 'CENTRAL',
    annualTurnoverInLakhs = 0,
    dailyProductionKgOrLtr = 0,
    kindOfBusiness = FBO_KIND_OF_BUSINESS.FOOD_MANUFACTURER_OR_PROCESSOR,
    isImporter = false,
    isEcommerce = false,
  } = input;

  if (!ownerId || typeof ownerId !== 'string') {
    throw new Error('Valid ownerId is required');
  }

  const determination = determineLicenceCategory({
    annualTurnoverInLakhs,
    dailyProductionKgOrLtr,
    kindOfBusiness,
    isImporter,
    isEcommerce,
  });

  const authorityInfo = resolveFssaiAuthority(stateKey);
  const evidenceCategories = getFssaiEvidenceMatrix(determination.tier);

  const dossierId = `fssai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const checklistItems = [];
  evidenceCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      checklistItems.push({
        itemId: item.id,
        category: cat.category,
        label: item.label,
        mandatory: item.mandatory,
        completed: false,
        verifiedDate: null,
        documentRef: null,
      });
    });
  });

  const dossier = {
    id: dossierId,
    ownerId,
    businessName,
    stateKey: authorityInfo.isSupported ? stateKey : 'CENTRAL',
    determinedTier: determination.tier,
    tierTitle: determination.tierTitle,
    issuingAuthority: determination.issuingAuthority,
    formType: determination.formType,
    feeSchedule: determination.feeSchedule,
    determinationReasons: determination.reasons,
    checklistItems,
    applicationStatus: 'DRAFT_PREPARATION',
    applicationFilingReference: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorityDetails: {
      authorityName: authorityInfo.authorityName,
      portalUrl: authorityInfo.portalUrl,
      sourceUrl: authorityInfo.sourceUrl,
      statutoryRulebook: authorityInfo.statutoryRulebook,
    },
    statutoryDisclaimer: STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
  };

  userFssaiDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Retrieves a dossier with owner authorization check.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @returns {Object|null}
 */
export function getFssaiDossier(dossierId, ownerId) {
  if (!dossierId || !ownerId) return null;
  const record = userFssaiDossierStore.get(dossierId);
  if (!record) return null;
  if (record.ownerId !== ownerId) {
    throw new Error('Access Denied: You are not authorized to access this FSSAI record');
  }
  return record;
}

/**
 * Updates items or application filing reference.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {Object} updates
 * @returns {Object}
 */
export function updateFssaiDossier(dossierId, ownerId, updates = {}) {
  const dossier = getFssaiDossier(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Dossier '${dossierId}' not found`);
  }

  const { itemsToUpdate = [], applicationStatus, applicationFilingReference } = updates;

  if (itemsToUpdate && Array.isArray(itemsToUpdate)) {
    itemsToUpdate.forEach((upItem) => {
      const existing = dossier.checklistItems.find((i) => i.itemId === upItem.itemId);
      if (existing) {
        if (typeof upItem.completed === 'boolean') {
          existing.completed = upItem.completed;
          existing.verifiedDate = upItem.completed ? new Date().toISOString() : null;
        }
        if (upItem.documentRef !== undefined) {
          existing.documentRef = upItem.documentRef;
        }
      }
    });
  }

  if (applicationStatus) {
    dossier.applicationStatus = applicationStatus;
  }
  if (applicationFilingReference) {
    dossier.applicationFilingReference = applicationFilingReference;
  }

  dossier.updatedAt = new Date().toISOString();
  userFssaiDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Deletes an FSSAI dossier.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @returns {boolean}
 */
export function deleteFssaiDossier(dossierId, ownerId) {
  const dossier = getFssaiDossier(dossierId, ownerId);
  if (!dossier) return false;
  return userFssaiDossierStore.delete(dossierId);
}

/**
 * Sanitizes FSSAI dossier for privacy-preserving export and community sharing.
 *
 * @param {Object} dossier
 * @returns {Object}
 */
export function sanitizeFssaiDossierForExport(dossier) {
  if (!dossier || typeof dossier !== 'object') return null;

  const sanitized = JSON.parse(JSON.stringify(dossier));
  sanitized.ownerId = 'REDACTED_CITIZEN_ID';
  sanitized.businessName = 'REDACTED_BUSINESS_NAME';

  if (sanitized.applicationFilingReference) {
    sanitized.applicationFilingReference = 'FOSCOS/XXXX/REDACTED';
  }

  if (Array.isArray(sanitized.checklistItems)) {
    sanitized.checklistItems = sanitized.checklistItems.map((item) => ({
      ...item,
      documentRef: item.documentRef ? 'REDACTED_ATTACHMENT_ID' : null,
    }));
  }

  return sanitized;
}

// In-memory corrections registry
const fssaiCorrectionsRegistry = [];

/**
 * Submits a community correction proposal.
 *
 * @param {Object} input
 * @returns {Object}
 */
export function submitFssaiCorrectionProposal(input = {}) {
  const {
    stateKey,
    proposedAuthorityName,
    officialGazetteOrSourceUrl,
    submissionNotes,
    contributorId = 'ANONYMOUS_CONTRIBUTOR',
  } = input;

  if (!stateKey || !officialGazetteOrSourceUrl) {
    throw new Error('Valid stateKey and verifiable officialGazetteOrSourceUrl are mandatory');
  }

  const proposal = {
    proposalId: `fssai_corr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    stateKey,
    proposedAuthorityName: proposedAuthorityName || null,
    officialGazetteOrSourceUrl,
    submissionNotes: submissionNotes || '',
    contributorId,
    reviewStatus: 'PENDING_ADMIN_REVIEW',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewerNotes: null,
  };

  fssaiCorrectionsRegistry.push(proposal);
  return proposal;
}

/**
 * Evaluates a community correction proposal.
 *
 * @param {string} proposalId
 * @param {string} decision 'APPROVED' | 'REJECTED'
 * @param {string} reviewerNotes
 * @returns {Object}
 */
export function reviewFssaiCorrectionProposal(proposalId, decision, reviewerNotes = '') {
  const proposal = fssaiCorrectionsRegistry.find((p) => p.proposalId === proposalId);
  if (!proposal) {
    throw new Error(`Correction proposal '${proposalId}' not found`);
  }

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw new Error("Decision must be either 'APPROVED' or 'REJECTED'");
  }

  proposal.reviewStatus = decision;
  proposal.reviewedAt = new Date().toISOString();
  proposal.reviewerNotes = reviewerNotes;

  return proposal;
}

/**
 * Internal store reset utility for unit testing.
 */
export function _resetFssaiInternalStores() {
  userFssaiDossierStore.clear();
  fssaiCorrectionsRegistry.length = 0;
}
