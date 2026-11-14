/**
 * Fire NOC and Fire-Safety Compliance Preparation Workspace Service
 * Grounded in National Building Code of India (NBC 2016 Part 4: Fire & Life Safety)
 * and State Fire Force Acts / Municipal Regulations.
 */

import {
  STATUTORY_SCOPE_DISCLAIMER,
  FIRE_JURISDICTIONS,
  BUILDING_OCCUPANCY_GROUPS,
  FIRE_NOC_STAGES,
  EVIDENCE_CATEGORIES,
  STAGE_EVIDENCE_REQUIREMENTS
} from '../data/fireSafetyComplianceData';

export {
  STATUTORY_SCOPE_DISCLAIMER,
  FIRE_JURISDICTIONS,
  BUILDING_OCCUPANCY_GROUPS,
  FIRE_NOC_STAGES,
  EVIDENCE_CATEGORIES,
  STAGE_EVIDENCE_REQUIREMENTS
};

export const FIRE_NOC_STAGE = {
  PROVISIONAL_NOC: 'PROVISIONAL_NOC',
  FINAL_FIRE_CERTIFICATE: 'FINAL_FIRE_CERTIFICATE',
  RENEWAL_FIRE_CERTIFICATE: 'RENEWAL_FIRE_CERTIFICATE'
};

export const MILESTONE_STATUS = {
  APPLICATION_INTAKE: 'APPLICATION_INTAKE',
  PLAN_TECHNICAL_SCRUTINY: 'PLAN_TECHNICAL_SCRUTINY',
  SITE_INSPECTION_SCHEDULED: 'SITE_INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED: 'INSPECTION_COMPLETED',
  DEFICIENCY_NOTICE_ISSUED: 'DEFICIENCY_NOTICE_ISSUED',
  DEFICIENCY_RESOLVED: 'DEFICIENCY_RESOLVED',
  FEE_DEMAND_NOTE_ISSUED: 'FEE_DEMAND_NOTE_ISSUED',
  FIRE_NOC_ISSUED: 'FIRE_NOC_ISSUED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

export const VIEW_STATE = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR',
  STALE_DATA_WARNING: 'STALE_DATA_WARNING',
  READY: 'READY'
};

/**
 * Checks whether a jurisdiction verification timestamp exceeds the maximum staleness threshold.
 *
 * @param {string|null} timestamp ISO timestamp
 * @param {number} [maxDays=180] Staleness limit in days
 * @returns {boolean} True if stale or missing
 */
export function isDataStale(timestamp, maxDays = 180) {
  if (!timestamp) return true;
  const verifiedTime = new Date(timestamp).getTime();
  if (isNaN(verifiedTime)) return true;
  const now = Date.now();
  const diffDays = (now - verifiedTime) / (1000 * 60 * 60 * 24);
  return diffDays > maxDays;
}

/**
 * Resolves verified Fire Directorate records for a given jurisdiction ID or key.
 *
 * @param {string} jurisdictionId e.g. 'delhi', 'maharashtra_mumbai', 'DELHI_NCT'
 * @returns {Object} Authority details with verification status and staleness flag
 */
