/**
 * Community Facility & Booking Permit Service (#716).
 * Provides facility filtering, freshness audits, preparation checklist generation,
 * and plain-text instructions export.
 *
 * Invariants:
 *  1. Strictly no live slot availability speculation or tracking.
 *  2. Official instructions separated from editorial explanations.
 *  3. Explicit unavailable/unverified data states.
 */

import { VERIFIED_COMMUNITY_FACILITIES } from '../data/communityFacilities';
import { getVerificationFreshness } from './sourceVerificationService';
import { REQUIREMENT_LABELS } from './requirementTypes';

const clean = (val) => (typeof val === 'string' ? val.trim().toLowerCase() : '');

/**
 * Filter community facilities by jurisdiction, type, capacity, accessibility, and query.
 */
export function filterCommunityFacilities(facilities = VERIFIED_COMMUNITY_FACILITIES, filters = {}) {
  const {
    state = '',
    district = '',
    facilityType = 'all',
    minCapacity = 0,
    onlyWheelchair = false,
    onlyParking = false,
    searchQuery = '',
  } = filters;

  const targetState = clean(state);
  const targetDistrict = clean(district);
  const targetType = clean(facilityType);
  const targetQuery = clean(searchQuery);
  const numMinCapacity = Number(minCapacity) || 0;

  return facilities.filter((facility) => {
    if (targetState && clean(facility.state) !== targetState) {
      return false;
    }
    if (targetDistrict && clean(facility.district) !== targetDistrict) {
      return false;
    }
    if (targetType && targetType !== 'all' && clean(facility.facilityType) !== targetType) {
      return false;
    }
    if (numMinCapacity > 0 && (facility.capacity?.total || 0) < numMinCapacity) {
      return false;
    }
    if (onlyWheelchair && facility.accessibility?.wheelchairAccessible !== true) {
      return false;
    }
    if (onlyParking && facility.accessibility?.parkingAvailable !== true) {
      return false;
    }
    if (targetQuery) {
      const matchName = clean(facility.name).includes(targetQuery);
      const matchAddress = clean(facility.address).includes(targetQuery);
      const matchAuthority = clean(facility.managingAuthority).includes(targetQuery);
      const matchDistrict = clean(facility.district).includes(targetQuery);
      const matchType = clean(facility.facilityType).includes(targetQuery);
      if (!matchName && !matchAddress && !matchAuthority && !matchDistrict && !matchType) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Retrieves a single community facility by ID.
 */
export function getCommunityFacilityById(id, customList = []) {
  if (!id) return null;
  const matchCustom = customList.find((f) => f.id === id);
  if (matchCustom) return matchCustom;
  return VERIFIED_COMMUNITY_FACILITIES.find((f) => f.id === id) || null;
}

/**
 * Evaluates facility data freshness status.
 */
export function getFacilityFreshness(facility) {
  const lastVerified = facility?.auditMetadata?.lastVerified;
  return getVerificationFreshness(lastVerified);
}

/**
 * Formats official booking & permit instructions for a facility.
 * Separates official statutory data from editorial summaries.
 */
export function formatCommunityFacilityInstructions(facility) {
  if (!facility || typeof facility !== 'object') {
    return 'Facility information unavailable.';
  }

  const sections = [];

  // 1. Header & Authority
  sections.push(`${facility.name || 'Public Municipal Facility'}`);
  sections.push(`Managing Authority: ${facility.managingAuthority || 'Municipal Corporation / Local Body'}`);

  // 2. Location & Contacts
  const phones = facility.officialContact?.phone?.join(', ') || 'In-person civic counter';
  const portal = facility.officialContact?.portalUrl ? `\n- Official Portal: ${facility.officialContact.portalUrl}` : '';
  const desk = facility.officialContact?.bookingDeskLocation ? `\n- Civic Desk: ${facility.officialContact.bookingDeskLocation}` : '';
  sections.push(
    `Location & Official Contact:\n` +
    `- Address: ${facility.address || ''}, ${facility.district || ''}, ${facility.state || ''} - ${facility.pincode || ''}\n` +
    `- Official Phone: ${phones}` +
    portal +
    desk
  );

  // 3. Permitted Uses & Lead Times
  const activities = Array.isArray(facility.permittedActivities) && facility.permittedActivities.length > 0
    ? facility.permittedActivities.map((a) => `  * ${a}`).join('\n')
    : '  * Refer to municipal bylaws';
  const leadTimes = facility.leadTimes
    ? `Minimum ${facility.leadTimes.minLeadDays} days lead time (Max advance: ${facility.leadTimes.maxAdvanceDays} days)`
    : 'Lead times not officially published';
  sections.push(
    `Permitted Activities & Booking Window:\n` +
    `${activities}\n` +
    `- Lead Time: ${leadTimes}`
  );

  // 4. Financial: Tariffs, Deposit, Cancellation
  const depositText = facility.securityDeposit?.required
    ? `Refundable security deposit: ₹${facility.securityDeposit.amount !== null ? facility.securityDeposit.amount : 'Variable as assessed'} (${facility.securityDeposit.refundTimeline || 'Post inspection'})`
    : 'No security deposit required';

  let cancelText = 'Cancellation policy not officially published by authority.';
  if (facility.cancellationPolicy?.isAvailable && Array.isArray(facility.cancellationPolicy.rules)) {
    cancelText = facility.cancellationPolicy.rules
      .map((r) => `  * ${r.timeline}: ${r.refundPercentage}% refund (${r.deductionNotes || 'Administrative charge'})`)
      .join('\n');
  }

  sections.push(
    `Tariffs, Security Deposit & Cancellation:\n` +
    `- Deposit: ${depositText}\n` +
    `- Cancellation Schedule:\n${cancelText}`
  );

  // 5. Statutory Event Permits
  if (Array.isArray(facility.eventPermits) && facility.eventPermits.length > 0) {
    const permitsText = facility.eventPermits
      .map((p) => {
        const typeLabel = REQUIREMENT_LABELS[p.type] || p.type;
        const cond = p.condition ? ` (Condition: ${p.condition})` : '';
        return `  * ${p.name} - ${p.authority} [${typeLabel}]${cond}`;
      })
      .join('\n');
    sections.push(`Statutory Event Permits & Clearances:\n${permitsText}`);
  }

  // 6. Data Provenance & Official Source
  if (facility.auditMetadata) {
    sections.push(
      `Official Source & Audit Provenance:\n` +
      `- Source: ${facility.auditMetadata.sourceUrl || 'Official Gazette'}\n` +
      `- Effective Date: ${facility.auditMetadata.effectiveDate || 'Dated Circular'}\n` +
      `- Last Verified: ${facility.auditMetadata.lastVerified || 'Pending'}\n` +
      `- Verified By: ${facility.auditMetadata.verifiedBy || 'Civic Operations'}`
    );
  }

  // 7. Mandatory Live-Slot Disclaimer
  sections.push(
    'Important Notice for Citizens:\n' +
    '- Live slot availability is NOT tracked or implied. Bookings must be verified with the official municipal desk.\n' +
    '- Confirm required statutory police, fire, and sound clearances before paying reservation tariffs.'
  );

  return sections.join('\n\n');
}

/**
 * Builds standard checklist items for citizens preparing a booking application for this facility.
 */
export function buildFacilityChecklistItems(facility) {
  const base = [
    'Government Photo ID of Applicant / Registered Trustee (Aadhaar / Voter ID / Passport)',
  ];

  if (facility?.leadTimes?.minLeadDays) {
    base.push(`Verify application lead time: submit at least ${facility.leadTimes.minLeadDays} days prior to event date`);
  }

  if (facility?.securityDeposit?.required) {
    const depStr = facility.securityDeposit.amount ? `₹${facility.securityDeposit.amount}` : 'as assessed by authority';
    base.push(`Prepare refundable security deposit instrument (${depStr})`);
  }

  // Event permits
  if (Array.isArray(facility?.eventPermits)) {
    facility.eventPermits.forEach((permit) => {
      if (permit?.name) {
        const label = `Obtain clearance: ${permit.name} (${permit.authority})`;
        if (!base.includes(label)) {
          base.push(label);
        }
      }
    });
  }

  // Required documents
  if (Array.isArray(facility?.requiredDocuments)) {
    facility.requiredDocuments.forEach((doc) => {
      if (doc?.name && !base.includes(doc.name)) {
        base.push(doc.name);
      }
    });
  }

  base.push('Submit layout / stage plan to municipal facility caretaker');
  base.push('Obtain stamped municipal allotment order and receipt pass');

  return base;
}
