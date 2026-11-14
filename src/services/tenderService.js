// Tender Information & Readiness Service (#722).
// Provides tender notice querying, jurisdiction filtering, urgency calculation,
// freshness auditing, and conditional requirements mapping.
//
// Invariants:
// 1. All claims must link to a dated official source.
// 2. Unknown requirements must be marked unverified rather than guessed.
// 3. Mandatory eligibility separated from evaluative preferences.
// 4. Zero vendor PII processed or stored.

import { VERIFIED_GOVERNMENT_TENDERS } from '../data/tenders';

const clean = (val) => (typeof val === 'string' ? val.trim().toLowerCase() : '');

/**
 * Filter tenders by jurisdiction, authority, category, MSME preferences, and keyword.
 */
export function filterTenders(tenders = VERIFIED_GOVERNMENT_TENDERS, filters = {}) {
  const {
    jurisdictionLevel = 'all',
    state = '',
    district = '',
    category = 'all',
    authority = '',
    onlyMsmeExempt = false,
    searchQuery = '',
    closingFilter = 'all', // 'all' | 'active' | 'closing_soon' | 'unavailable'
    referenceDate = new Date().toISOString().slice(0, 10),
  } = filters;

  const targetLevel = clean(jurisdictionLevel);
  const targetState = clean(state);
  const targetDistrict = clean(district);
  const targetCategory = clean(category);
  const targetAuthority = clean(authority);
  const targetQuery = clean(searchQuery);

  return tenders.filter((tender) => {
    // Jurisdiction level filter
    if (targetLevel && targetLevel !== 'all') {
      if (clean(tender.jurisdiction?.level) !== targetLevel) {
        return false;
      }
    }

    // State filter (if tender is state/district/local level)
    if (targetState) {
      const states = tender.jurisdiction?.states || [];
      const hasState = states.some((s) => clean(s) === targetState);
      if (!hasState && tender.jurisdiction?.level !== 'national') {
        return false;
      }
    }

    // District filter
    if (targetDistrict) {
      const districts = tender.jurisdiction?.districts || [];
      const hasDistrict = districts.some((d) => clean(d) === targetDistrict);
      if (!hasDistrict && tender.jurisdiction?.level !== 'national') {
        return false;
      }
    }

    // Category filter
    if (targetCategory && targetCategory !== 'all') {
      if (clean(tender.category) !== targetCategory) {
        return false;
      }
    }

    // Authority filter
    if (targetAuthority) {
      if (!clean(tender.authority).includes(targetAuthority)) {
        return false;
      }
    }

    // MSME EMD Exemption filter
    if (onlyMsmeExempt) {
      const isEmdExempt = tender.financials?.emd?.isExemptForMsme === true;
      const isFeeExempt = tender.financials?.tenderFee?.isExemptForMsme === true;
      if (!isEmdExempt && !isFeeExempt) {
        return false;
      }
    }

    // Closing urgency filter
    if (closingFilter !== 'all') {
      const urgency = getClosingUrgency(tender.closingSchedule, referenceDate);
      if (closingFilter === 'closing_soon' && urgency.status !== 'closing_soon') {
        return false;
      }
      if (closingFilter === 'active' && (urgency.status === 'closed' || urgency.status === 'unavailable')) {
        return false;
      }
      if (closingFilter === 'unavailable' && urgency.status !== 'unavailable') {
        return false;
      }
    }

    // Text query
    if (targetQuery) {
      const matchTitle = clean(tender.title).includes(targetQuery);
      const matchRef = clean(tender.tenderRefNumber).includes(targetQuery);
      const matchAuthority = clean(tender.authority).includes(targetQuery);
      const matchId = clean(tender.id).includes(targetQuery);
      const matchReq = (tender.eligibilityCriteria?.mandatory || []).some((m) =>
        clean(m.label).includes(targetQuery) || clean(m.evidenceRequired).includes(targetQuery)
      );

      if (!matchTitle && !matchRef && !matchAuthority && !matchId && !matchReq) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Retrieves a single tender by ID.
 */
export function getTenderById(id, customList = []) {
  if (!id) return null;
  const matchCustom = customList.find((t) => t.id === id);
  if (matchCustom) return matchCustom;
  return VERIFIED_GOVERNMENT_TENDERS.find((t) => t.id === id) || null;
}

/**
 * Calculates urgency and days remaining for tender closing.
 */
export function getClosingUrgency(closingSchedule, referenceDate = new Date().toISOString().slice(0, 10)) {
  if (!closingSchedule || closingSchedule.isUnavailable) {
    return {
      status: 'unavailable',
      label: 'Date to be announced in corrigendum',
      daysRemaining: null,
      badgeColor: 'var(--text-tertiary)',
    };
  }

  const closingDate = closingSchedule.closingDate;
  if (!closingDate) {
    return {
      status: 'unavailable',
      label: 'Unavailable from official notice',
      daysRemaining: null,
      badgeColor: 'var(--text-tertiary)',
    };
  }

  const refTime = new Date(referenceDate).getTime();
  const closingTime = new Date(closingDate).getTime();
  const diffDays = Math.ceil((closingTime - refTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'closed',
      label: `Closed (${Math.abs(diffDays)}d ago)`,
      daysRemaining: diffDays,
      badgeColor: '#ef4444',
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'closing_soon',
      label: `Closing Soon (${diffDays}d left)`,
      daysRemaining: diffDays,
      badgeColor: '#f59e0b',
    };
  }

  return {
    status: 'active',
    label: `${diffDays} days remaining`,
    daysRemaining: diffDays,
    badgeColor: '#10b981',
  };
}

/**
 * Evaluates the verification freshness of a tender record.
 * Thresholds:
 * - 'recent': verified <= 15 days ago
 * - 'standard': verified 16-45 days ago
 * - 'stale': verified > 45 days ago (triggers warning banner)
 */
export function getTenderFreshness(tender, referenceDate = new Date().toISOString().slice(0, 10)) {
  const verifiedDate = tender?.auditMetadata?.lastVerified;
  if (!verifiedDate) {
    return {
      tier: 'unverified',
      isStale: true,
      label: 'Audit pending verification',
      daysSinceAudit: null,
    };
  }

  const refTime = new Date(referenceDate).getTime();
  const auditTime = new Date(verifiedDate).getTime();
  const diffDays = Math.max(0, Math.floor((refTime - auditTime) / (1000 * 60 * 60 * 24)));

  if (diffDays <= 15) {
    return {
      tier: 'recent',
      isStale: false,
      label: `Verified ${diffDays === 0 ? 'today' : `${diffDays}d ago`}`,
      daysSinceAudit: diffDays,
    };
  }

  if (diffDays <= 45) {
    return {
      tier: 'standard',
      isStale: false,
      label: `Verified ${diffDays}d ago`,
      daysSinceAudit: diffDays,
    };
  }

  return {
    tier: 'stale',
    isStale: true,
    label: `Audit overdue (${diffDays}d ago)`,
    daysSinceAudit: diffDays,
  };
}

/**
 * Collect unique authorities from a list of tenders.
 */
export function getUniqueAuthorities(tenders = VERIFIED_GOVERNMENT_TENDERS) {
  const authorities = tenders.map((t) => t.authority).filter(Boolean);
  return [...new Set(authorities)].sort();
}

/**
 * Collect unique states from state/district/local tenders.
 */
export function getUniqueStates(tenders = VERIFIED_GOVERNMENT_TENDERS) {
  const states = [];
  tenders.forEach((t) => {
    (t.jurisdiction?.states || []).forEach((s) => states.push(s));
  });
  return [...new Set(states)].sort();
}

