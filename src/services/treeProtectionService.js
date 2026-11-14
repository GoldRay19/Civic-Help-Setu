/**
 * Tree Pruning Permission and Urban Tree Protection Guide Service
 *
 * Implements civic logic, local-authority routing, evidence checklists,
 * emergency hazardous tree protocols, illegal felling reporting, and
 * privacy-safe citizen dossier persistence under state preservation of trees acts.
 */

import {
  TREE_OPERATION_TYPE,
  OPERATION_METADATA,
  STATUTORY_SCOPE_NOTICE,
  VERIFIED_TREE_AUTHORITIES,
  PROTECTED_TREE_SPECIES,
  EVIDENCE_CHECKLIST_SCHEMA,
} from '../data/treeProtectionData';

export {
  TREE_OPERATION_TYPE,
  OPERATION_METADATA,
  STATUTORY_SCOPE_NOTICE,
  VERIFIED_TREE_AUTHORITIES,
  PROTECTED_TREE_SPECIES,
  EVIDENCE_CHECKLIST_SCHEMA,
};

export const VERIFICATION_STATE = {
  VERIFIED: 'VERIFIED',
  STALE_DATA_WARNING: 'STALE_DATA_WARNING',
  UNAVAILABLE_OR_UNVERIFIED: 'UNAVAILABLE_OR_UNVERIFIED',
};

export const CHECKLIST_ITEM_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
};

// In-memory data store for user-managed checklists (keyed by checklistId)
const userTreeChecklistStore = new Map();

// In-memory store for community correction proposals
const communityCorrectionRegistry = [];

/**
 * Checks if a verification timestamp is older than maxStaleDays.
 *
 * @param {string} verificationTimestamp ISO date string
 * @param {number} maxStaleDays Number of allowed days before marking stale
 * @returns {boolean} True if data is stale
 */
export function isDataStale(verificationTimestamp, maxStaleDays = 180) {
  if (!verificationTimestamp) return true;
  const verifiedMs = new Date(verificationTimestamp).getTime();
  if (Number.isNaN(verifiedMs)) return true;
  const ageDays = (Date.now() - verifiedMs) / (1000 * 60 * 60 * 24);
  return ageDays > maxStaleDays;
}

/**
 * Resolves the competent municipal / forest authority for a given jurisdiction.
 * If unverified or unknown, returns an explicit UNAVAILABLE_OR_UNVERIFIED response
 * rather than filling gaps with assumptions.
 *
 * @param {string} jurisdictionKey e.g. 'DELHI_NCT', 'KARNATAKA_BENGALURU'
 * @returns {Object} Authority details with verification status
 */
export function resolveCompetentTreeAuthority(jurisdictionKey) {
  const normKey = (jurisdictionKey || '').trim().toUpperCase();
  const record = VERIFIED_TREE_AUTHORITIES[normKey];

  if (!record) {
    return {
      status: VERIFICATION_STATE.UNAVAILABLE_OR_UNVERIFIED,
      isSupported: false,
      jurisdictionKey: normKey || 'UNKNOWN_JURISDICTION',
      message: `Statutory tree protection and pruning rules for '${jurisdictionKey}' are currently unverified in this registry.`,
      disclaimer: STATUTORY_SCOPE_NOTICE,
      statutoryAct: 'National Forest Policy / State Tree Preservation Rules',
      recommendedAction:
        'Do not assume or prune without confirmation. Contact your District Forest Officer (DFO) or Municipal Commissioner Horticulture Cell directly.',
      sourceUrl: null,
      verificationTimestamp: null,
      isStale: false,
    };
  }

  const stale = isDataStale(record.verificationTimestamp, record.maxStaleDays);

  return {
    status: stale ? VERIFICATION_STATE.STALE_DATA_WARNING : VERIFICATION_STATE.VERIFIED,
    isSupported: true,
    jurisdictionKey: record.jurisdictionKey,
    state: record.state,
    city: record.city,
    authorityName: record.authorityName,
    competentOfficerTitle: record.competentOfficerTitle,
    statutoryAct: record.statutoryAct,
    portalName: record.portalName,
    portalUrl: record.portalUrl,
    sourceUrl: record.sourceUrl,
    effectiveDate: record.effectiveDate,
    verificationTimestamp: record.verificationTimestamp,
    isStale: stale,
    publicObjectionWindowDays: record.publicObjectionWindowDays,
    inspectionMandatory: record.inspectionMandatory,
    inspectionTimelineDays: record.inspectionTimelineDays,
    compensatoryPlantationRatio: record.compensatoryPlantationRatio,
    pruningThresholdRule: record.pruningThresholdRule,
    statutoryPenalties: record.statutoryPenalties,
    emergencyHelpline: record.emergencyHelpline,
    guidanceNotes: record.guidanceNotes,
    disclaimer: STATUTORY_SCOPE_NOTICE,
  };
}

