// Data contract and validation for municipal community facility and booking permit records (#716).
// Enforces structured records with managing authority, official contacts, permitted uses,
// capacity, lead times, separated tariffs/deposits/cancellations, accessibility, and event permits.
// Live slot availability is strictly prohibited from being modeled or implied.

import { validateJurisdiction as validateAppJurisdiction } from '../services/jurisdictionService';

export const COMMUNITY_FACILITY_SCHEMA_VERSION = 1;

export const FACILITY_TYPES = [
  'community_hall',
  'town_hall',
  'municipal_auditorium',
  'sports_complex',
  'public_park',
  'open_ground',
];

export const FACILITY_TYPE_LABELS = {
  community_hall: 'Community Hall / Kalyan Mandap',
  town_hall: 'Town Hall',
  municipal_auditorium: 'Municipal Auditorium',
  sports_complex: 'Sports Complex / Ground',
  public_park: 'Public Park & Lawn',
  open_ground: 'Open Exhibition / Fair Ground',
};

// Strict Citizen Privacy & Live Availability Prevention:
// Personal applicant identifiers and speculative live-availability claims are strictly rejected.
export const FORBIDDEN_FACILITY_FIELDS = [
  'userId', 'email_personal', 'phone_personal', 'password', 'token',
  'aadhaar', 'aadhaarNumber', 'applicantName', 'familyContact', 'applicantPhone',
  'liveSlots', 'availableSlots', 'currentQueue', 'estimatedWaitMinutes',
  'slotBookingLive', 'instantBooking', 'liveAvailability', 'availableDates',
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
      fail(where, 'prohibited field (citizen privacy or forbidden live-slot indicator)');
    } else {
      scanForbidden(child, where, fail);
    }
  }
}

/**
 * Validates a single municipal community facility record.
 * Returns an array of { field, reason } errors (empty array = valid).
 */
