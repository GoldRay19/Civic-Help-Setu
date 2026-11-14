// Data contract and validation for Public Distribution System (PDS) Fair Price Shop (FPS) records (#723).
// All records must link to dated official government portals (NFSA/State Food & Civil Supplies).
// Live stock speculation and citizen PII (ration card numbers, Aadhaar) are strictly prohibited.

import { validateJurisdiction as validateAppJurisdiction } from '../services/jurisdictionService';

export const PDS_SCHEMA_VERSION = 1;

// Citizen privacy & anti-hallucination forbidden fields:
// Ration card numbers, biometric IDs, citizen personal contacts, and live grain stock claims are strictly rejected.
export const FORBIDDEN_PDS_FIELDS = [
  'userId',
  'email_personal',
  'phone_personal',
  'password',
  'token',
  'aadhaar',
  'aadhaarNumber',
  'rationCardNumber',
  'rcNumber',
  'rationCardNo',
  'familyHead',
  'familyMembers',
  'liveStock',
  'availableStock',
  'currentStockKg',
  'estimatedWaitMinutes',
  'grainStock',
  'stockBalance',
];

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

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
    if (FORBIDDEN_PDS_FIELDS.includes(k)) {
      fail(`${next}: field is forbidden by PDS privacy or anti-hallucination policies.`);
    }
    scanForbidden(v, next, fail);
  });
}

/**
 * Validates a PDS Fair Price Shop record against the schema specification.
 * Returns array of validation error messages (empty on pass).
 */
export function validatePdsShopRecord(shop) {
  const errors = [];
  const fail = (msg) => errors.push(msg);

  if (!isObject(shop)) {
    return ['Shop record must be an object.'];
  }

  // Deep scan for forbidden fields
  scanForbidden(shop, '', fail);

  // Core Identity
  if (!isText(shop.id) || !ID_PATTERN.test(shop.id)) {
    fail(`id: must be a lowercase alphanumeric kebab-case slug, received "${shop.id}".`);
  }
  if (!isText(shop.name)) {
    fail('name: shop name is required.');
  }
  if (!isText(shop.fpsId)) {
    fail('fpsId: official Fair Price Shop ID / License number is required.');
  }
  if (!isText(shop.dealerName)) {
    fail('dealerName: dealer / licensee / SHG operator name is required.');
  }
  if (!isText(shop.managingAuthority)) {
    fail('managingAuthority: Food & Civil Supplies departmental authority is required.');
  }

  // Geographic Locality
  if (!isText(shop.state)) {
    fail('state: state/UT name is required.');
  }
  if (!isText(shop.district)) {
    fail('district: district name is required.');
  }
  if (!isText(shop.block)) {
    fail('block: sub-division/block/tehsil/taluk is required.');
  }
  if (!isText(shop.locality)) {
    fail('locality: ward/village/locality is required.');
  }
  if (!isText(shop.address)) {
    fail('address: physical street location is required.');
  }
  if (!isText(shop.pincode) || !PINCODE_PATTERN.test(shop.pincode)) {
    fail(`pincode: must be a 6-digit Indian PIN code, received "${shop.pincode}".`);
  }

  // Jurisdiction conformity
  if (!shop.jurisdiction || !isObject(shop.jurisdiction)) {
    fail('jurisdiction: structured jurisdiction object is required.');
  } else {
    const jErrors = validateAppJurisdiction(shop.jurisdiction);
    if (jErrors.length > 0) {
      fail(`jurisdiction: ${jErrors.join('; ')}`);
    }
  }

  // Operating Hours & Schedule
  if (!isObject(shop.operatingHours)) {
    fail('operatingHours: operating hours details required.');
  } else {
    if (!isText(shop.operatingHours.regularHours)) {
      fail('operatingHours.regularHours: published daily timings required.');
    }
    if (!isText(shop.operatingHours.weeklyOff)) {
      fail('operatingHours.weeklyOff: designated weekly off day required.');
    }
    if (!isText(shop.operatingHours.distributionCycle)) {
      fail('operatingHours.distributionCycle: monthly distribution dates required.');
    }
  }

  // Entitlements & ONORC
  if (!isObject(shop.entitlements)) {
    fail('entitlements: statutory entitlement details required.');
  } else {
    if (!isText(shop.entitlements.aayAllocation)) {
      fail('entitlements.aayAllocation: Antyodaya Anna Yojana allocation description required.');
    }
    if (!isText(shop.entitlements.phhAllocation)) {
      fail('entitlements.phhAllocation: Priority Household allocation description required.');
    }
    if (!isText(shop.entitlements.pricingPolicy)) {
      fail('entitlements.pricingPolicy: official pricing policy description required.');
    }
  }

  // ONORC Portability
  if (!isObject(shop.onorcPortability)) {
    fail('onorcPortability: ONORC details required.');
  } else {
    if (typeof shop.onorcPortability.enabled !== 'boolean') {
      fail('onorcPortability.enabled: boolean flag required.');
    }
    if (!isText(shop.onorcPortability.biometricAuthMode)) {
      fail('onorcPortability.biometricAuthMode: biometric authentication mode required.');
    }
  }

  // Official Contact & Grievance Redressal
  if (!isObject(shop.officialContact)) {
    fail('officialContact: contact and grievance channels required.');
  } else {
    if (!isText(shop.officialContact.nationalHelpline)) {
      fail('officialContact.nationalHelpline: toll-free helpline (e.g. 1967) required.');
    }
    if (!isText(shop.officialContact.stateGrievancePortal)) {
      fail('officialContact.stateGrievancePortal: official grievance URL/portal required.');
    }
  }

  // Document Requirements & Classification (required, conditional, unverified)
  if (shop.requiredDocuments !== undefined) {
    if (!Array.isArray(shop.requiredDocuments)) {
      fail('requiredDocuments: must be an array of document requirements.');
    } else {
      shop.requiredDocuments.forEach((doc, idx) => {
        if (!isObject(doc) || !isText(doc.name)) {
          fail(`requiredDocuments[${idx}]: document name is required.`);
        }
        if (!['required', 'conditional', 'optional', 'unverified'].includes(doc.type)) {
          fail(`requiredDocuments[${idx}].type: must be one of 'required', 'conditional', 'optional', 'unverified'.`);
        }
        if (doc.type === 'conditional' && !isText(doc.condition)) {
          fail(`requiredDocuments[${idx}].condition: conditional requirements must state the condition.`);
        }
      });
    }
  }

  // Audit Metadata & Provenance
  if (!isObject(shop.auditMetadata)) {
    fail('auditMetadata: provenance metadata required.');
  } else {
    if (!isHttpsUrl(shop.auditMetadata.sourceUrl)) {
      fail('auditMetadata.sourceUrl: must be a valid https:// government portal URL.');
    }
    if (!isRealDate(shop.auditMetadata.effectiveDate)) {
      fail('auditMetadata.effectiveDate: must be a valid YYYY-MM-DD date.');
    }
    if (!isRealDate(shop.auditMetadata.lastVerified)) {
      fail('auditMetadata.lastVerified: must be a valid YYYY-MM-DD date.');
    }
    if (!isText(shop.auditMetadata.verifiedBy)) {
      fail('auditMetadata.verifiedBy: auditor or verifying official required.');
    }
  }

  return errors;
}
