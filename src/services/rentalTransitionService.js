// Service for querying and filtering Rental Move-In and Move-Out Civic Records (#726).
// Handles multi-jurisdiction filtering, workflow stages, utility categories, and freshness audits.

import { VERIFIED_RENTAL_TRANSITIONS } from '../data/rentalTransitions';

const clean = (val) => (typeof val === 'string' ? val.trim().toLowerCase() : '');

/**
 * Filter rental transition records by stage, category, jurisdiction, and keywords.
 */
export function filterRentalTransitions(
  transitions = VERIFIED_RENTAL_TRANSITIONS,
  filters = {}
) {
  const {
    stage = 'all', // 'all' | 'move_in' | 'move_out'
    category = 'all',
    jurisdictionLevel = 'all',
    state = '',
    district = '',
    authority = '',
    onlyMeterApplicable = false,
    searchQuery = '',
  } = filters;

  const targetStage = clean(stage);
  const targetCategory = clean(category);
  const targetLevel = clean(jurisdictionLevel);
  const targetState = clean(state);
  const targetDistrict = clean(district);
  const targetAuthority = clean(authority);
  const targetQuery = clean(searchQuery);

  return transitions.filter((item) => {
    // Stage filter (move_in / move_out)
    if (targetStage && targetStage !== 'all') {
      if (clean(item.stage) !== targetStage) {
        return false;
      }
    }

    // Category filter
    if (targetCategory && targetCategory !== 'all') {
      if (clean(item.category) !== targetCategory) {
        return false;
      }
    }

    // Jurisdiction Level filter
    if (targetLevel && targetLevel !== 'all') {
      if (clean(item.jurisdiction?.level) !== targetLevel) {
        return false;
      }
    }

    // State filter (National records apply everywhere unless strictly filtered by level)
    if (targetState) {
      const states = item.jurisdiction?.states || [];
      const hasState = states.some((s) => clean(s) === targetState);
      if (!hasState && item.jurisdiction?.level !== 'national') {
        return false;
      }
    }

    // District filter
    if (targetDistrict) {
      const districts = item.jurisdiction?.districts || [];
      const hasDistrict = districts.some((d) => clean(d) === targetDistrict);
      if (!hasDistrict && item.jurisdiction?.level !== 'national') {
        return false;
      }
    }

    // Authority filter
    if (targetAuthority) {
      if (!clean(item.authority).includes(targetAuthority)) {
        return false;
      }
    }

    // Meter reading applicable filter
    if (onlyMeterApplicable) {
      if (!item.meterReadingConfig?.isApplicable) {
        return false;
      }
    }

    // Search query keyword filter
    if (targetQuery) {
      const matchTitle = clean(item.title).includes(targetQuery);
      const matchAuthority = clean(item.authority).includes(targetQuery);
      const matchCategory = clean(item.category).includes(targetQuery);
      const matchInstructions = Array.isArray(item.officialInstructions)
        && item.officialInstructions.some((inst) => clean(inst).includes(targetQuery));

      if (!matchTitle && !matchAuthority && !matchCategory && !matchInstructions) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Extracts a sorted list of unique managing authorities from transitions.
 */
export function getUniqueAuthorities(transitions = VERIFIED_RENTAL_TRANSITIONS) {
  const set = new Set();
  transitions.forEach((item) => {
    if (item.authority) {
      set.add(item.authority.trim());
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Extracts a sorted list of unique states mentioned in jurisdiction metadata.
 */
export function getUniqueStates(transitions = VERIFIED_RENTAL_TRANSITIONS) {
  const set = new Set();
  transitions.forEach((item) => {
    const states = item.jurisdiction?.states || [];
    states.forEach((s) => {
      if (s) set.add(s.trim());
    });
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Audits whether a rental transition record has stale verification metadata (> 180 days).
 */
export function isRecordStale(record, maxDays = 180, referenceDate = new Date()) {
  const lastVerified = record?.auditMetadata?.lastVerified;
  if (!lastVerified) return true;

  const verifiedTime = new Date(lastVerified).getTime();
  const refTime = new Date(referenceDate).getTime();
  const diffDays = Math.floor((refTime - verifiedTime) / (1000 * 60 * 60 * 24));

  return diffDays > maxDays;
}

