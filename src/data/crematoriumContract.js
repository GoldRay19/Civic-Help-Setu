// Data contract and validation for public crematorium and burial ground facility records (#728).
// Internal code contract; all records must link to dated official government/municipal sources.
// Live slot availability is strictly prohibited from being modeled or implied.

import { validateJurisdiction as validateAppJurisdiction } from '../services/jurisdictionService';

export const CREMATORIUM_SCHEMA_VERSION = 1;

export const FACILITY_TYPES = [
  'electric_crematorium',
  'cng_crematorium',
  'traditional_wood_crematorium',
  'burial_ground',
  'cemetery',
  'composite_facility',
];

export const FACILITY_TYPE_LABELS = {
  electric_crematorium: 'Electric Crematorium',
  cng_crematorium: 'CNG Crematorium',
  traditional_wood_crematorium: 'Traditional Wood Crematorium',
  burial_ground: 'Burial Ground / Kabristan',
  cemetery: 'Cemetery',
  composite_facility: 'Composite Crematorium & Burial Facility',
};

// Bereaved family privacy & live slot prevention:
// Personal data and speculative live-availability claims are strictly rejected.
export const FORBIDDEN_FACILITY_FIELDS = [
  'userId', 'email_personal', 'phone_personal', 'password', 'token',
  'aadhaar', 'aadhaarNumber', 'deceasedName', 'applicantName', 'familyContact',
  'liveSlots', 'availableSlots', 'currentQueue', 'estimatedWaitMinutes', 'slotBookingLive',
];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const isHttpsUrl = (v) => {
  if (typeof v !== 'string') return false;
  try {
    return new URL(v).protocol === 'https:';
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
    if (FORBIDDEN_FACILITY_FIELDS.includes(key)) {
      fail(where, 'prohibited field (bereavement privacy or forbidden live-slot indicator)');
    } else {
      scanForbidden(child, where, fail);
    }
  }
}

/**
 * Validates a single crematorium or burial-ground record.
 * Returns an array of { field, reason } errors (empty array = valid).
 */
