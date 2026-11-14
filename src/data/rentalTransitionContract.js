// Data contract and validation for Rental Move-In and Move-Out Civic Records Checklist (#726).
// Enforces structured records with managing authority, official contacts, permitted utilities,
// verified HTTPS source links, dated meter reading configurations, and distinct move-in/move-out workflows.
// Contractual lease disputes and personal identifiers are strictly forbidden.

import { validateJurisdiction as validateAppJurisdiction } from '../services/jurisdictionService';

export const RENTAL_TRANSITION_SCHEMA_VERSION = 1;

export const WORKFLOW_STAGES = ['move_in', 'move_out'];

export const WORKFLOW_STAGE_LABELS = {
  move_in: 'Move-In (Occupancy Start)',
  move_out: 'Move-Out (Occupancy Handover)',
};

export const TRANSITION_CATEGORIES = [
  'electricity',
  'water',
  'piped_gas',
  'municipal_tax',
  'police_intimation',
  'address_evidence',
];

export const TRANSITION_CATEGORY_LABELS = {
  electricity: 'Electricity Meter & Consumer Mapping',
  water: 'Water Supply & Sewerage Board',
  piped_gas: 'Piped Natural Gas (PNG) Utility',
  municipal_tax: 'Municipal Tenant Intimation & Property Tax',
  police_intimation: 'Jurisdictional Police Tenant Verification',
  address_evidence: 'Statutory Address Proof & Government IDs',
};

// Strict Citizen Privacy & Neutral Civic Scope:
// Personal applicant identifiers, proprietary lease deposits, and contractual dispute terms are strictly prohibited.
export const FORBIDDEN_RENTAL_FIELDS = [
  'userId', 'tenantName', 'landlordName', 'ownerName', 'personalPhone', 'personalEmail',
  'password', 'token', 'aadhaar', 'aadhaarNumber', 'panNumber', 'bankAccountNumber',
  'ifscCode', 'securityDepositAmount', 'rentAmount', 'leaseAgreementFile', 'disputeClaimAmount',
  'arbitrationLawyer', 'damageDeductionClaim', 'rentalBiddingQuote',
];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isHttpsUrl = (v) => {
  if (typeof v !== 'string') return false;
  try {
    const url = new URL(v);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isRealDate = (v) => {
  const match = typeof v === 'string' && DATE_PATTERN.exec(v);
  if (!match) return false;
  const [y, m, d] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

function scanForbidden(node, path, fail) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => scanForbidden(item, `${path}[${i}]`, fail));
    return;
  }
  if (!isObject(node)) return;
  for (const [key, child] of Object.entries(node)) {
    const where = path ? `${path}.${key}` : key;
    if (FORBIDDEN_RENTAL_FIELDS.includes(key)) {
      fail(where, 'prohibited field (citizen privacy or forbidden contractual dispute parameter)');
    } else {
      scanForbidden(child, where, fail);
    }
  }
}

/**
 * Validates a single rental move-in / move-out transition record.
 * Returns an array of { field, reason } errors (empty array = valid).
 */