export function validateCommunityFacilityRecord(record) {
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
    fail('managingAuthority', 'is required (e.g. Municipal Corporation or Urban Development Authority)');
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
    fail('officialContact', 'must be an object containing official contact information');
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
    if (record.officialContact.bookingDeskLocation !== undefined && !isText(record.officialContact.bookingDeskLocation)) {
      fail('officialContact.bookingDeskLocation', 'must be a non-empty string when provided');
    }
  }

  // Capacity metrics
  if (!isObject(record.capacity)) {
    fail('capacity', 'must be an object containing total capacity metrics');
  } else {
    if (typeof record.capacity.total !== 'number' || record.capacity.total <= 0) {
      fail('capacity.total', 'must be a positive number');
    }
    if (record.capacity.seated !== null && record.capacity.seated !== undefined) {
      if (typeof record.capacity.seated !== 'number' || record.capacity.seated < 0) {
        fail('capacity.seated', 'must be a non-negative number or null if unseated/lawn');
      }
    }
  }

  // Application lead times
  if (!isObject(record.leadTimes)) {
    fail('leadTimes', 'must be an object containing application lead time constraints');
  } else {
    if (typeof record.leadTimes.minLeadDays !== 'number' || record.leadTimes.minLeadDays < 0) {
      fail('leadTimes.minLeadDays', 'must be a non-negative number');
    }
    if (typeof record.leadTimes.maxAdvanceDays !== 'number' || record.leadTimes.maxAdvanceDays <= 0) {
      fail('leadTimes.maxAdvanceDays', 'must be a positive number');
    }
    if (record.leadTimes.maxAdvanceDays < record.leadTimes.minLeadDays) {
      fail('leadTimes.maxAdvanceDays', 'must be greater than or equal to minLeadDays');
    }
  }

  // Permitted & prohibited activities
  if (!Array.isArray(record.permittedActivities) || record.permittedActivities.length === 0) {
    fail('permittedActivities', 'must be a non-empty array of permitted activity strings');
  } else {
    record.permittedActivities.forEach((act, idx) => {
      if (!isText(act)) fail(`permittedActivities[${idx}]`, 'must be a non-empty string');
    });
  }

  if (!Array.isArray(record.prohibitedActivities)) {
    fail('prohibitedActivities', 'must be an array of prohibited activity strings');
  }

  // Operating hours & slots
  if (!isObject(record.operatingHours) || !isText(record.operatingHours.hours)) {
    fail('operatingHours.hours', 'must be provided');
  }

  // Statutory charges
  if (!isObject(record.statutoryCharges) || typeof record.statutoryCharges.isFree !== 'boolean') {
    fail('statutoryCharges', 'must be an object with boolean isFree property');
  } else if (!record.statutoryCharges.isFree) {
    if (record.statutoryCharges.feeSchedule !== null && record.statutoryCharges.feeSchedule !== undefined) {
      if (!Array.isArray(record.statutoryCharges.feeSchedule)) {
        fail('statutoryCharges.feeSchedule', 'must be an array of fee items or null when unpublished');
      } else {
        record.statutoryCharges.feeSchedule.forEach((fee, idx) => {
          if (!isObject(fee) || !isText(fee.slotOrCategory) || typeof fee.tariff !== 'number') {
            fail(`statutoryCharges.feeSchedule[${idx}]`, 'must contain slotOrCategory text and tariff number');
          }
        });
      }
    }
  }

  // Refundable security deposit
  if (record.securityDeposit !== null && record.securityDeposit !== undefined) {
    if (!isObject(record.securityDeposit) || typeof record.securityDeposit.required !== 'boolean') {
      fail('securityDeposit', 'must be an object with boolean required property or null');
    } else if (record.securityDeposit.required) {
      if (typeof record.securityDeposit.refundable !== 'boolean') {
        fail('securityDeposit.refundable', 'must be a boolean');
      }
      if (record.securityDeposit.amount !== null && typeof record.securityDeposit.amount !== 'number') {
        fail('securityDeposit.amount', 'must be a number or null if variable by event');
      }
    }
  }

  // Cancellation and refund policy
  if (record.cancellationPolicy !== null && record.cancellationPolicy !== undefined) {
    if (!isObject(record.cancellationPolicy) || typeof record.cancellationPolicy.isAvailable !== 'boolean') {
      fail('cancellationPolicy', 'must be an object with boolean isAvailable property or null');
    } else if (record.cancellationPolicy.isAvailable && record.cancellationPolicy.rules !== null) {
      if (!Array.isArray(record.cancellationPolicy.rules)) {
        fail('cancellationPolicy.rules', 'must be an array of rules or null');
      } else {
        record.cancellationPolicy.rules.forEach((rule, idx) => {
          if (!isObject(rule) || !isText(rule.timeline) || typeof rule.refundPercentage !== 'number') {
            fail(`cancellationPolicy.rules[${idx}]`, 'must contain timeline text and refundPercentage number');
          }
        });
      }
    }
  }

  // Accessibility
  if (record.accessibility !== undefined && record.accessibility !== null) {
    if (!isObject(record.accessibility) || typeof record.accessibility.wheelchairAccessible !== 'boolean') {
      fail('accessibility', 'must be an object with wheelchairAccessible boolean');
    }
  }

  // Event permissions & statutory permits (Sound NOC, Fire NOC, Food safety)
  if (record.eventPermits !== null && record.eventPermits !== undefined) {
    if (!Array.isArray(record.eventPermits)) {
      fail('eventPermits', 'must be an array of permit requirements or null');
    } else {
      const validTypes = ['required', 'conditional', 'optional', 'unverified'];
      record.eventPermits.forEach((permit, idx) => {
        if (!isObject(permit) || !isText(permit.name) || !validTypes.includes(permit.type)) {
          fail(`eventPermits[${idx}]`, 'must contain name and valid type (required|conditional|optional|unverified)');
        }
        if (permit.type === 'conditional' && !isText(permit.condition)) {
          fail(`eventPermits[${idx}].condition`, 'is required when type is conditional');
        }
      });
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
 * Validates a complete directory array of municipal community facilities.
 */
export function validateCommunityFacilityDirectory(facilities) {
  if (!Array.isArray(facilities)) {
    return { valid: false, errors: [{ field: 'directory', reason: 'must be an array' }] };
  }
  const errors = [];
  const seenIds = new Set();
  facilities.forEach((record, idx) => {
    const recordId = isObject(record) && isText(record.id) ? record.id : `#${idx}`;
    const recordErrors = validateCommunityFacilityRecord(record);
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

