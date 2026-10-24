import { describe, it, expect } from 'vitest';
import { calculateCitizenEntitlements, formatInr } from './welfareEntitlementEngine';

describe('welfareEntitlementEngine - Calculation Rules', () => {
  it('correctly calculates DBT entitlements for small farmers', () => {
    const farmerProfile = {
      age: 45,
      annualIncome: 180000,
      occupation: 'farmer',
      isFarmer: true,
      category: 'OBC',
      hasPuccaHouse: true
    };

    const res = calculateCitizenEntitlements(farmerProfile);
    expect(res.eligibleCount).toBeGreaterThanOrEqual(2);
    expect(res.eligibleSchemes.some(s => s.id === 'pm-kisan')).toBe(true);
    expect(res.eligibleSchemes.some(s => s.id === 'ayushman-bharat')).toBe(true);
    expect(res.totalAnnualCash).toBeGreaterThanOrEqual(6000);
    expect(res.totalHealthCoverage).toBe(500000);
  });

  it('qualifies BPL seniors for Old Age Pension', () => {
    const seniorProfile = {
      age: 65,
      annualIncome: 90000,
      occupation: 'retired',
      category: 'SC',
      hasPuccaHouse: false
    };

    const res = calculateCitizenEntitlements(seniorProfile);
    expect(res.eligibleSchemes.some(s => s.id === 'nsap-old-age')).toBe(true);
    expect(res.eligibleSchemes.some(s => s.id === 'pm-awas-gramin')).toBe(true);
    expect(res.totalGrossAnnualValue).toBeGreaterThan(100000);
  });

  it('reimburses scholarships for eligible low-income students', () => {
    const studentProfile = {
      age: 20,
      annualIncome: 150000,
      occupation: 'student',
      isStudent: true,
      category: 'SC',
      hasPuccaHouse: true
    };

    const res = calculateCitizenEntitlements(studentProfile);
    expect(res.eligibleSchemes.some(s => s.id === 'post-matric-scholarship')).toBe(true);
    expect(res.totalAnnualCash).toBeGreaterThanOrEqual(24000);
  });

  it('formats currency correctly in Indian numbering system', () => {
    expect(formatInr(500000)).toContain('5,00,000');
    expect(formatInr(6000)).toContain('6,000');
  });
});