export function validateCrematoriumRecord(record) {
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
  if (!isText(record.name)) {
    fail('name', 'is required and must be a non-empty string');
  }
  if (!FACILITY_TYPES.includes(record.facilityType)) {
    fail('facilityType', `must be one of: ${FACILITY_TYPES.join(', ')}`);
  }
  if (!isText(record.managingAuthority)) {
    fail('managingAuthority', 'is required (e.g. Municipal Corporation name or Board)');
  }

  // Jurisdiction check
  if (!isObject(record.jurisdiction)) {
    fail('jurisdiction', 'must be a valid structured jurisdiction object');
  } else {
    const jErrors = validateAppJurisdiction(record.jurisdiction);
    for (const msg of jErrors) {
      fail('jurisdiction', msg);
    }
  }

  if (!isText(record.address)) {
    fail('address', 'is required and must be non-empty');
  }
  if (!isText(record.district)) {
    fail('district', 'is required');
  }
  if (!isText(record.state)) {
    fail('state', 'is required');
  }
  if (!isText(record.pincode) || !PINCODE_PATTERN.test(record.pincode)) {
    fail('pincode', 'must be a valid 6-digit Indian postal PIN code');
  }

  if (record.coordinates !== undefined) {
    if (
      !isObject(record.coordinates) ||
      typeof record.coordinates.lat !== 'number' ||
      typeof record.coordinates.lng !== 'number' ||
      record.coordinates.lat < -90 ||
      record.coordinates.lat > 90 ||
      record.coordinates.lng < -180 ||
      record.coordinates.lng > 180
    ) {
      fail('coordinates', 'must have valid latitude and longitude numbers');
    }
  }

  // Official contact
  if (!isObject(record.officialContact)) {
    fail('officialContact', 'must be an object containing official phone numbers');
  } else {
    if (!Array.isArray(record.officialContact.phone) || record.officialContact.phone.length === 0) {
      fail('officialContact.phone', 'must contain at least one official contact phone string');
    } else {
      record.officialContact.phone.forEach((p, idx) => {
        if (!isText(p)) fail(`officialContact.phone[${idx}]`, 'must be a non-empty string');
      });
    }
    if (record.officialContact.portalUrl !== undefined && !isHttpsUrl(record.officialContact.portalUrl)) {
      fail('officialContact.portalUrl', 'must be a valid https URL when provided');
    }
    if (record.officialContact.email !== undefined && !EMAIL_PATTERN.test(record.officialContact.email)) {
      fail('officialContact.email', 'must be a valid email string when provided');
    }
  }

  // Operating hours
  if (!isObject(record.operatingHours) || !isText(record.operatingHours.hours)) {
    fail('operatingHours.hours', 'must be provided');
  }

  // Published booking procedures (optional; null if unconfirmed)
  if (record.bookingProcedures !== null && record.bookingProcedures !== undefined) {
    if (!Array.isArray(record.bookingProcedures)) {
      fail('bookingProcedures', 'must be an array of official steps or null');
    } else {
      record.bookingProcedures.forEach((step, idx) => {
        if (!isObject(step) || !isText(step.title) || !isText(step.description)) {
          fail(`bookingProcedures[${idx}]`, 'each step must have title and description strings');
        }
      });
    }
  }

  // Published charges (optional; null if unconfirmed)
  if (record.statutoryCharges !== null && record.statutoryCharges !== undefined) {
    if (!isObject(record.statutoryCharges) || typeof record.statutoryCharges.isFree !== 'boolean') {
      fail('statutoryCharges', 'must be an object with boolean isFree property or null');
    } else if (record.statutoryCharges.feeSchedule !== undefined && !Array.isArray(record.statutoryCharges.feeSchedule)) {
      fail('statutoryCharges.feeSchedule', 'must be an array of fee items when present');
    }
  }

  // Required documents
  if (record.requiredDocuments !== null && record.requiredDocuments !== undefined) {
    if (!Array.isArray(record.requiredDocuments)) {
      fail('requiredDocuments', 'must be an array of document requirement objects or null');
    } else {
      const validTypes = ['required', 'conditional', 'optional', 'unverified'];
      record.requiredDocuments.forEach((doc, idx) => {
        if (!isObject(doc) || !isText(doc.name) || !validTypes.includes(doc.type)) {
          fail(`requiredDocuments[${idx}]`, 'must contain name and type (required|conditional|optional|unverified)');
        }
        if (doc.type === 'conditional' && !isText(doc.condition)) {
          fail(`requiredDocuments[${idx}].condition`, 'is required when type is conditional');
        }
      });
    }
  }

  // Audit metadata (Mandatory: All claims must link to a dated official source)
  if (!isObject(record.auditMetadata)) {
    fail('auditMetadata', 'is required for data provenance and verification');
  } else {
    if (!isHttpsUrl(record.auditMetadata.sourceUrl)) {
      fail('auditMetadata.sourceUrl', 'must be a valid https URL pointing to official authority/gazette');
    }
    if (!isRealDate(record.auditMetadata.effectiveDate)) {
      fail('auditMetadata.effectiveDate', 'must be a valid date in YYYY-MM-DD format');
    }
    if (!isRealDate(record.auditMetadata.lastVerified)) {
      fail('auditMetadata.lastVerified', 'must be a valid date in YYYY-MM-DD format');
    }
    if (!isText(record.auditMetadata.verifiedBy)) {
      fail('auditMetadata.verifiedBy', 'must be specified');
    }
  }

  return errors;
}

/**
 * Validates a complete directory array.
 */
export function validateCrematoriumDirectory(facilities) {
  if (!Array.isArray(facilities)) {
    return { valid: false, errors: [{ field: 'directory', reason: 'must be an array' }] };
  }
  const errors = [];
  const seenIds = new Set();
  facilities.forEach((record, idx) => {
    const recordId = isObject(record) && isText(record.id) ? record.id : `#${idx}`;
    const recordErrors = validateCrematoriumRecord(record);
    recordErrors.forEach((err) => errors.push({ id: recordId, ...err }));
    if (isObject(record) && isText(record.id)) {
      if (seenIds.has(record.id)) {
        errors.push({ id: recordId, field: 'id', reason: 'duplicate facility id' });
      }
      seenIds.add(record.id);
    }
  });
  return { valid: errors.length === 0, errors };
}