export function resolveFireAuthority(jurisdictionId) {
  if (!jurisdictionId || typeof jurisdictionId !== 'string') {
    return {
      status: 'UNAVAILABLE_OR_UNVERIFIED',
      verified: false,
      message: 'No jurisdiction provided. Select a verified state or city.',
      disclaimer: STATUTORY_SCOPE_DISCLAIMER
    };
  }

  const cleanId = jurisdictionId.trim().toLowerCase();
  const cleanKey = jurisdictionId.trim().toUpperCase().replace(/\s+/g, '_');

  const match = FIRE_JURISDICTIONS.find(
    (j) => j.id.toLowerCase() === cleanId || j.jurisdictionKey === cleanKey
  );

  if (!match || !match.verified) {
    const fallback = FIRE_JURISDICTIONS.find((j) => j.id === 'unspecified') || {
      id: 'unspecified',
      jurisdictionKey: 'UNAVAILABLE_OR_UNVERIFIED',
      state: 'Other / Unlisted State',
      city: 'Unspecified District',
      authorityName: 'Jurisdictional Fire Station / CFO Office',
      statutoryAct: 'State Fire Force Act & NBC 2016 Part 4',
      portalName: 'Not specified by the linked official source.',
      portalUrl: null,
      verified: false,
      verificationTimestamp: null
    };

    return {
      status: 'UNAVAILABLE_OR_UNVERIFIED',
      verified: false,
      jurisdictionKey: 'UNAVAILABLE_OR_UNVERIFIED',
      state: match?.state || 'Other / Unlisted State',
      city: match?.city || 'Unspecified District',
      authorityName: match?.authorityName || fallback.authorityName,
      statutoryAct: match?.statutoryAct || fallback.statutoryAct,
      portalName: fallback.portalName,
      portalUrl: null,
      message: `Statutory fire compliance records for '${jurisdictionId}' are currently unverified or uncatalogued.`,
      recommendedAction: 'Directly contact the local Chief Fire Officer or municipal fire prevention wing.',
      disclaimer: STATUTORY_SCOPE_DISCLAIMER
    };
  }

  const stale = isDataStale(match.verificationTimestamp, match.maxStaleDays);

  return {
    status: stale ? 'STALE_DATA_WARNING' : 'VERIFIED',
    verified: true,
    id: match.id,
    jurisdictionKey: match.jurisdictionKey,
    state: match.state,
    city: match.city,
    authorityName: match.authorityName,
    competentOfficer: match.competentOfficer,
    statutoryAct: match.statutoryAct,
    portalName: match.portalName,
    portalUrl: match.portalUrl,
    scrutinyPortal: match.scrutinyPortal,
    effectiveDate: match.effectiveDate,
    verificationTimestamp: match.verificationTimestamp,
    isStale: stale,
    inspectionMandatory: match.inspectionMandatory,
    turnaroundDays: match.turnaroundDays,
    validityYears: match.validityYears,
    guidanceNotes: match.guidanceNotes,
    disclaimer: STATUTORY_SCOPE_DISCLAIMER
  };
}

/**
 * Evaluates whether a Fire NOC is mandatory, conditional, or exempt based on NBC 2016 occupancy groups and dimensions.
 *
 * @param {string} buildingGroupCode e.g. 'GROUP_A', 'GROUP_D'
 * @param {number} [heightMeters=0] Building height in meters
 * @param {number} [coveredAreaSqM=0] Covered plinth / built-up area in sq. meters
 * @returns {Object} Evaluation result with statutory rationale
 */