export function validateRentalTransitionRecord(record) {
  const errors = [];
  const fail = (field, reason) => errors.push({ field, reason });

  if (!isObject(record)) {
    fail('(record)', 'must be an object');
    return errors;
  }

  scanForbidden(record, '', fail);

  if (!isText(record.id) || !ID_PATTERN.test(record.id)) {
    fail('id', 'must be a lowercase kebab-case slug');
  }
  if (!isText(record.title)) {
    fail('title', 'is required and must be a non-empty string');
  }
  if (!WORKFLOW_STAGES.includes(record.stage)) {
    fail('stage', `must be one of: ${WORKFLOW_STAGES.join(', ')}`);
  }
  if (!TRANSITION_CATEGORIES.includes(record.category)) {
    fail('category', `must be one of: ${TRANSITION_CATEGORIES.join(', ')}`);
  }
  if (!isText(record.authority)) {
    fail('authority', 'is required (e.g. Utility Board, DISCOM, Municipal Corporation, or Police Commissionerate)');
  }

  // Jurisdiction verification
  if (!isObject(record.jurisdiction)) {
    fail('jurisdiction', 'must be a valid structured jurisdiction object');
  } else {
    const jErrors = validateAppJurisdiction(record.jurisdiction);
    for (const msg of jErrors) {
      fail('jurisdiction', msg);
    }
  }

  // Official source URL
  if (!isHttpsUrl(record.sourceUrl)) {
    fail('sourceUrl', 'must be a valid official https URL');
  }

  // Published / effective date
  if (!isRealDate(record.publishedDate)) {
    fail('publishedDate', 'must be a valid calendar date in YYYY-MM-DD format');
  }

  // Turnaround / SLA schedule (Strictly stated or explicit unavailable marker)
  if (!isObject(record.turnaroundSchedule)) {
    fail('turnaroundSchedule', 'must be an object with turnaround details and isUnavailable flag');
  } else {
    if (record.turnaroundSchedule.isUnavailable === true) {
      if (!isText(record.turnaroundSchedule.unavailableReason)) {
        fail('turnaroundSchedule.unavailableReason', 'required when turnaround schedule is marked unavailable');
      }
    } else {
      if (typeof record.turnaroundSchedule.workingDays !== 'number' || record.turnaroundSchedule.workingDays < 0) {
        fail('turnaroundSchedule.workingDays', 'must be a non-negative number of working days');
      }
    }
  }

  // Meter reading configuration
  if (!isObject(record.meterReadingConfig)) {
    fail('meterReadingConfig', 'must be an object defining meter reading parameters');
  } else {
    const { isApplicable, meterType, unit, requiresJointConfirmation } = record.meterReadingConfig;
    if (typeof isApplicable !== 'boolean') {
      fail('meterReadingConfig.isApplicable', 'must be a boolean');
    }
    if (isApplicable) {
      if (!['electricity', 'water', 'gas'].includes(meterType)) {
        fail('meterReadingConfig.meterType', 'must be one of: electricity, water, gas');
      }
      if (!isText(unit)) {
        fail('meterReadingConfig.unit', 'required when meter reading is applicable (e.g. kWh, kL, SCM)');
      }
      if (typeof requiresJointConfirmation !== 'boolean') {
        fail('meterReadingConfig.requiresJointConfirmation', 'must be a boolean');
      }
    }
  }

  // Handover inventory checklist items
  if (!Array.isArray(record.handoverInventory)) {
    fail('handoverInventory', 'must be an array of inventory items');
  } else {
    record.handoverInventory.forEach((item, idx) => {
      if (!isObject(item) || !isText(item.id) || !isText(item.label)) {
        fail(`handoverInventory[${idx}]`, 'each inventory item must have id and label');
      }
      if (typeof item.requiredForMoveOut !== 'boolean') {
        fail(`handoverInventory[${idx}].requiredForMoveOut`, 'must be a boolean');
      }
    });
  }

  // Verbatim Official Instructions vs Editorial Guidance
  if (!Array.isArray(record.officialInstructions) || record.officialInstructions.length === 0) {
    fail('officialInstructions', 'must be a non-empty array of verbatim official instructions');
  } else {
    record.officialInstructions.forEach((inst, idx) => {
      if (!isText(inst)) {
        fail(`officialInstructions[${idx}]`, 'must be a non-empty string');
      }
    });
  }

  if (!Array.isArray(record.editorialNotes)) {
    fail('editorialNotes', 'must be an array of editorial advisory notes');
  }

  // Audit metadata & provenance
  if (!isObject(record.auditMetadata)) {
    fail('auditMetadata', 'is required');
  } else {
    const { effectiveDate, lastVerified, verifiedBy, sourceUrl } = record.auditMetadata;
    if (!isRealDate(effectiveDate)) {
      fail('auditMetadata.effectiveDate', 'must be a valid date in YYYY-MM-DD format');
    }
    if (!isRealDate(lastVerified)) {
      fail('auditMetadata.lastVerified', 'must be a valid date in YYYY-MM-DD format');
    }
    if (!isText(verifiedBy)) {
      fail('auditMetadata.verifiedBy', 'is required');
    }
    if (!isHttpsUrl(sourceUrl)) {
      fail('auditMetadata.sourceUrl', 'must be a valid official https URL');
    }
  }

  return errors;
}

/**
 * Validates the full directory envelope of rental move-in and move-out records.
 */
export function validateRentalTransitionDirectory(envelope) {
  const errors = [];
  const fail = (field, reason) => errors.push({ field, reason });

  if (!isObject(envelope)) {
    return [{ field: '(root)', reason: 'envelope must be an object' }];
  }

  if (envelope.schemaVersion !== RENTAL_TRANSITION_SCHEMA_VERSION) {
    fail('schemaVersion', `must equal ${RENTAL_TRANSITION_SCHEMA_VERSION}`);
  }

  if (!Array.isArray(envelope.transitions)) {
    fail('transitions', 'must be an array of transition records');
    return errors;
  }

  const seenIds = new Set();

  envelope.transitions.forEach((item, idx) => {
    const itemErrors = validateRentalTransitionRecord(item);
    itemErrors.forEach((e) => {
      fail(`transitions[${idx}].${e.field}`, e.reason);
    });

    if (item && typeof item.id === 'string') {
      if (seenIds.has(item.id)) {
        fail(`transitions[${idx}].id`, `duplicate transition id: "${item.id}"`);
      }
      seenIds.add(item.id);
    }
  });

  return errors;
}

