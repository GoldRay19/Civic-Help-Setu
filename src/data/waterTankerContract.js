// Data contract and validation for Municipal Water-Tanker Request and Delivery records (#724).
// All records must link to dated official government/municipal sources.
// Live GPS tracking, speculative queue estimation, and citizen PII are strictly prohibited.

import { validateJurisdiction as validateAppJurisdiction } from '../services/jurisdictionService';

export const WATER_TANKER_SCHEMA_VERSION = 1;

export const OFFICIAL_CHANNEL_TYPES = [
  'portal',
  'helpline',
  'app',
  'ward_office',
];

export const REQUEST_STATUS_TYPES = [
  'requested',
  'acknowledged',
  'vehicle_assigned',
  'delivered',
  'delayed',
  'rejected',
];

export const REQUEST_STATUS_LABELS = {
  requested: 'Request Logged (Pending Acknowledgement)',
  acknowledged: 'Acknowledged by Water Authority',
  vehicle_assigned: 'Tanker Dispatched / In Transit',
  delivered: 'Water Delivered & Sump Filled',
  delayed: 'Overdue / Escalation Triggered (>24h)',
  rejected: 'Request Rejected / Out of Supply Area',
};

// Citizen privacy & anti-speculation forbidden fields:
// Personal IDs, exact flat/door numbers, payment credentials, and live vehicle telemetry are rejected.
export const FORBIDDEN_TANKER_FIELDS = [
  'userId',
  'email_personal',
  'phone_personal',
  'password',
  'token',
  'aadhaar',
  'aadhaarNumber',
  'pan',
  'bankAccount',
  'consumerPin',
  'exactHouseNo',
  'doorNo',
  'flatNo',
  'driverPersonalPhone',
  'residentAddress',
  'personalIdentifiers',
  'liveTankerLocation',
  'liveGpsTracking',
  'currentQueueWaitMinutes',
  'currentLiveWaitMinutes',
  'liveStockLitres',
  'realtimeWaitEstimate',
];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

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
    node.forEach((item, index) => scanForbidden(item, `${path}[${index}]`, fail));
    return;
  }
  if (!isObject(node)) return;

  Object.entries(node).forEach(([k, v]) => {
    const next = path ? `${path}.${k}` : k;
    if (FORBIDDEN_TANKER_FIELDS.includes(k)) {
      fail(next, 'Field is forbidden by water-tanker privacy or anti-hallucination policies.');
    }
    scanForbidden(v, next, fail);
  });
}

/**
 * Validates a single Municipal Water Authority record against the data contract.
 * Returns an array of error objects: [{ field: string, message: string }].
 */