/**
 * Returns a list of all currently supported and verified jurisdictions.
 *
 * @returns {Array<Object>}
 */
export function listSupportedJurisdictions() {
  return Object.values(VERIFIED_TREE_AUTHORITIES).map((auth) => ({
    jurisdictionKey: auth.jurisdictionKey,
    city: auth.city,
    state: auth.state,
    authorityName: auth.authorityName,
    sourceUrl: auth.sourceUrl,
    verificationTimestamp: auth.verificationTimestamp,
    isStale: isDataStale(auth.verificationTimestamp, auth.maxStaleDays),
  }));
}

/**
 * Returns the protected tree species directory.
 *
 * @returns {Array<Object>}
 */
export function getProtectedSpeciesDirectory() {
  return PROTECTED_TREE_SPECIES;
}

/**
 * Retrieves the comprehensive action requirements, evidence checklist, and legal parameters.
 *
 * @param {string} operationType e.g., 'PRUNING', 'TRANSPLANTATION', 'REMOVAL'
 * @param {string} jurisdictionKey e.g., 'DELHI_NCT'
 * @returns {Object}
 */
export function getTreeActionRequirements(operationType = TREE_OPERATION_TYPE.PRUNING, jurisdictionKey = 'DELHI_NCT') {
  const normOp = (operationType || TREE_OPERATION_TYPE.PRUNING).toUpperCase();
  const metadata = OPERATION_METADATA[normOp] || OPERATION_METADATA[TREE_OPERATION_TYPE.PRUNING];
  const authorityInfo = resolveCompetentTreeAuthority(jurisdictionKey);

  // Filter or augment evidence items based on operation type
  const categorizedChecklist = EVIDENCE_CHECKLIST_SCHEMA.map((cat) => ({
    categoryId: cat.categoryId,
    categoryTitle: cat.categoryTitle,
    items: cat.items.map((item) => {
      let isMandatory = item.mandatory;
      let conditionalNote = item.condition || null;

      if (item.id === 'TRANSPLANT_RECEIVING_SITE_PLAN') {
        isMandatory = normOp === TREE_OPERATION_TYPE.TRANSPLANTATION;
      }
      if (item.id === 'COMPENSATORY_UNDERTAKING' && normOp === TREE_OPERATION_TYPE.PRUNING) {
        isMandatory = false;
        conditionalNote = 'Generally exempt for routine branch trimming; required if severe crown reduction is requested.';
      }

      return {
        id: item.id,
        label: item.label,
        helpText: item.helpText || null,
        mandatory: isMandatory,
        condition: conditionalNote,
      };
    }),
  }));

  return {
    operation: metadata,
    authority: authorityInfo,
    evidenceChecklist: categorizedChecklist,
    protectedSpecies: PROTECTED_TREE_SPECIES,
    statutoryNotice: STATUTORY_SCOPE_NOTICE,
    editorialNotice:
      'Editorial Advice: Always obtain an arborist or municipal pre-inspection before cutting any branch thicker than an adult arm. Many species have active nesting seasons during March–June where pruning is strictly deferred.',
  };
}

/**
 * Dedicated fast-track route for dangerous, tilting, or damaged trees posing immediate public hazards.
 *
 * @param {string} jurisdictionKey
 * @returns {Object}
 */