export function evaluateNocApplicability(buildingGroupCode, heightMeters = 0, coveredAreaSqM = 0) {
  const group = BUILDING_OCCUPANCY_GROUPS.find(
    (g) => g.code === buildingGroupCode || g.code === `GROUP_${buildingGroupCode}`
  );

  if (!group) {
    return {
      status: 'UNKNOWN_OCCUPANCY',
      isMandatory: false,
      isConditional: true,
      categoryName: 'Unspecified Occupancy',
      reason: 'Building use not recognized. Verification with jurisdictional Chief Fire Officer required.',
      disclaimer: STATUTORY_SCOPE_DISCLAIMER
    };
  }

  const height = Number(heightMeters) || 0;
  const area = Number(coveredAreaSqM) || 0;

  // Universal mandatory groups
  if (group.code === 'GROUP_C' || group.code === 'GROUP_J') {
    return {
      status: 'MANDATORY',
      isMandatory: true,
      isConditional: false,
      isExempt: false,
      groupCode: group.code,
      groupName: group.name,
      reason: group.nocMandatoryTrigger,
      exemptCondition: group.exemptCondition,
      inspectionFocus: group.inspectionFocus,
      disclaimer: STATUTORY_SCOPE_DISCLAIMER
    };
  }

  // Assembly group
  if (group.code === 'GROUP_D') {
    const isOverArea = area > 0 && area >= group.coveredAreaThresholdSqM;
    return {
      status: isOverArea || area === 0 ? 'MANDATORY' : 'CONDITIONAL',
      isMandatory: isOverArea || area === 0,
      isConditional: !isOverArea && area > 0,
      isExempt: false,
      groupCode: group.code,
      groupName: group.name,
      reason: group.nocMandatoryTrigger,
      exemptCondition: group.exemptCondition,
      inspectionFocus: group.inspectionFocus,
      disclaimer: STATUTORY_SCOPE_DISCLAIMER
    };
  }

  // Educational group
  if (group.code === 'GROUP_B') {
    const triggerHeight = height >= (group.heightThresholdMeters || 9);
    const triggerArea = area >= (group.coveredAreaThresholdSqM || 500);
    const isMandatory = triggerHeight || triggerArea;

    return {
      status: isMandatory ? 'MANDATORY' : 'CONDITIONAL',
      isMandatory,
      isConditional: !isMandatory,
      isExempt: height > 0 && height < 9 && area > 0 && area < 500,
      groupCode: group.code,
      groupName: group.name,
      reason: isMandatory
        ? `Mandatory: Building parameters (${height}m height or ${area} sq.m area) exceed educational life safety thresholds.`
        : group.nocMandatoryTrigger,
      exemptCondition: group.exemptCondition,
      inspectionFocus: group.inspectionFocus,
      disclaimer: STATUTORY_SCOPE_DISCLAIMER
    };
  }

  // Residential & Business (Height threshold 15m)
  if (group.code === 'GROUP_A' || group.code === 'GROUP_E') {
    const isHighRise = height >= 15;
    const isCommercialLarge = group.code === 'GROUP_E' && area >= 500;
    const isMandatory = isHighRise || isCommercialLarge;

    return {
      status: isMandatory ? 'MANDATORY' : 'EXEMPT_OR_CONDITIONAL',
      isMandatory,
      isConditional: !isMandatory && (height > 0 || area > 0),
      isExempt: !isMandatory && height > 0 && height < 15,
      groupCode: group.code,
      groupName: group.name,
      reason: isMandatory
        ? `Mandatory: Exceeds 15-meter high-rise threshold or commercial multi-occupancy scale.`
        : `Exempt / Low-Rise: Structures under 15 meters without hazardous storage are typically exempt from dedicated Fire NOC (verify with municipality).`,
      exemptCondition: group.exemptCondition,
      inspectionFocus: group.inspectionFocus,
      disclaimer: STATUTORY_SCOPE_DISCLAIMER
    };
  }

  // Mercantile / Industrial / Storage
  const triggerArea = area >= (group.coveredAreaThresholdSqM || 300);
  return {
    status: triggerArea ? 'MANDATORY' : 'CONDITIONAL',
    isMandatory: triggerArea,
    isConditional: !triggerArea,
    isExempt: false,
    groupCode: group.code,
    groupName: group.name,
    reason: triggerArea
      ? `Mandatory: Covered floor area of ${area} sq.m exceeds threshold (${group.coveredAreaThresholdSqM} sq.m).`
      : group.nocMandatoryTrigger,
    exemptCondition: group.exemptCondition,
    inspectionFocus: group.inspectionFocus,
    disclaimer: STATUTORY_SCOPE_DISCLAIMER
  };
}

/**
 * Retrieves the full checklist schema for a requested approval stage and jurisdiction.
 *
 * @param {string} stage e.g. 'PROVISIONAL_NOC', 'FINAL_FIRE_CERTIFICATE', 'RENEWAL_FIRE_CERTIFICATE'
 * @param {string} jurisdictionId e.g. 'delhi', 'karnataka_bengaluru'
 * @param {string} [buildingGroupCode='GROUP_E']
 * @returns {Object} Stage checklist configuration
 */
export function getStageChecklistRequirements(stage, jurisdictionId, buildingGroupCode = 'GROUP_E') {
  const normStage = (stage || FIRE_NOC_STAGE.PROVISIONAL_NOC).toUpperCase();
  const stageMeta = FIRE_NOC_STAGES[normStage];

  if (!stageMeta) {
    throw new Error(`Unknown Fire NOC stage: '${stage}'. Supported stages: ${Object.keys(FIRE_NOC_STAGES).join(', ')}`);
  }

  const authorityInfo = resolveFireAuthority(jurisdictionId);
  const categories = STAGE_EVIDENCE_REQUIREMENTS[normStage] || [];
  const applicability = evaluateNocApplicability(buildingGroupCode);

  return {
    stage: stageMeta.stage,
    stageTitle: stageMeta.title,
    description: stageMeta.description,
    deliverable: stageMeta.deliverable,
    dateLabel: stageMeta.dateLabel,
    milestone: stageMeta.milestone,
    authorityInfo,
    applicability,
    requiredCategories: categories,
    disclaimer: STATUTORY_SCOPE_DISCLAIMER
  };
}

