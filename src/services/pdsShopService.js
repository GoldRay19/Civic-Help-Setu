/**
 * pdsShopService.js (#723)
 * Provides locality-aware search, cascading jurisdiction filters,
 * audit freshness calculation, and statutory entitlement resolution
 * for the Public Distribution System (PDS) Fair Price Shop Board.
 *
 * Invariants:
 *  1. Zero live stock claims without authorized feed.
 *  2. Explicit unavailable data state rather than guessing.
 *  3. Separation of official instructions from community observations.
 */

import { VERIFIED_PDS_SHOPS } from '../data/pdsShops';
import { getVerificationFreshness, formatVerificationDate } from './sourceVerificationService';

const clean = (val) => (typeof val === 'string' ? val.trim().toLowerCase() : '');

/**
 * Filter PDS shops by cascading jurisdiction (state, district, block), ONORC support, and search query.
 */
export function filterPdsShops(shops = VERIFIED_PDS_SHOPS, filters = {}) {
  const {
    state = '',
    district = '',
    block = '',
    onlyOnorc = false,
    searchQuery = '',
  } = filters;

  const targetState = clean(state);
  const targetDistrict = clean(district);
  const targetBlock = clean(block);
  const targetQuery = clean(searchQuery);

  return shops.filter((shop) => {
    // Cascading jurisdiction matches
    if (targetState && clean(shop.state) !== targetState) {
      return false;
    }
    if (targetDistrict && clean(shop.district) !== targetDistrict) {
      return false;
    }
    if (targetBlock && clean(shop.block) !== targetBlock) {
      return false;
    }

    // ONORC Portability filter
    if (onlyOnorc && shop.onorcPortability?.enabled !== true) {
      return false;
    }

    // Keyword search across shop name, fpsId, locality, dealerName, pincode
    if (targetQuery) {
      const matchName = clean(shop.name).includes(targetQuery);
      const matchFpsId = clean(shop.fpsId).includes(targetQuery);
      const matchLocality = clean(shop.locality).includes(targetQuery);
      const matchDealer = clean(shop.dealerName).includes(targetQuery);
      const matchAddress = clean(shop.address).includes(targetQuery);
      const matchPincode = clean(shop.pincode).includes(targetQuery);

      if (!matchName && !matchFpsId && !matchLocality && !matchDealer && !matchAddress && !matchPincode) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Returns distinct states present in the dataset.
 */
export function getDistinctStates(shops = VERIFIED_PDS_SHOPS) {
  const states = shops.map((s) => s.state).filter(Boolean);
  return [...new Set(states)].sort();
}

/**
 * Returns distinct districts for a given state.
 */
export function getDistinctDistricts(shops = VERIFIED_PDS_SHOPS, selectedState = '') {
  if (!selectedState) return [];
  const targetState = clean(selectedState);
  const districts = shops
    .filter((s) => clean(s.state) === targetState)
    .map((s) => s.district)
    .filter(Boolean);
  return [...new Set(districts)].sort();
}

/**
 * Returns distinct blocks/sub-divisions for a given state & district.
 */
export function getDistinctBlocks(shops = VERIFIED_PDS_SHOPS, selectedState = '', selectedDistrict = '') {
  if (!selectedState || !selectedDistrict) return [];
  const targetState = clean(selectedState);
  const targetDistrict = clean(selectedDistrict);
  const blocks = shops
    .filter((s) => clean(s.state) === targetState && clean(s.district) === targetDistrict)
    .map((s) => s.block)
    .filter(Boolean);
  return [...new Set(blocks)].sort();
}

/**
 * Retrieve a specific shop by slug ID.
 */
export function getPdsShopById(id, customList = []) {
  if (!id) return null;
  const inCustom = customList.find((s) => s.id === id);
  if (inCustom) return inCustom;
  return VERIFIED_PDS_SHOPS.find((s) => s.id === id) || null;
}

/**
 * Formatted audit status & badge properties using sourceVerificationService.
 */
export function getPdsAuditStatus(shop) {
  const lastVerified = shop?.auditMetadata?.lastVerified;
  const freshness = getVerificationFreshness(lastVerified);
  const formattedDate = formatVerificationDate(lastVerified) || 'Audit pending';

  return {
    ...freshness,
    formattedDate,
    sourceUrl: shop?.auditMetadata?.sourceUrl || null,
    verifiedBy: shop?.auditMetadata?.verifiedBy || 'Official Food Inspector',
    isOverdue: freshness.status === 'overdue',
  };
}

/**
 * Statutory National Food Security Act (NFSA) Entitlement & ONORC guidelines.
 * Keeps official statutory requirements separate from editorial explanations.
 */
export const STATUTORY_NFSA_RULES = {
  aay: {
    title: 'Antyodaya Anna Yojana (AAY)',
    category: 'Poorest of poor households',
    quota: '35 kg foodgrains per family per month',
    statutoryPricing: 'Subsidized / Zero price under NFSA / PMGKAY',
    authority: 'Ministry of Consumer Affairs, Food & Public Distribution / State Food Dept',
  },
  phh: {
    title: 'Priority Households (PHH)',
    category: 'Identified eligible households based on inclusion criteria',
    quota: '5 kg foodgrains per person / unit per month',
    statutoryPricing: 'Subsidized / Zero price under NFSA / PMGKAY',
    authority: 'Ministry of Consumer Affairs, Food & Public Distribution / State Food Dept',
  },
  onorc: {
    title: 'One Nation One Ration Card (ONORC)',
    portabilityType: 'Nationwide biometrically authenticated grain lifting',
    description: 'Any beneficiary with an Aadhaar-seeded ration card can collect their foodgrain quota from any Fair Price Shop equipped with an e-POS device across India.',
    biometricVerification: 'Fingerprint or Iris scan on e-POS device',
    grievanceNumber: '1967 (National) / 14445 (Toll-Free Portability Helpline)',
  },
};

/**
 * Builds standard checklist tasks for a Fair Price Shop visit.
 */
export function buildPdsChecklistItems(shop) {
  const baseItems = [
    'Carry original physical Ration Card or Mera Ration digital QR card',
    'Cardholder/Family Member Aadhaar readiness for biometric e-POS authentication',
    'Verify electronic weighing scale reads exactly 0.000 kg before weighing',
    'Demand and collect printed e-POS transaction receipt with quota breakdown',
    'Verify transaction SMS or entry on state food portal',
  ];

  if (shop?.onorcPortability?.enabled) {
    baseItems.push('Confirm inter-state / intra-state ONORC portability enabled on dealer e-POS device');
  }

  const helpline = shop?.officialContact?.nationalHelpline || '1967';
  baseItems.push(`Note official grievance helpline (${helpline}) in case of service refusal`);

  return baseItems;
}