export function getEmergencyHazardRoute(jurisdictionKey = 'DELHI_NCT') {
  const authorityInfo = resolveCompetentTreeAuthority(jurisdictionKey);

  return {
    routeType: 'EMERGENCY_DANGEROUS_TREE',
    isEmergency: true,
    title: 'Emergency Hazardous / Fallen Tree Response Protocol',
    authority: authorityInfo,
    emergencyHotline: authorityInfo.isSupported ? authorityInfo.emergencyHelpline : '112 / State Disaster Management',
    immediateActionSteps: [
      {
        stepNumber: 1,
        title: 'Cordon Off Perimeter',
        instruction: 'Keep pedestrians, parked vehicles, and children at least 1.5 times the tree height away from leaning trunks.',
      },
      {
        stepNumber: 2,
        title: 'Contact Power Utility (If Wire Entanglement)',
        instruction: 'If branches touch or are near high-tension electrical cables, immediately call your local electricity discom to disconnect supply before attempting any action.',
      },
      {
        stepNumber: 3,
        title: 'Lodge 24/7 Disaster Cell Incident',
        instruction: `Call ${authorityInfo.emergencyHelpline || '112'} and provide GPS coordinates or nearest landmark for the municipal Tree Quick Response Team.`,
      },
      {
        stepNumber: 4,
        title: 'Fast-Track Emergency Removal Exemption',
        instruction: 'Under emergency clauses of Tree Preservation Acts, municipal disaster teams can clear immediately hazardous timber without waiting for the 15-30 day public objection notice window.',
      },
    ],
    statutoryDisclaimer:
      'Self-felling without municipal emergency crew or prior intimation remains subject to post-incident inspection and investigation.',
  };
}

/**
 * Dedicated confidential whistleblower route for reporting suspected illegal tree felling.
 *
 * @param {string} jurisdictionKey
 * @returns {Object}
 */
export function getIllegalFellingReportRoute(jurisdictionKey = 'DELHI_NCT') {
  const authorityInfo = resolveCompetentTreeAuthority(jurisdictionKey);

  return {
    routeType: 'ILLEGAL_FELLING_REPORT',
    isEnforcement: true,
    title: 'Report Suspected Illegal Tree Felling or Girdling',
    authority: authorityInfo,
    helpline: authorityInfo.isSupported ? authorityInfo.emergencyHelpline : '1926 (National Forest Helpline)',
    confidentialityNotice:
      'Whistleblower Protection: Your contact information is never disclosed to suspects or contractors. Reports are routed to the Forest Vigilance Squad and local Station House Officer (SHO).',
    investigationSteps: [
      {
        stepNumber: 1,
        title: 'Observe Safely (Do NOT Confront)',
        instruction: 'Maintain a safe physical distance. Do not engage directly with armed woodcutters or aggressive contractors.',
      },
      {
        stepNumber: 2,
        title: 'Capture Objective Time-Stamped Evidence',
        instruction: 'Discreetly photograph/video: tree trunk girth, chainsaw equipment, vehicle registration numbers (trucks/tractors hauling wood), and precise location landmarks.',
      },
      {
        stepNumber: 3,
        title: 'Check for Official Permit Display',
        instruction: 'Legitimate tree permissions must be displayed on-site or carried by the contractor with an official Tree Officer permission number and date stamp.',
      },
      {
        stepNumber: 4,
        title: 'Lodge Forest Vigilance & Police FIR Report',
        instruction: `Contact ${authorityInfo.authorityName || 'State Forest Department'} or dial 112 to register an immediate police call log under the relevant State Tree Preservation Act.`,
      },
    ],
    legalPenaltiesApplicable: authorityInfo.isSupported ? authorityInfo.statutoryPenalties : null,
  };
}