// In-memory data store for user Fire NOC preparation dossiers
const userDossierStore = new Map();

/**
 * Creates a private user-managed Fire NOC checklist dossier.
 *
 * @param {Object} input
 * @returns {Object} Created checklist dossier
 */
export function createFireSafetyChecklist(input = {}) {
  const {
    ownerId,
    jurisdictionId = 'delhi',
    buildingGroupCode = 'GROUP_E',
    stage = FIRE_NOC_STAGE.PROVISIONAL_NOC,
    buildingName = 'Commercial Premises',
    heightMeters = 0,
    coveredAreaSqM = 0,
    architectCoaNumber,
    fireConsultantLicence
  } = input;

  if (!ownerId || typeof ownerId !== 'string') {
    throw new Error('Valid ownerId is required to instantiate a private Fire NOC checklist');
  }

  const authorityInfo = resolveFireAuthority(jurisdictionId);
  const stageReqs = getStageChecklistRequirements(stage, jurisdictionId, buildingGroupCode);

  const dossierId = `fire_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Populate checklist items
  const checklistItems = [];
  stageReqs.requiredCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      checklistItems.push({
        itemId: item.id,
        category: cat.category,
        label: item.label,
        mandatory: item.mandatory,
        officialRule: item.officialRule,
        officialBasis: item.officialBasis,
        completed: false,
        verifiedDate: null,
        documentRef: null
      });
    });
  });

  const dossier = {
    id: dossierId,
    ownerId,
    jurisdictionId: authorityInfo.id || jurisdictionId,
    jurisdictionKey: authorityInfo.jurisdictionKey || 'UNAVAILABLE_OR_UNVERIFIED',
    buildingGroupCode,
    buildingName,
    currentStage: stage,
    currentMilestone: MILESTONE_STATUS.APPLICATION_INTAKE,
    heightMeters: Number(heightMeters) || 0,
    coveredAreaSqM: Number(coveredAreaSqM) || 0,
    submissionToken: null,
    inspectionScheduledDate: null,
    inspectionOfficer: null,
    architectCoaNumber: architectCoaNumber || null,
    fireConsultantLicence: fireConsultantLicence || null,
    checklistItems,
    deficiencyNotices: [],
    milestoneHistory: [
      {
        milestone: MILESTONE_STATUS.APPLICATION_INTAKE,
        recordedAt: new Date().toISOString(),
        notes: 'Dossier initialized in Fire NOC preparation workspace.'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorityDetails: {
      authorityName: authorityInfo.authorityName,
      statutoryAct: authorityInfo.statutoryAct,
      portalUrl: authorityInfo.portalUrl,
      scrutinyPortal: authorityInfo.scrutinyPortal
    },
    statutoryDisclaimer: STATUTORY_SCOPE_DISCLAIMER
  };

  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Retrieves a checklist record by ID with owner authorization check.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @returns {Object|null} Dossier or null
 */
export function getFireSafetyChecklist(dossierId, ownerId) {
  if (!dossierId || !ownerId) return null;
  const record = userDossierStore.get(dossierId);
  if (!record) return null;
  if (record.ownerId !== ownerId) {
    throw new Error('Access Denied: You are not authorized to access this Fire NOC record');
  }
  return record;
}

/**
 * Updates item completion status, milestone, or submission references in a checklist.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {Object} updates
 * @returns {Object} Updated dossier
 */
export function updateFireSafetyChecklist(dossierId, ownerId, updates = {}) {
  const dossier = getFireSafetyChecklist(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Fire NOC record '${dossierId}' not found`);
  }

  const { itemsToUpdate = [], currentMilestone, submissionToken, inspectionScheduledDate, buildingName } = updates;

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

  if (currentMilestone && MILESTONE_STATUS[currentMilestone]) {
    dossier.currentMilestone = currentMilestone;
    dossier.milestoneHistory.push({
      milestone: currentMilestone,
      recordedAt: new Date().toISOString(),
      notes: updates.milestoneNote || `Milestone changed to ${currentMilestone}`
    });
  }

  if (submissionToken !== undefined) dossier.submissionToken = submissionToken;
  if (inspectionScheduledDate !== undefined) dossier.inspectionScheduledDate = inspectionScheduledDate;
  if (buildingName !== undefined) dossier.buildingName = buildingName;

  dossier.updatedAt = new Date().toISOString();
  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Records a deficiency notice / shortfall memo issued by the fire inspection team.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {Object} noticeInput
 * @returns {Object} Updated dossier
 */
