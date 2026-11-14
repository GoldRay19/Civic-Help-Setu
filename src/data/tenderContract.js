// Data contract and validation for Government Tender Participation Readiness Workspace (#722).
// Internal code contract; all records must link to dated official government/portal sources.
// Purely non-transactional: bid submission, quotation pricing, and vendor PII are strictly rejected.

import { validateJurisdiction as validateAppJurisdiction } from '../services/jurisdictionService';

export const TENDER_SCHEMA_VERSION = 1;

export const TENDER_CATEGORIES = ['goods', 'works', 'services', 'consultancy'];

export const TENDER_CATEGORY_LABELS = {
  goods: 'Supply of Goods & Equipment',
  works: 'Civil & Engineering Works',
  services: 'Operational & Technical Services',
  consultancy: 'Consultancy & Advisory Services',
};

// Vendor privacy & non-transactional prevention:
// Personal identifiers and proprietary bidding data are strictly prohibited.
export const FORBIDDEN_TENDER_FIELDS = [
  'userId', 'vendorName', 'bidAmount', 'quotePrice', 'financialBid', 'technicalScore',
  'password', 'token', 'aadhaar', 'aadhaarNumber', 'panNumber', 'bankAccountNumber',
  'ifscCode', 'personalPhone', 'personalEmail', 'digitalSignatureKey', 'bidSecuritySubmissionNumber',
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
    if (FORBIDDEN_TENDER_FIELDS.includes(key)) {
      fail(where, 'prohibited field (vendor privacy or forbidden bidding data)');
    } else {
      scanForbidden(child, where, fail);
    }
  }
}

/**
 * Validates a single government tender readiness record.
 * Returns an array of { field, reason } errors (empty array = valid).
 */
