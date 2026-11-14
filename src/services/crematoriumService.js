/**
 * Crematorium & Burial-Ground Service (#728).
 * Provides facility filtering, jurisdiction resolution, freshness audits,
 * and plain-text bereavement instructions.
 *
 * Invariants:
 *  1. No live slot availability tracking or speculation.
 *  2. Official instructions separated from editorial explanations.
 *  3. Explicit unavailable/unverified data states.
 */

import { VERIFIED_CREMATORIUM_FACILITIES } from '../data/crematoriumFacilities';
import { getVerificationFreshness } from './sourceVerificationService';
import { REQUIREMENT_LABELS } from './requirementTypes';

const clean = (val) => (typeof val === 'string' ? val.trim().toLowerCase() : '');

/**
 * Filter facilities by jurisdiction, type, accessibility, and query.
 */
export function filterCrematoriumFacilities(facilities = VERIFIED_CREMATORIUM_FACILITIES, filters = {}) {
  const {
    state = '',
    district = '',
    facilityType = 'all',
    onlyWheelchair = false,
    onlyColdStorage = false,
    onlyOutOfHours = false,
    searchQuery = '',
  } = filters;

  const targetState = clean(state);
  const targetDistrict = clean(district);
  const targetType = clean(facilityType);
  const targetQuery = clean(searchQuery);

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
    if (onlyWheelchair && facility.accessibility?.wheelchairAccessible !== true) {
      return false;
    }
    if (onlyColdStorage && facility.accessibility?.mortuaryColdStorage !== true) {
      return false;
    }
    if (onlyOutOfHours && facility.operatingHours?.outOfHoursServices !== true) {
      return false;
    }
    if (targetQuery) {
      const matchName = clean(facility.name).includes(targetQuery);
      const matchAddress = clean(facility.address).includes(targetQuery);
      const matchAuthority = clean(facility.managingAuthority).includes(targetQuery);
      const matchDistrict = clean(facility.district).includes(targetQuery);
      if (!matchName && !matchAddress && !matchAuthority && !matchDistrict) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Retrieves single facility by ID from verified catalogue or custom records.
 */
export function getCrematoriumById(id, customList = []) {
  if (!id) return null;
  const matchCustom = customList.find((f) => f.id === id);
  if (matchCustom) return matchCustom;
  return VERIFIED_CREMATORIUM_FACILITIES.find((f) => f.id === id) || null;
}

/**
 * Evaluates facility data freshness status.
 */
export function getFacilityFreshness(facility) {
  const lastVerified = facility?.auditMetadata?.lastVerified;
  return getVerificationFreshness(lastVerified);
}

/**
 * Formats official booking & documentation instructions for a facility.
 * Keeps official facts distinct from editorial explanations and includes
 * mandatory privacy and live-availability disclaimers.
 */
export function formatCrematoriumInstructions(facility) {
  if (!facility || typeof facility !== 'object') {
    return 'Facility information unavailable.';
  }

  const sections = [];

  // 1. Header & Authority
  sections.push(`${facility.name || 'Public Facility'}`);
  sections.push(`Managing Authority: ${facility.managingAuthority || 'Municipal Local Body'}`);
  sections.push(`Jurisdiction: ${facility.district || 'Unspecified'}, ${facility.state || 'Unspecified'}`);
  sections.push(`Address: ${facility.address || 'Address not listed'}`);

  // 2. Official Contacts
  const phones = Array.isArray(facility.officialContact?.phone)
    ? facility.officialContact.phone.join(', ')
    : 'Not published';
  sections.push(`Official Contact: ${phones}`);
  if (facility.officialContact?.portalUrl) {
    sections.push(`Official Portal: ${facility.officialContact.portalUrl}`);
  }

  // 3. Operating Hours & Emergency Out-of-Hours
  const hours = facility.operatingHours?.hours || 'Hours not verified';
  const outOfHours = facility.operatingHours?.outOfHoursServices
    ? `Yes (${facility.operatingHours?.outOfHoursNotes || 'Emergency intake supported'})`
    : 'No out-of-hours intake published';
  sections.push(`Operating Hours:\n- Regular: ${hours}\n- Out-of-Hours / Night Intake: ${outOfHours}`);

  // 4. Official Booking Procedures (Only where published)
  if (Array.isArray(facility.bookingProcedures) && facility.bookingProcedures.length > 0) {
    const stepsText = facility.bookingProcedures
      .map((s, idx) => `${idx + 1}. ${s.title}: ${s.description}`)
      .join('\n');
    sections.push(`Official Procedures:\n${stepsText}`);
  } else {
    sections.push('Official Procedures:\nDirect counter intimation on arrival. No pre-booking procedure published by authority.');
  }

  // 5. Statutory Charges & Fees (Only where published)
  if (facility.statutoryCharges) {
    if (facility.statutoryCharges.isFree) {
      sections.push('Statutory Charges: Free public municipal service (subsidized by local authority).');
    } else if (Array.isArray(facility.statutoryCharges.feeSchedule)) {
      const feesText = facility.statutoryCharges.feeSchedule
        .map((f) => `- ${f.item}: ₹${f.amount}${f.notes ? ` (${f.notes})` : ''}`)
        .join('\n');
      sections.push(`Statutory Charges:\n${feesText}`);
    }
  } else {
    sections.push('Statutory Charges: Not published by official municipal source. Verify at facility counter.');
  }

  // 6. Required Documents & Requirement Classification
  if (Array.isArray(facility.requiredDocuments) && facility.requiredDocuments.length > 0) {
    const docsText = facility.requiredDocuments
      .map((d) => {
        const typeLabel = REQUIREMENT_LABELS[d.type] || 'Unverified';
        const condition = d.condition ? `: ${d.condition}` : '';
        return `- ${d.name} (${typeLabel}${condition})`;
      })
      .join('\n');
    sections.push(`Documents and Verification:\n${docsText}`);
  } else {
    sections.push('Documents and Verification:\nStandard Medical Death Report (Form 4/4A) and informant identification required under statutory rules.');
  }

  // 7. Data Provenance & Official Source
  if (facility.auditMetadata) {
    sections.push(
      `Official Source & Audit Provenance:\n` +
      `- Source: ${facility.auditMetadata.sourceUrl || 'Official Government Gazette'}\n` +
      `- Effective Date: ${facility.auditMetadata.effectiveDate || 'Dated Circular'}\n` +
      `- Last Verified: ${facility.auditMetadata.lastVerified || 'Audit pending'}\n` +
      `- Verified By: ${facility.auditMetadata.verifiedBy || 'Civic Operations'}`
    );
  }

  // 8. Mandatory Disclaimers
  sections.push(
    'Important Notice for Bereaved Families:\n' +
    '- Live slot availability is NOT tracked or implied. Contact the managing municipal office or facility gate directly.\n' +
    '- Always verify current procedural requirements with the official municipal health desk.'
  );

  return sections.join('\n\n');
}

/**
 * Builds standard checklist items for families preparing for last rites at this facility.
 */
export function buildBereavementChecklistItems(facility) {
  const base = [
    'Hospital / Doctor Medical Certificate of Cause of Death (Form 4/4A)',
    'Photocopy of deceased identity proof (Aadhaar / Voter ID / Passport)',
    'Informant / Next-of-Kin identification proof',
  ];

  if (Array.isArray(facility?.requiredDocuments)) {
    facility.requiredDocuments.forEach((doc) => {
      if (doc?.name && !base.includes(doc.name)) {
        base.push(doc.name);
      }
    });
  }

  base.push('Municipal Cremation / Burial Registration Pass');
  base.push('Collect statutory registry counter receipt for death certificate application');

  return base;
}

