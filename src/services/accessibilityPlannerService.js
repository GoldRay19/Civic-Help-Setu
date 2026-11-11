/**
 * Public-Service Accessibility Needs Planner Service (#144)
 *
 * Implements verified office accessibility evaluations, strict unverified status labelling,
 * stale audit detection (> 180 days), personalized office visit checklists,
 * and official contact verification links.
 */

import {
  ACCESSIBILITY_FEATURE_CATALOG,
  OFFICE_ACCESSIBILITY_RECORDS,
} from '../data/officeAccessibilityData.js';
import { CIVIC_OFFICES } from '../data/locationOffices.js';

export const ACCESSIBILITY_STORAGE_KEY = 'civic_accessibility_visit_plans';
export const STALE_AUDIT_DAYS_THRESHOLD = 180;
const VERIFIED_STATUSES = new Set(['verified_available', 'verified_unavailable']);

const isValidVerificationDate = (date) =>
  typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));

const isDirectSource = (source) => {
  if (!source || typeof source !== 'object' || typeof source.url !== 'string') return false;
  try {
    return new URL(source.url).protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Returns the catalog of standard accessibility features.
 * @returns {Array}
 */
export function getAccessibilityCatalog() {
  return ACCESSIBILITY_FEATURE_CATALOG;
}

/**
 * Calculates whether an audit date is considered stale (> 180 days old).
 * @param {string} auditDateStr
 * @param {Date|string} [referenceDate=new Date()]
 * @returns {boolean}
 */
export function isAuditDateStale(auditDateStr, referenceDate = new Date()) {
  if (!auditDateStr) return true;
  const auditTime = new Date(auditDateStr).getTime();
  if (isNaN(auditTime)) return true;

  const refTime = referenceDate instanceof Date ? referenceDate.getTime() : new Date(referenceDate).getTime();
  const diffDays = Math.floor((refTime - auditTime) / (1000 * 60 * 60 * 24));
  return diffDays > STALE_AUDIT_DAYS_THRESHOLD;
}

/**
 * Retrieves the evaluated accessibility profile for an office.
 *
 * Acceptance Criteria Compliance:
 * - "Users can select an office and view known accessibility details with source dates."
 * - "Unknown accessibility information is labelled 'Not verified' rather than assumed."
 * - "The feature does not claim an accommodation is available without evidence."
 * - "Expired or older records receive a review warning."
 *
 * @param {string} officeId
 * @returns {Object} Comprehensive office accessibility profile
 */
export function getOfficeAccessibilityProfile(officeId) {
  if (!officeId || typeof officeId !== 'string') {
    return {
      officeId: null,
      office: null,
      hasAuditRecord: false,
      isStale: false,
      lastAuditedDate: null,
      officialSource: null,
      features: ACCESSIBILITY_FEATURE_CATALOG.map((f) => ({
        ...f,
        status: 'not_verified',
        statusLabel: 'Not Verified',
        notes: 'No official audit record found for this office.',
        source: null,
        verificationDate: null,
      })),
    };
  }

  const office = CIVIC_OFFICES.find((o) => o.id === officeId) || null;
  const record = OFFICE_ACCESSIBILITY_RECORDS.find((r) => r.officeId === officeId) || null;

  if (!record) {
    // Office exists but has no verified accessibility inspection record on file
    return {
      officeId,
      office,
      hasAuditRecord: false,
      isStale: false,
      lastAuditedDate: null,
      auditedBy: null,
      officialSource: null,
      auditWarning: 'This office has no on-site disability or accessibility audit on record. All accessibility facilities are unverified. Please call ahead to confirm accommodation.',
      features: ACCESSIBILITY_FEATURE_CATALOG.map((f) => ({
        ...f,
        status: 'not_verified',
        statusLabel: 'Not Verified',
        notes: 'Status not verified by official audit.',
        source: null,
        verificationDate: null,
      })),
    };
  }

  const isStale = isAuditDateStale(record.lastAuditedDate);
  const auditWarning = isStale
    ? `Caution: The accessibility audit for this facility was recorded on ${record.lastAuditedDate} (over ${STALE_AUDIT_DAYS_THRESHOLD} days ago). Facility infrastructure may have changed.`
    : null;

  // Map each standard catalog feature against verified record
  const features = ACCESSIBILITY_FEATURE_CATALOG.map((f) => {
    const verifiedFeature = record.features ? record.features[f.id] : null;
    const hasEvidence =
      verifiedFeature &&
      VERIFIED_STATUSES.has(verifiedFeature.status) &&
      isDirectSource(verifiedFeature.source) &&
      isValidVerificationDate(verifiedFeature.verificationDate);

    if (hasEvidence) {
      const isAvailable = verifiedFeature.status === 'verified_available';
      return {
        ...f,
        status: verifiedFeature.status, // 'verified_available' | 'verified_unavailable'
        statusLabel: isAvailable ? 'Verified Available' : 'Verified Not Available',
        notes: verifiedFeature.notes || (isAvailable ? 'Confirmed in audit' : 'Confirmed absent in audit'),
        source: verifiedFeature.source,
        verificationDate: verifiedFeature.verificationDate,
      };
    }

    // Explicitly "Not verified" rather than assumed
    return {
      ...f,
      status: 'not_verified',
      statusLabel: 'Not Verified',
      notes: 'No direct source and verification date are available for this attribute.',
      source: null,
      verificationDate: null,
    };
  });

  return {
    officeId,
    office,
    hasAuditRecord: true,
    isStale,
    lastAuditedDate: record.lastAuditedDate,
    auditedBy: record.auditedBy || 'Government Accessibility Directorate',
    officialSource: record.officialSource || null,
    auditWarning,
    features,
  };
}

/**
 * Builds a personal pre-visit preparation checklist based on citizen's specific accommodation needs.
 *
 * @param {string} officeId
 * @param {Array<string>} selectedFeatureIds - Array of feature IDs citizen requires
 * @returns {Object} Personalized checklist
 */
export function buildPersonalVisitChecklist(officeId, selectedFeatureIds = []) {
  const profile = getOfficeAccessibilityProfile(officeId);
  const selectedSet = new Set(selectedFeatureIds);

  const neededFeatures = profile.features.filter((f) => selectedSet.has(f.id));

  const questionsToConfirm = neededFeatures.map((f) => {
    let urgency = 'medium';
    if (f.status === 'not_verified') {
      urgency = 'high'; // Unverified items must be confirmed before visiting
    } else if (f.status === 'verified_unavailable') {
      urgency = 'critical'; // Accommodation is known to be missing!
    }

    return {
      featureId: f.id,
      title: f.title,
      status: f.status,
      statusLabel: f.statusLabel,
      question: f.confirmationQuestion,
      notes: f.notes,
      urgency,
      confirmed: false,
    };
  });

  const officePhone = profile.office?.contact?.helpline || profile.office?.contact?.phone || '1800 11 0031';
  const officeUrl = profile.office?.contact?.portalUrl || 'https://services.india.gov.in';

  return {
    officeId,
    officeName: profile.office?.name || 'Public Facilitation Office',
    lastAuditedDate: profile.lastAuditedDate,
    isStale: profile.isStale,
    officialContacts: {
      phone: officePhone,
      portalUrl: officeUrl,
      officerInCharge: profile.office?.officerInCharge || 'Helpdesk Officer',
    },
    questionsToConfirm,
  };
}

/**
 * Saves a citizen's visit checklist plan to localStorage safely.
 * @param {string} officeId
 * @param {Object} planData
 * @param {Storage} [storage=localStorage]
 * @returns {boolean}
 */
export function savePersonalVisitPlan(
  officeId,
  planData = {},
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
  consentGiven = false
) {
  if (!officeId || !storage || consentGiven !== true) return false;
  try {
    const raw = storage.getItem(ACCESSIBILITY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const storedPlans = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    const all = Object.fromEntries(
      Object.entries(storedPlans).filter(([, plan]) => Boolean(plan?.consentGivenAt))
    );
    const allowedFeatureIds = new Set(ACCESSIBILITY_FEATURE_CATALOG.map((feature) => feature.id));
    const neededFeatureIds = Array.isArray(planData.neededFeatureIds)
      ? [...new Set(planData.neededFeatureIds.filter((id) => allowedFeatureIds.has(id)))]
      : [];
    const confirmedFeatureIds = new Set(
      Array.isArray(planData.confirmedQuestionIds) ? planData.confirmedQuestionIds : []
    );
    all[officeId] = {
      neededFeatureIds,
      confirmedQuestionIds: neededFeatureIds.filter((id) => confirmedFeatureIds.has(id)),
      officeName: typeof planData.officeName === 'string' ? planData.officeName : '',
      consentGivenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads a citizen's saved visit checklist plan.
 * @param {string} officeId
 * @param {Storage} [storage=localStorage]
 * @returns {Object|null}
 */
export function loadPersonalVisitPlan(officeId, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!officeId || !storage) return null;
  try {
    const raw = storage.getItem(ACCESSIBILITY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const all = Object.fromEntries(
      Object.entries(parsed).filter(([, plan]) => Boolean(plan?.consentGivenAt))
    );
    if (Object.keys(all).length !== Object.keys(parsed).length) {
      if (Object.keys(all).length === 0) storage.removeItem(ACCESSIBILITY_STORAGE_KEY);
      else storage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(all));
    }
    return all[officeId] || null;
  } catch {
    return null;
  }
}

/**
 * Deletes one office visit plan from local storage.
 * @param {string} officeId
 * @param {Storage} [storage=localStorage]
 * @returns {boolean}
 */
export function deletePersonalVisitPlan(officeId, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!officeId || !storage) return false;
  try {
    const raw = storage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Object.hasOwn(parsed, officeId)) return false;
    delete parsed[officeId];
    if (Object.keys(parsed).length === 0) storage.removeItem(ACCESSIBILITY_STORAGE_KEY);
    else storage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(parsed));
    return storage.getItem(ACCESSIBILITY_STORAGE_KEY) === null
      ? Object.keys(parsed).length === 0
      : !Object.hasOwn(JSON.parse(storage.getItem(ACCESSIBILITY_STORAGE_KEY)), officeId);
  } catch {
    return false;
  }
}

/**
 * Builds a printable request note from only the selected office and accommodation options.
 * @param {Object} plan
 * @returns {string} Plain-text request note
 */
export function exportVisitPlanSummary(plan) {
  if (!plan) return '';

  const knownTitles = new Map(ACCESSIBILITY_FEATURE_CATALOG.map((feature) => [feature.id, feature.title]));
  const requests = Array.isArray(plan.questionsToConfirm)
    ? [...new Set(plan.questionsToConfirm.map((item) => item?.featureId))]
        .map((id) => knownTitles.get(id))
        .filter(Boolean)
    : [];
  const officeName = typeof plan.officeName === 'string' ? plan.officeName.trim() : '';
  return [
    'Office visit request',
    ...(officeName ? [`Office: ${officeName}`] : []),
    'Please arrange or advise about:',
    ...requests.map((title) => `- ${title}`),
  ].join('\n');
}