export function validateWaterTankerAuthorityRecord(authority) {
  const errors = [];
  const fail = (field, message) => errors.push({ field, message });

  if (!isObject(authority)) {
    return [{ field: 'root', message: 'Authority record must be an object.' }];
  }

  // Deep scan for forbidden PII / live tracking fields
  scanForbidden(authority, '', fail);

  // Core Identity
  if (!isText(authority.id) || !ID_PATTERN.test(authority.id)) {
    fail('id', `Must be a lowercase alphanumeric kebab-case slug, received "${authority.id}".`);
  }
  if (!isText(authority.name)) {
    fail('name', 'Authority name is required.');
  }
  if (!isText(authority.shortCode)) {
    fail('shortCode', 'Authority short code (e.g. DJB, BWSSB, CMWSSB) is required.');
  }
  if (!isText(authority.managingAuthority)) {
    fail('managingAuthority', 'Full statutory municipal/water board authority name is required.');
  }
  if (!isText(authority.city)) {
    fail('city', 'City name is required.');
  }
  if (!isText(authority.state)) {
    fail('state', 'State or Union Territory name is required.');
  }

  // Jurisdiction check
  if (!isObject(authority.jurisdiction)) {
    fail('jurisdiction', 'Must be a valid structured jurisdiction object.');
  } else {
    const jErrors = validateAppJurisdiction(authority.jurisdiction);
    for (const msg of jErrors) {
      fail('jurisdiction', msg);
    }
  }

  // Zones and Wards
  if (!Array.isArray(authority.zones) || authority.zones.length === 0) {
    fail('zones', 'Must list at least one covered municipal zone.');
  }
  if (!Array.isArray(authority.wards) || authority.wards.length === 0) {
    fail('wards', 'Must list covered municipal wards.');
  }

  // Official Channels
  if (!Array.isArray(authority.officialChannels) || authority.officialChannels.length === 0) {
    fail('officialChannels', 'Must provide at least one official booking channel.');
  } else {
    authority.officialChannels.forEach((ch, idx) => {
      if (!isObject(ch)) {
        fail(`officialChannels[${idx}]`, 'Channel must be an object.');
        return;
      }
      if (!OFFICIAL_CHANNEL_TYPES.includes(ch.type)) {
        fail(`officialChannels[${idx}].type`, `Type must be one of: ${OFFICIAL_CHANNEL_TYPES.join(', ')}.`);
      }
      if (!isText(ch.name)) {
        fail(`officialChannels[${idx}].name`, 'Channel name is required.');
      }
      if (ch.url && !isHttpsUrl(ch.url)) {
        fail(`officialChannels[${idx}].url`, 'Channel URL must use secure https:// protocol.');
      }
    });
  }

  // Eligibility conditions
  if (!isObject(authority.eligibilityConditions)) {
    fail('eligibilityConditions', 'Must provide structured eligibility conditions.');
  } else {
    if (!isText(authority.eligibilityConditions.freeSupplyCriteria)) {
      fail('eligibilityConditions.freeSupplyCriteria', 'Free supply eligibility criteria must be stated.');
    }
    if (!isText(authority.eligibilityConditions.paidTankerRules)) {
      fail('eligibilityConditions.paidTankerRules', 'Paid tanker booking rules must be stated.');
    }
    if (typeof authority.eligibilityConditions.consumerIdRequired !== 'boolean') {
      fail('eligibilityConditions.consumerIdRequired', 'Must explicitly state if Consumer Connection ID is required.');
    }
    if (typeof authority.eligibilityConditions.maxLitresPerOrder !== 'number' || authority.eligibilityConditions.maxLitresPerOrder <= 0) {
      fail('eligibilityConditions.maxLitresPerOrder', 'Max tanker capacity in litres must be a positive number.');
    }
  }

  // Pricing structure
  if (!isObject(authority.pricingStructure)) {
    fail('pricingStructure', 'Must provide structured pricing rules.');
  } else {
    if (typeof authority.pricingStructure.isFreeRationed !== 'boolean') {
      fail('pricingStructure.isFreeRationed', 'isFreeRationed flag must be a boolean.');
    }
    if (typeof authority.pricingStructure.standardRateInr !== 'number' || authority.pricingStructure.standardRateInr < 0) {
      fail('pricingStructure.standardRateInr', 'Standard rate in INR must be a non-negative number.');
    }
    if (authority.pricingStructure.officialOrderUrl && !isHttpsUrl(authority.pricingStructure.officialOrderUrl)) {
      fail('pricingStructure.officialOrderUrl', 'Official rate circular URL must use https:// protocol.');
    }
  }

  // Escalation Matrix
  if (!Array.isArray(authority.escalationMatrix) || authority.escalationMatrix.length === 0) {
    fail('escalationMatrix', 'Must provide at least one escalation tier for unfulfilled requests.');
  } else {
    authority.escalationMatrix.forEach((esc, idx) => {
      if (!isObject(esc)) {
        fail(`escalationMatrix[${idx}]`, 'Escalation tier must be an object.');
        return;
      }
      if (typeof esc.tier !== 'number' || esc.tier < 1) {
        fail(`escalationMatrix[${idx}].tier`, 'Escalation tier number must be a positive integer.');
      }
      if (!isText(esc.role)) {
        fail(`escalationMatrix[${idx}].role`, 'Escalation officer role/designation is required.');
      }
      if (!isText(esc.authority)) {
        fail(`escalationMatrix[${idx}].authority`, 'Escalation department/office is required.');
      }
      if (esc.grievancePortalUrl && !isHttpsUrl(esc.grievancePortalUrl)) {
        fail(`escalationMatrix[${idx}].grievancePortalUrl`, 'Grievance portal URL must use https:// protocol.');
      }
      if (typeof esc.statutorySlaHours !== 'number' || esc.statutorySlaHours <= 0) {
        fail(`escalationMatrix[${idx}].statutorySlaHours`, 'SLA hours must be a positive number.');
      }
    });
  }

  // Audit Metadata (Provenance)
  if (!isObject(authority.auditMetadata)) {
    fail('auditMetadata', 'auditMetadata is required.');
  } else {
    if (!isHttpsUrl(authority.auditMetadata.sourceUrl)) {
      fail('auditMetadata.sourceUrl', 'Official government sourceUrl must use https:// protocol.');
    }
    if (!isRealDate(authority.auditMetadata.effectiveDate)) {
      fail('auditMetadata.effectiveDate', 'effectiveDate must be a valid YYYY-MM-DD date string.');
    }
    if (!isRealDate(authority.auditMetadata.lastVerified)) {
      fail('auditMetadata.lastVerified', 'lastVerified must be a valid YYYY-MM-DD date string.');
    }
    if (!isText(authority.auditMetadata.verifiedBy)) {
      fail('auditMetadata.verifiedBy', 'verifiedBy reviewer identity or designation is required.');
    }
  }

  return errors;
}

/**
 * Validates an entire directory of Municipal Water Authority records.
 * Ensures all entries adhere to contract and have unique IDs.
 */
export function validateWaterTankerDirectory(records) {
  if (!Array.isArray(records)) {
    return { valid: false, errors: { directory: ['Directory must be an array of records.'] } };
  }

  const errors = {};
  const seenIds = new Set();

  records.forEach((record, idx) => {
    const key = record?.id || `entry_${idx}`;
    const recordErrors = validateWaterTankerAuthorityRecord(record);

    if (record?.id) {
      if (seenIds.has(record.id)) {
        recordErrors.push({ field: 'id', message: `Duplicate authority id "${record.id}".` });
      }
      seenIds.add(record.id);
    }

    if (recordErrors.length > 0) {
      errors[key] = recordErrors.map((e) => `${e.field}: ${e.message}`);
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