// ---------------------------------------------------------------------------
// Server-side Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validates checklist instantiation input on the server side.
 *
 * @param {Object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTreeChecklistInput(input = {}) {
  const errors = [];
  if (!input.ownerId || typeof input.ownerId !== 'string' || input.ownerId.trim().length === 0) {
    errors.push('ownerId is mandatory and must be a non-empty string');
  }
  if (!input.jurisdictionKey || typeof input.jurisdictionKey !== 'string') {
    errors.push('jurisdictionKey is mandatory');
  }
  if (input.operationType && !TREE_OPERATION_TYPE[input.operationType.toUpperCase()]) {
    errors.push(`Invalid operationType: ${input.operationType}. Allowed: ${Object.keys(TREE_OPERATION_TYPE).join(', ')}`);
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates feedback or community submission on the server side.
 *
 * @param {Object} feedbackInput
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFeedbackSubmission(feedbackInput = {}) {
  const errors = [];
  if (!feedbackInput.comment || typeof feedbackInput.comment !== 'string' || feedbackInput.comment.trim().length < 5) {
    errors.push('Comment must be at least 5 characters long');
  }
  if (feedbackInput.rating !== undefined && (typeof feedbackInput.rating !== 'number' || feedbackInput.rating < 1 || feedbackInput.rating > 5)) {
    errors.push('Rating must be an integer between 1 and 5');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// User-Managed Checklist Dossier CRUD (Private, Bound to ownerId)
// ---------------------------------------------------------------------------

/**
 * Creates a new user checklist dossier for tree permissions.
 *
 * @param {Object} input
 * @returns {Object} Created dossier
 */
export function createTreeChecklist(input = {}) {
  const validation = validateTreeChecklistInput(input);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  const {
    ownerId,
    jurisdictionKey = 'DELHI_NCT',
    operationType = TREE_OPERATION_TYPE.PRUNING,
    treeSpecies = 'Unspecified Native Species',
    treeLocationDescription = 'Private Plot Yard',
    estimatedGirthCm = 0,
  } = input;

  const authorityInfo = resolveCompetentTreeAuthority(jurisdictionKey);
  const requirements = getTreeActionRequirements(operationType, jurisdictionKey);

  const checklistId = `tree_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Flatten items into actionable checklist state
  const checklistItems = [];
  requirements.evidenceChecklist.forEach((category) => {
    category.items.forEach((item) => {
      checklistItems.push({
        itemId: item.id,
        categoryId: category.categoryId,
        label: item.label,
        mandatory: item.mandatory,
        condition: item.condition || null,
        status: CHECKLIST_ITEM_STATUS.PENDING,
        completed: false,
        verifiedDate: null,
        documentRef: null,
        notes: '',
      });
    });
  });

  const dossier = {
    id: checklistId,
    ownerId,
    jurisdictionKey: authorityInfo.isSupported ? authorityInfo.jurisdictionKey : jurisdictionKey,
    operationType,
    treeSpecies,
    treeLocationDescription,
    estimatedGirthCm: Number(estimatedGirthCm) || 0,
    checklistItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorityDetails: {
      authorityName: authorityInfo.authorityName || 'District Forest Department',
      competentOfficerTitle: authorityInfo.competentOfficerTitle || 'Tree Officer',
      statutoryAct: authorityInfo.statutoryAct || 'State Preservation of Trees Rules',
      sourceUrl: authorityInfo.sourceUrl || null,
    },
    statutoryDisclaimer: STATUTORY_SCOPE_NOTICE,
  };

  userTreeChecklistStore.set(checklistId, dossier);
  return dossier;
}

/**
 * Retrieves a checklist record with strict owner authorization.
 *
 * @param {string} checklistId
 * @param {string} ownerId
 * @returns {Object|null}
 */
export function getTreeChecklist(checklistId, ownerId) {
  if (!checklistId || !ownerId) return null;
  const record = userTreeChecklistStore.get(checklistId);
  if (!record) return null;
  if (record.ownerId !== ownerId) {
    throw new Error('Access Denied: You are not authorized to inspect this checklist record');
  }
  return record;
}

/**
 * Updates item completion or metadata in a user checklist record.
 *
 * @param {string} checklistId
 * @param {string} ownerId
 * @param {Object} updates
 * @returns {Object} Updated dossier
 */
export function updateTreeChecklist(checklistId, ownerId, updates = {}) {
  const dossier = getTreeChecklist(checklistId, ownerId);
  if (!dossier) {
    throw new Error(`Tree checklist record '${checklistId}' not found`);
  }

  const { itemsToUpdate = [], treeSpecies, treeLocationDescription, estimatedGirthCm } = updates;

  if (Array.isArray(itemsToUpdate)) {
    itemsToUpdate.forEach((upItem) => {
      const existing = dossier.checklistItems.find((i) => i.itemId === upItem.itemId);
      if (existing) {
        if (typeof upItem.completed === 'boolean') {
          existing.completed = upItem.completed;
          existing.status = upItem.completed ? CHECKLIST_ITEM_STATUS.COMPLETED : CHECKLIST_ITEM_STATUS.PENDING;
          existing.verifiedDate = upItem.completed ? new Date().toISOString() : null;
        }
        if (upItem.documentRef !== undefined) {
          existing.documentRef = upItem.documentRef;
        }
        if (upItem.notes !== undefined) {
          existing.notes = upItem.notes;
        }
      }
    });
  }

  if (treeSpecies) dossier.treeSpecies = treeSpecies;
  if (treeLocationDescription) dossier.treeLocationDescription = treeLocationDescription;
  if (estimatedGirthCm !== undefined) dossier.estimatedGirthCm = Number(estimatedGirthCm) || 0;

  dossier.updatedAt = new Date().toISOString();
  userTreeChecklistStore.set(checklistId, dossier);
  return dossier;
}

/**
 * Deletes a tree checklist record from storage.
 *
 * @param {string} checklistId
 * @param {string} ownerId
 * @returns {boolean} True if deleted
 */
export function deleteTreeChecklist(checklistId, ownerId) {
  const dossier = getTreeChecklist(checklistId, ownerId);
  if (!dossier) return false;
  return userTreeChecklistStore.delete(checklistId);
}

/**
 * Lists all active checklists for an authenticated user.
 *
 * @param {string} ownerId
 * @returns {Array<Object>}
 */
export function listUserTreeChecklists(ownerId) {
  if (!ownerId) return [];
  const results = [];
  userTreeChecklistStore.forEach((dossier) => {
    if (dossier.ownerId === ownerId) {
      results.push(dossier);
    }
  });
  return results;
}

// ---------------------------------------------------------------------------
// Privacy & Personal Identifier Redaction (PII Safe Export)
// ---------------------------------------------------------------------------

/**
 * Redacts personal identifiers for private export, analytics, or shared links.
 * Scrubs ownerId, contact details, precise survey references, and internal tokens.
 *
 * @param {Object} dossier Raw checklist record
 * @returns {Object} Sanitized exportable object
 */
export function sanitizeTreeChecklistForExport(dossier) {
  if (!dossier || typeof dossier !== 'object') {
    return null;
  }

  const sanitized = JSON.parse(JSON.stringify(dossier));

  // Scrub owner identity
  sanitized.ownerId = 'REDACTED_CITIZEN_ID';

  // Scrub precise plot / survey locations
  if (sanitized.treeLocationDescription) {
    sanitized.treeLocationDescription = 'REDACTED_PLOT_SURVEY_LOCATION';
  }

  // Scrub document references and citizen notes from checklist items
  if (Array.isArray(sanitized.checklistItems)) {
    sanitized.checklistItems = sanitized.checklistItems.map((item) => ({
      ...item,
      documentRef: item.documentRef ? 'REDACTED_DOCUMENT_ATTACHMENT' : null,
      notes: item.notes ? 'REDACTED_CITIZEN_NOTES' : '',
    }));
  }

  return sanitized;
}

// ---------------------------------------------------------------------------
// Community Corrections & Administrator Review Workflow
// ---------------------------------------------------------------------------

/**
 * Submits a community correction or rule update proposal for an authority record.
 *
 * @param {Object} proposalInput
 * @returns {Object}
 */
export function submitTreeDataCorrection(proposalInput = {}) {
  const {
    jurisdictionKey,
    proposedAuthorityName,
    proposedPortalUrl,
    officialGazetteOrSourceUrl,
    submissionNotes,
    contributorId = 'ANONYMOUS_CONTRIBUTOR',
  } = proposalInput;

  if (!jurisdictionKey || !officialGazetteOrSourceUrl) {
    throw new Error('Valid jurisdictionKey and verifiable officialGazetteOrSourceUrl are mandatory');
  }

  const proposal = {
    proposalId: `corr_tree_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    jurisdictionKey,
    proposedAuthorityName: proposedAuthorityName || null,
    proposedPortalUrl: proposedPortalUrl || null,
    officialGazetteOrSourceUrl,
    submissionNotes: submissionNotes || '',
    contributorId,
    reviewStatus: 'PENDING_ADMIN_REVIEW',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewerNotes: null,
  };

  communityCorrectionRegistry.push(proposal);
  return proposal;
}

/**
 * Reviews a community correction proposal (Administrator action).
 *
 * @param {string} proposalId
 * @param {string} decision 'APPROVED' | 'REJECTED'
 * @param {string} reviewerNotes
 * @returns {Object}
 */
export function reviewTreeDataCorrection(proposalId, decision, reviewerNotes = '') {
  const proposal = communityCorrectionRegistry.find((p) => p.proposalId === proposalId);
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
 * Returns all pending community correction proposals.
 *
 * @returns {Array<Object>}
 */
export function getPendingCorrectionProposals() {
  return communityCorrectionRegistry.filter((p) => p.reviewStatus === 'PENDING_ADMIN_REVIEW');
}

/**
 * Utility to clear in-memory stores between unit test executions.
 */
export function _resetInternalStores() {
  userTreeChecklistStore.clear();
  communityCorrectionRegistry.length = 0;
}