export function validateTenderRecord(record) {
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
  if (!isText(record.tenderRefNumber)) {
    fail('tenderRefNumber', 'is required and must be a non-empty string');
  }
  if (!isText(record.title)) {
    fail('title', 'is required and must be a non-empty string');
  }
  if (!TENDER_CATEGORIES.includes(record.category)) {
    fail('category', `must be one of: ${TENDER_CATEGORIES.join(', ')}`);
  }
  if (!isText(record.authority)) {
    fail('authority', 'is required (e.g. Ministry, PSU, or Municipal Corporation)');
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

  // Published date
  if (!isRealDate(record.publishedDate)) {
    fail('publishedDate', 'must be a valid calendar date in YYYY-MM-DD format');
  }

  // Closing date (Strictly stated or explicit unavailable marker)
  if (!isObject(record.closingSchedule)) {
    fail('closingSchedule', 'must be an object with date and isUnavailable flag');
  } else {
    if (record.closingSchedule.isUnavailable === true) {
      if (!isText(record.closingSchedule.unavailableReason)) {
        fail('closingSchedule.unavailableReason', 'required when closing date is unavailable');
      }
    } else {
      if (!isRealDate(record.closingSchedule.closingDate)) {
        fail('closingSchedule.closingDate', 'must be a valid calendar date in YYYY-MM-DD format');
      }
    }
  }

  // Pre-bid meeting
  if (!isObject(record.preBidMeeting)) {
    fail('preBidMeeting', 'must be an object containing pre-bid meeting schedule');
  } else {
    if (record.preBidMeeting.isUnavailable === false && record.preBidMeeting.date !== null) {
      if (!isRealDate(record.preBidMeeting.date)) {
        fail('preBidMeeting.date', 'must be a valid calendar date in YYYY-MM-DD format or null');
      }
    }
  }

  // Financials & EMD
  if (!isObject(record.financials)) {
    fail('financials', 'must be an object describing tender value, fee, and EMD');
  } else {
    const { tenderFee, emd } = record.financials;
    if (!isObject(tenderFee) || typeof tenderFee.isExemptForMsme !== 'boolean') {
      fail('financials.tenderFee', 'must define fee details and isExemptForMsme boolean');
    }
    if (!isObject(emd) || typeof emd.isExemptForMsme !== 'boolean') {
      fail('financials.emd', 'must define EMD details and isExemptForMsme boolean');
    }
    if (emd && emd.isExemptForMsme && !isText(emd.exemptionBasis)) {
      fail('financials.emd.exemptionBasis', 'required when MSME EMD exemption is claimed (e.g. GFR 2017 Rule 170)');
    }
  }

  // Eligibility criteria separation: mandatory vs preferences
  if (!isObject(record.eligibilityCriteria)) {
    fail('eligibilityCriteria', 'must be an object with mandatory and preferences arrays');
  } else {
    const { mandatory, preferences } = record.eligibilityCriteria;
    if (!Array.isArray(mandatory) || mandatory.length === 0) {
      fail('eligibilityCriteria.mandatory', 'must contain at least one mandatory requirement');
    } else {
      mandatory.forEach((item, idx) => {
        if (!isObject(item) || !isText(item.id) || !isText(item.label) || !isText(item.evidenceRequired)) {
          fail(`eligibilityCriteria.mandatory[${idx}]`, 'each mandatory requirement must have id, label, and evidenceRequired');
        }
      });
    }

    if (!Array.isArray(preferences)) {
      fail('eligibilityCriteria.preferences', 'must be an array of preference clauses');
    } else {
      preferences.forEach((item, idx) => {
        if (!isObject(item) || !isText(item.id) || !isText(item.label) || !isText(item.policyReference)) {
          fail(`eligibilityCriteria.preferences[${idx}]`, 'each preference item must have id, label, and policyReference');
        }
      });
    }
  }

  // Corrigenda & Addenda log
  if (!Array.isArray(record.corrigenda)) {
    fail('corrigenda', 'must be an array of official corrigenda notices');
  } else {
    record.corrigenda.forEach((c, idx) => {
      if (!isObject(c) || typeof c.corrigendumNumber !== 'number' || !isRealDate(c.publishedDate) || !isText(c.title)) {
        fail(`corrigenda[${idx}]`, 'must have numeric corrigendumNumber, valid publishedDate, and title');
      }
    });
  }

  // Official Instructions vs Editorial Notes
  if (!Array.isArray(record.officialInstructions)) {
    fail('officialInstructions', 'must be an array of verbatim official notice instructions');
  }
  if (!Array.isArray(record.editorialNotes)) {
    fail('editorialNotes', 'must be an array of Civic Help Setu editorial guidance notes');
  }

  // Audit metadata & provenance
  if (!isObject(record.auditMetadata)) {
    fail('auditMetadata', 'is required');
  } else {
    const { effectiveDate, lastVerified, verifiedBy, sourceUrl } = record.auditMetadata;
    if (!isRealDate(effectiveDate)) {
      fail('auditMetadata.effectiveDate', 'must be a valid date');
    }
    if (!isRealDate(lastVerified)) {
      fail('auditMetadata.lastVerified', 'must be a valid date');
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
 * Validates the full directory envelope of tender notices.
 */
export function validateTenderDirectory(envelope) {
  const errors = [];
  const fail = (field, reason) => errors.push({ field, reason });

  if (!isObject(envelope)) {
    return [{ field: '(root)', reason: 'envelope must be an object' }];
  }

  if (envelope.schemaVersion !== TENDER_SCHEMA_VERSION) {
    fail('schemaVersion', `must equal ${TENDER_SCHEMA_VERSION}`);
  }

  if (!Array.isArray(envelope.tenders)) {
    fail('tenders', 'must be an array of tender records');
    return errors;
  }

  const seenIds = new Set();
  const seenRefs = new Set();

  envelope.tenders.forEach((tender, idx) => {
    const itemErrors = validateTenderRecord(tender);
    itemErrors.forEach((e) => {
      fail(`tenders[${idx}].${e.field}`, e.reason);
    });

    if (tender && typeof tender.id === 'string') {
      if (seenIds.has(tender.id)) {
        fail(`tenders[${idx}].id`, `duplicate tender id: "${tender.id}"`);
      }
      seenIds.add(tender.id);
    }

    if (tender && typeof tender.tenderRefNumber === 'string') {
      if (seenRefs.has(tender.tenderRefNumber)) {
        fail(`tenders[${idx}].tenderRefNumber`, `duplicate tender reference: "${tender.tenderRefNumber}"`);
      }
      seenRefs.add(tender.tenderRefNumber);
    }
  });

  return errors;
}