export function recordFireDeficiencyNotice(dossierId, ownerId, noticeInput = {}) {
  const dossier = getFireSafetyChecklist(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Fire NOC record '${dossierId}' not found`);
  }

  const {
    memoNumber,
    description,
    issuingOfficer = 'Chief Fire Officer / Station Officer',
    issuedDate = new Date().toISOString(),
    responseDeadlineDays = 15
  } = noticeInput;

  if (!description || typeof description !== 'string') {
    throw new Error('Valid deficiency observation description is required');
  }

  const deadline = new Date(new Date(issuedDate).getTime() + responseDeadlineDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const deficiencyRecord = {
    deficiencyId: `def_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    memoNumber: memoNumber || `MEMO-${dossier.deficiencyNotices.length + 1}`,
    description,
    issuingOfficer,
    issuedDate: new Date(issuedDate).toISOString().slice(0, 10),
    responseDeadlineDate: deadline,
    status: 'PENDING_RECTIFICATION',
    resolvedAt: null,
    rectificationDetails: null
  };

  dossier.deficiencyNotices.push(deficiencyRecord);
  dossier.currentMilestone = MILESTONE_STATUS.DEFICIENCY_NOTICE_ISSUED;
  dossier.milestoneHistory.push({
    milestone: MILESTONE_STATUS.DEFICIENCY_NOTICE_ISSUED,
    recordedAt: new Date().toISOString(),
    notes: `Shortfall memo recorded: ${description}`
  });

  dossier.updatedAt = new Date().toISOString();
  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Resolves a previously recorded deficiency notice with proof explanation.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {string} deficiencyId
 * @param {string} resolutionExplanation
 * @returns {Object} Updated dossier
 */
export function resolveFireDeficiency(dossierId, ownerId, deficiencyId, resolutionExplanation) {
  const dossier = getFireSafetyChecklist(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Fire NOC record '${dossierId}' not found`);
  }

  const def = dossier.deficiencyNotices.find((d) => d.deficiencyId === deficiencyId);
  if (!def) {
    throw new Error(`Deficiency notice '${deficiencyId}' not found in record`);
  }

  def.status = 'RESOLVED';
  def.resolvedAt = new Date().toISOString();
  def.rectificationDetails = resolutionExplanation || 'Rectification verified by fire safety consultant.';

  const allResolved = dossier.deficiencyNotices.every((d) => d.status === 'RESOLVED');
  if (allResolved) {
    dossier.currentMilestone = MILESTONE_STATUS.DEFICIENCY_RESOLVED;
    dossier.milestoneHistory.push({
      milestone: MILESTONE_STATUS.DEFICIENCY_RESOLVED,
      recordedAt: new Date().toISOString(),
      notes: 'All inspection shortfalls rectified and re-compliance filed.'
    });
  }

  dossier.updatedAt = new Date().toISOString();
  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Deletes a Fire NOC dossier with owner authorization.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @returns {boolean} True if deleted
 */
export function deleteFireSafetyChecklist(dossierId, ownerId) {
  const dossier = getFireSafetyChecklist(dossierId, ownerId);
  if (!dossier) return false;
  return userDossierStore.delete(dossierId);
}

/**
 * Redacts personal identifiers for private export and shared links.
 * Scrubs owner IDs, building specific names/addresses, and consultant licence credentials.
 *
 * @param {Object} dossier Raw Fire NOC record
 * @returns {Object} Sanitized exportable object
 */
export function sanitizeFireChecklistForExport(dossier) {
  if (!dossier || typeof dossier !== 'object') {
    return null;
  }

  const sanitized = JSON.parse(JSON.stringify(dossier));

  sanitized.ownerId = 'REDACTED_CITIZEN_ID';
  sanitized.buildingName = 'REDACTED_PREMISES';

  if (sanitized.submissionToken) {
    sanitized.submissionToken = 'TOKEN_XXXX_REDACTED';
  }
  if (sanitized.architectCoaNumber) {
    sanitized.architectCoaNumber = 'COA/XXXX/REDACTED';
  }
  if (sanitized.fireConsultantLicence) {
    sanitized.fireConsultantLicence = 'FSC/XXXX/REDACTED';
  }

  if (Array.isArray(sanitized.checklistItems)) {
    sanitized.checklistItems = sanitized.checklistItems.map((item) => ({
      ...item,
      documentRef: item.documentRef ? 'REDACTED_FILE_REF' : null
    }));
  }

  if (Array.isArray(sanitized.deficiencyNotices)) {
    sanitized.deficiencyNotices = sanitized.deficiencyNotices.map((n) => ({
      ...n,
      issuingOfficer: n.issuingOfficer || 'Designated Fire Inspector'
    }));
  }

  return sanitized;
}

// In-memory registry for crowdsourced Fire Directorate corrections
const communityCorrectionRegistry = [];

/**
 * Submits a community correction or rule update proposal.
 *
 * @param {Object} proposalInput
 * @returns {Object} Registered correction proposal
 */
export function submitFireCorrectionProposal(proposalInput = {}) {
  const {
    jurisdictionKey,
    proposedAuthorityName,
    proposedPortalUrl,
    officialGazetteOrSourceUrl,
    submissionNotes,
    contributorId = 'ANONYMOUS_CONTRIBUTOR'
  } = proposalInput;

  if (!jurisdictionKey || !officialGazetteOrSourceUrl) {
    throw new Error('Valid jurisdictionKey and officialGazetteOrSourceUrl are mandatory');
  }

  const proposal = {
    proposalId: `fire_corr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    jurisdictionKey,
    proposedAuthorityName: proposedAuthorityName || null,
    proposedPortalUrl: proposedPortalUrl || null,
    officialGazetteOrSourceUrl,
    submissionNotes: submissionNotes || '',
    contributorId,
    reviewStatus: 'PENDING_ADMIN_REVIEW',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewerNotes: null
  };

  communityCorrectionRegistry.push(proposal);
  return proposal;
}

/**
 * Validates a submitted community correction payload.
 *
 * @param {Object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCommunityFireCorrection(input = {}) {
  const errors = [];
  if (!input.jurisdictionKey || typeof input.jurisdictionKey !== 'string') {
    errors.push('Jurisdiction key is mandatory.');
  }
  if (!input.officialGazetteOrSourceUrl || typeof input.officialGazetteOrSourceUrl !== 'string') {
    errors.push('Official gazette or portal URL is required.');
  } else {
    try {
      const parsed = new URL(input.officialGazetteOrSourceUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push('Official source must be a valid http(s) URL.');
      }
    } catch {
      errors.push('Official source URL is malformed.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Evaluates a community correction proposal (Administrator action).
 *
 * @param {string} proposalId
 * @param {string} decision 'APPROVED' | 'REJECTED'
 * @param {string} reviewerNotes
 * @returns {Object} Updated proposal
 */
export function reviewFireCorrectionProposal(proposalId, decision, reviewerNotes = '') {
  const proposal = communityCorrectionRegistry.find((p) => p.proposalId === proposalId);
  if (!proposal) {
    throw new Error(`Fire correction proposal '${proposalId}' not found`);
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
 * Reset internal stores for testing.
 */
export function _resetInternalStores() {
  userDossierStore.clear();
  communityCorrectionRegistry.length = 0;
}

