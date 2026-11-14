/**
 * Service for Municipal Water-Tanker Request and Delivery Information (#724).
 * Handles authority filtering, request log persistence, address masking,
 * SLA breach calculation, and printable escalation letter generation.
 */

import { VERIFIED_WATER_TANKER_AUTHORITIES } from '../data/waterTankerAuthorities';
import { redactPersonalData } from '../utils/dataMinimization';

export const WATER_TANKER_STORAGE_KEY = 'civicbridge_watertanker_requests';

const getDefaultStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

/**
 * Filter water authorities by city, ward, supply type, and free-text search.
 */
export function filterWaterAuthorities(authorities = VERIFIED_WATER_TANKER_AUTHORITIES, filters = {}) {
  const {
    city = 'All',
    ward = 'All',
    search = '',
    supplyType = 'all', // 'all' | 'free' | 'paid'
  } = filters;

  const q = search.trim().toLowerCase();

  return authorities.filter((auth) => {
    // City match
    if (city !== 'All' && auth.city.toLowerCase() !== city.toLowerCase()) {
      return false;
    }

    // Ward match
    if (ward !== 'All' && !auth.wards.some((w) => w.toLowerCase().includes(ward.toLowerCase()))) {
      return false;
    }

    // Supply type match
    if (supplyType === 'free' && !auth.pricingStructure.isFreeRationed) {
      return false;
    }
    if (supplyType === 'paid' && auth.pricingStructure.isFreeRationed && auth.pricingStructure.standardRateInr === 0) {
      return false;
    }

    // Keyword search
    if (q) {
      const matchName = auth.name.toLowerCase().includes(q);
      const matchShortCode = auth.shortCode.toLowerCase().includes(q);
      const matchAuthority = auth.managingAuthority.toLowerCase().includes(q);
      const matchZone = auth.zones.some((z) => z.toLowerCase().includes(q));
      const matchWard = auth.wards.some((w) => w.toLowerCase().includes(q));
      if (!matchName && !matchShortCode && !matchAuthority && !matchZone && !matchWard) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Extracts unique list of cities present in the dataset.
 */
export function getAvailableCities(authorities = VERIFIED_WATER_TANKER_AUTHORITIES) {
  const set = new Set(authorities.map((a) => a.city));
  return ['All', ...Array.from(set).sort()];
}

/**
 * Extracts unique list of wards for a given city (or all cities).
 */
export function getAvailableWards(authorities = VERIFIED_WATER_TANKER_AUTHORITIES, selectedCity = 'All') {
  const set = new Set();
  authorities.forEach((auth) => {
    if (selectedCity === 'All' || auth.city.toLowerCase() === selectedCity.toLowerCase()) {
      auth.wards.forEach((w) => set.add(w));
    }
  });
  return ['All', ...Array.from(set).sort()];
}

/**
 * Address masking helper:
 * Protects exact residential addresses (door/flat/house numbers) in shared views and print summaries.
 * Retains only municipal ward, locality/landmark, and city.
 */
export function maskResidentialAddress(rawAddress, ward = '', city = '') {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return ward && city ? `[Residential Address Redacted], ${ward}, ${city}` : '[Residential Address Redacted]';
  }

  // First apply general personal data redactions (phones, IDs)
  let scrubbed = redactPersonalData(rawAddress);

  // Mask typical Indian street address patterns (Flat/House/Plot/Door No/Apt/Floor)
  const streetPattern = /\b(?:flat\s*(?:no\.?|#)?\s*[a-z0-9-]+|house\s*(?:no\.?|#)?\s*[a-z0-9/-]+|plot\s*(?:no\.?|#)?\s*[a-z0-9/-]+|door\s*(?:no\.?|#)?\s*[a-z0-9/-]+|no\.?\s*[0-9]+[a-z]?|[0-9]+[a-z]?\s*,\s*(?:[a-z0-9\s]+(?:floor|block|tower|wing)))\b/gi;
  scrubbed = scrubbed.replace(streetPattern, '[Residential Unit Masked]');

  // If the result still starts with specific house numbers like "12/4" or "402,"
  scrubbed = scrubbed.replace(/^[\s#A-Z0-9/-]+,\s*/i, '[Residential Unit Masked], ');

  return scrubbed.trim();
}

/**
 * Calculates SLA elapsed status for water tanker deliveries.
 * Default SLA is 24 hours.
 */
export function calculateSlaStatus(requestDateInput, slaHours = 24) {
  if (!requestDateInput) {
    return { isDelayed: false, elapsedHours: 0, slaHours, status: 'within_sla', label: 'On Schedule' };
  }

  const reqTime = new Date(requestDateInput).getTime();
  if (isNaN(reqTime)) {
    return { isDelayed: false, elapsedHours: 0, slaHours, status: 'within_sla', label: 'On Schedule' };
  }

  const now = Date.now();
  const elapsedMillis = Math.max(0, now - reqTime);
  const elapsedHours = Math.floor(elapsedMillis / (1000 * 60 * 60));

  if (elapsedHours > slaHours) {
    return {
      isDelayed: true,
      elapsedHours,
      slaHours,
      status: 'overdue',
      label: `Delayed by ${elapsedHours - slaHours} hours (SLA: ${slaHours}h)`,
    };
  }

  if (elapsedHours >= slaHours * 0.75) {
    return {
      isDelayed: false,
      elapsedHours,
      slaHours,
      status: 'nearing_sla',
      label: `Nearing SLA (${elapsedHours}/${slaHours} hours elapsed)`,
    };
  }

  return {
    isDelayed: false,
    elapsedHours,
    slaHours,
    status: 'within_sla',
    label: `Within SLA (${elapsedHours}/${slaHours} hours elapsed)`,
  };
}

/**
 * Builds standard pre-delivery readiness checklist items for a given water authority.
 */
export function buildWaterTankerChecklistItems(authority) {
  const shortCode = authority?.shortCode || 'Municipal Water Authority';
  return [
    'Underground sump / overhead tank cleaned, disinfected, and lid unlocked',
    'Delivery hose path clear of vehicles, gates, and obstructions (min 10-ft clearance)',
    'Inlet delivery pipe and valve checked; pump motor powered and operational',
    `Official ${shortCode} booking token / acknowledgement number confirmed on mobile`,
    `Exact statutory rate confirmed (${authority?.pricingStructure?.standardRateInr ? `₹${authority.pricingStructure.standardRateInr}` : 'Free Supply Quota'}); cash/UPI ready`,
    `Verify municipal seal and inspection tag on ${shortCode} tanker cabin upon arrival`,
    'Confirm water discharge directly into domestic sump before signing trip sheet / sharing OTP',
  ];
}

/**
 * Generates structured, printable escalation letter text for unfulfilled / delayed tanker deliveries.
 */
export function generateEscalationLetterText({
  requestLog,
  authority,
  tierIndex = 0,
}) {
  const auth = authority || {};
  const escTier = auth.escalationMatrix?.[tierIndex] || auth.escalationMatrix?.[0] || {
    role: 'Assistant Engineer (Water Supply)',
    authority: auth.managingAuthority || 'Municipal Water Supply Department',
    statutorySlaHours: 24,
    phone: '1916',
  };

  const maskedAddress = maskResidentialAddress(requestLog?.address, requestLog?.ward, auth.city);
  const bookingRef = requestLog?.bookingReference || 'N/A';
  const bookingDate = requestLog?.requestDate ? new Date(requestLog.requestDate).toLocaleString('en-IN') : 'N/A';
  const slaStatus = calculateSlaStatus(requestLog?.requestDate, escTier.statutorySlaHours);

  return `FORMAL CITIZEN REPRESENTATION: NON-DELIVERY OF MUNICIPAL WATER TANKER

Date of Grievance: ${new Date().toLocaleDateString('en-IN')}
To:
The ${escTier.role}
${escTier.authority}
${auth.city ? `${auth.city}, ${auth.state}` : 'Municipal Corporation'}

Subject: Formal Escalation for Unacknowledged / Undelivered Municipal Water Tanker
Reference Booking Token: ${bookingRef}

Respected Sir / Madam,

I am writing to register an urgent non-delivery grievance regarding a domestic water tanker booked through the official municipal channels of ${auth.name || 'the Municipal Water Board'}.

Details of Request:
--------------------------------------------------------------------------------
1. Citizen Reference Token : ${bookingRef}
2. Request Logged Date     : ${bookingDate}
3. Ward / Locality         : ${requestLog?.ward || 'Registered Ward'} (${auth.city || 'Municipal Area'})
4. Delivery Address        : ${maskedAddress}
5. Capacity Booked         : ${requestLog?.capacityLitres ? `${requestLog.capacityLitres} Litres` : 'Standard Tanker'}
6. Statutory SLA           : ${escTier.statutorySlaHours} Hours
7. Status at Escalation    : ${slaStatus.label} (${slaStatus.elapsedHours} hours elapsed)
--------------------------------------------------------------------------------

Reason for Escalation:
The citizen request was duly logged as per the official municipal protocol. The statutory delivery SLA of ${escTier.statutorySlaHours} hours has elapsed without fulfillment or driver dispatch intimation. Our household / residential colony is experiencing critical drinking water distress.

Grievance Redressal Relief Sought:
1. Immediate expedited dispatch of the requested municipal water tanker to the above-mentioned ward locality.
2. Written or SMS intimation of the assigned vehicle registration and depot control officer.
3. Waiver of delay penalty and assurance of potable water standards.

Under the Public Services Guarantee Act / Citizen Charter of ${auth.state || 'the State'}, drinking water supply constitutes an essential civic utility.

Respectfully submitted,
Resident / Consumer (Citizen Representation)
Contact Phone: [Redacted for Privacy / As registered with ${bookingRef}]
Official Grievance Redressal Portal: ${escTier.grievancePortalUrl || 'https://pgms.gov.in'}
Helpline Reference: ${escTier.phone || '1916'}
`;
}

/**
 * Local Storage CRUD for Citizen Request Logs
 */
export function getSavedRequests(storage = getDefaultStorage()) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(WATER_TANKER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRequest(requestItem, storage = getDefaultStorage()) {
  if (!storage || !requestItem) return false;
  try {
    const list = getSavedRequests(storage);
    const existingIndex = list.findIndex((r) => r.id === requestItem.id);

    const now = new Date().toISOString();
    const itemToSave = {
      ...requestItem,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = itemToSave;
    } else {
      itemToSave.createdAt = now;
      list.unshift(itemToSave);
    }

    storage.setItem(WATER_TANKER_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function deleteSavedRequest(requestId, storage = getDefaultStorage()) {
  if (!storage || !requestId) return false;
  try {
    const list = getSavedRequests(storage);
    const updated = list.filter((r) => r.id !== requestId);
    storage.setItem(WATER_TANKER_STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function clearAllSavedRequests(storage = getDefaultStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(WATER_TANKER_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

