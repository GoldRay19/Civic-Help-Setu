import { WELFARE_SCHEMES } from '../data/welfareSchemesData';

/**
 * Calculates aggregated citizen welfare benefits, direct cash transfers,
 * and statutory healthcare subsidies based on demographic criteria.
 */
export function calculateCitizenEntitlements(profile = {}) {
  const {
    age = 30,
    annualIncome = 200000,
    occupation = 'general',
    category = 'GENERAL',
    isStudent = false,
    hasPuccaHouse = true,
    isFarmer = false,
    hasDaughterUnder10 = false,
    hasDisability = false
  } = profile;

  const eligibleSchemes = [];
  let totalAnnualCash = 0;
  let totalHealthCoverage = 0;
  let totalSubsidySavings = 0;

  for (const scheme of WELFARE_SCHEMES) {
    const c = scheme.criteria;
    let isEligible = true;

    // Income threshold check
    if (c.maxAnnualIncome && annualIncome > c.maxAnnualIncome) {
      isEligible = false;
    }

    // Age constraints
    if (c.minAge && age < c.minAge) {
      isEligible = false;
    }

    // Occupation criteria
    if (c.occupation) {
      const occLower = occupation.toLowerCase();
      const matchOcc = c.occupation.some(occ => occLower.includes(occ)) || (isFarmer && c.occupation.includes('farmer'));
      if (!matchOcc) isEligible = false;
    }

    // Social category filter
    if (c.priorityCategories) {
      if (!c.priorityCategories.includes(category.toUpperCase())) {
        isEligible = false;
      }
    }

    // Specific situational requirements
    if (c.hasPuccaHouse !== undefined && hasPuccaHouse !== c.hasPuccaHouse) {
      isEligible = false;
    }

    if (c.student && !isStudent) {
      isEligible = false;
    }

    if (c.hasDaughterUnder10 && !hasDaughterUnder10) {
      isEligible = false;
    }

    if (isEligible) {
      eligibleSchemes.push(scheme);
      totalAnnualCash += scheme.annualBenefitCash || 0;
      if (scheme.type === 'HEALTH_COVER') {
        totalHealthCoverage += scheme.annualBenefitInKind || 0;
      } else {
        totalSubsidySavings += scheme.annualBenefitInKind || 0;
      }
    }
  }

  // Category summary groupings
  const byCategory = eligibleSchemes.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + (s.annualBenefitCash + s.annualBenefitInKind);
    return acc;
  }, {});

  return {
    profileSummary: {
      age,
      annualIncome,
      occupation,
      category
    },
    eligibleCount: eligibleSchemes.length,
    eligibleSchemes,
    totalAnnualCash,
    totalHealthCoverage,
    totalSubsidySavings,
    totalGrossAnnualValue: totalAnnualCash + totalHealthCoverage + totalSubsidySavings,
    byCategory
  };
}

/**
 * Formats Indian Currency (INR) with standard commas
 */
export function formatInr(amount = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
