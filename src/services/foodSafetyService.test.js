import { describe, it, expect } from 'vitest';
import {
  auditSchedule4Hygiene,
  calculateAdulterationLiability,
  generateFssaiComplaintPetition,
  generateFboLegalNotice,
  sanitizeFoodSafetyCase,
  numberToWordsIndian,
  FOOD_SAFETY_LEGAL_DISCLAIMER,
  SCHEDULE_4_CRITERIA,
} from './foodSafetyService.js';

describe('foodSafetyService (#1339)', () => {
  it('correctly calculates Schedule 4 compliance score and flags critical risk when critical criteria fail', () => {
    // All compliant
    const allPassChecks = {};
    SCHEDULE_4_CRITERIA.forEach((c) => {
      allPassChecks[c.id] = true;
    });

    const passResult = auditSchedule4Hygiene(allPassChecks);
    expect(passResult.score).toBe(100);
    expect(passResult.ratingBadge).toBe('A+');
    expect(passResult.isCompliant).toBe(true);
    expect(passResult.criticalFailures).toBe(0);

    // Critical failure (e.g. potable water false)
    const failChecks = { ...allPassChecks, potable_water: false };
    const failResult = auditSchedule4Hygiene(failChecks);
    expect(failResult.criticalFailures).toBe(1);
    expect(failResult.ratingBadge).toBe('CRITICAL_RISK');
    expect(failResult.isCompliant).toBe(false);
  });

  it('calculates Section 51-59 statutory penalty liability and Section 65 injury compensation', () => {
    const calc = calculateAdulterationLiability({
      selectedViolations: ['substandard', 'extraneous_matter', 'unsafe_food'],
      injuryTier: 'TEMPORARY_INJURY',
      actualMedicalBills: 12000,
      daysHospitalized: 3,
      lostWages: 6000,
    });

    // Substandard (500k) + Extraneous (100k) + Unsafe (1000k) = 1600000
    expect(calc.totalMaxPenaltyLiability).toBe(1600000);
    expect(calc.hasCriminalCharge).toBe(true);
    expect(calc.primaryForum).toContain('Judicial Magistrate');

    // Section 65: base 100000 + medical 12000 + lost wages 6000 = 118000
    expect(calc.recommendedTotalCompensation).toBe(118000);
    expect(calc.interimReliefMandatory).toBe(true);
    expect(calc.interimReliefAmount).toBe(29500); // 25% of 118000
  });

  it('correctly calculates Section 65 compensation for fatality and grievous injury tiers', () => {
    const deathCalc = calculateAdulterationLiability({
      selectedViolations: ['unsafe_food'],
      injuryTier: 'FATALITY',
      actualMedicalBills: 50000,
      lostWages: 25000,
    });
    // Death base is minimum 500000 + 50000 + 25000 = 575000
    expect(deathCalc.recommendedTotalCompensation).toBe(575000);

    const grievousCalc = calculateAdulterationLiability({
      selectedViolations: ['unsafe_food'],
      injuryTier: 'GRIEVOUS_INJURY',
      actualMedicalBills: 80000,
      lostWages: 30000,
    });
    // Grievous base is 300000 + 80000 + 30000 = 410000
    expect(grievousCalc.recommendedTotalCompensation).toBe(410000);
  });

  it('drafts formal FSSAI complaint to Adjudicating Officer (ADM) with statutory citations', () => {
    const petition = generateFssaiComplaintPetition({
      complainantName: 'Sunil Verma',
      complainantAddress: 'Civil Lines, Nagpur',
      complainantContact: 'sunil@example.com / 9988776655',
      fboName: 'Tasty Bites Confectionery',
      fboAddress: 'Wardha Road, Nagpur',
      fboLicenseNumber: '11520000001234',
      productName: 'Packaged Cream Cake',
      batchNumber: 'B-8812',
      purchaseDate: '2026-02-10',
      purchaseInvoice: 'BILL-404',
      violationDetails: 'Synthetic industrial dye detected in cake icing causing toxic gastroenteritis.',
      injuryDetails: 'Emergency treatment at Nagpur Medical College for 2 days.',
      calculations: {
        totalMaxPenaltyLiability: 1500000,
        recommendedTotalCompensation: 115000,
        medicalExpenses: 15000,
        interimReliefAmount: 28750,
      },
    });

    expect(petition).toContain('BEFORE THE ADJUDICATING OFFICER (ADDITIONAL DISTRICT MAGISTRATE)');
    expect(petition).toContain('Sunil Verma');
    expect(petition).toContain('Tasty Bites Confectionery');
    expect(petition).toContain('Section 65');
    expect(petition).toContain('₹1,15,000');
    expect(petition).toContain(FOOD_SAFETY_LEGAL_DISCLAIMER);
  });

  it('generates 15-day pre-litigation legal notice to Food Business Operator', () => {
    const notice = generateFboLegalNotice({
      complainantName: 'Sunil Verma',
      complainantAddress: 'Civil Lines, Nagpur',
      complainantContact: 'sunil@example.com',
      fboName: 'Tasty Bites Confectionery',
      fboAddress: 'Wardha Road, Nagpur',
      productName: 'Packaged Cream Cake',
      purchaseDate: '2026-02-10',
      purchaseInvoice: 'BILL-404',
      violationDetails: 'Synthetic industrial dye detected in cake icing.',
      calculations: {
        recommendedTotalCompensation: 115000,
      },
    });

    expect(notice).toContain('REGISTERED POST WITH A.D. / SPEED POST / LEGAL NOTICE');
    expect(notice).toContain('fifteen (15) days');
    expect(notice).toContain('₹1,15,000');
    expect(notice).toContain('Tasty Bites Confectionery');
  });

  it('sanitizes contact info and address under DPDP Act 2023 principles', () => {
    const rawCase = {
      complainantContact: '9876543210 and contact@citizen.com',
      complainantAddress: 'Flat 101, Residency Road, Bengaluru 560001',
    };
    const sanitized = sanitizeFoodSafetyCase(rawCase);
    expect(sanitized.complainantContact).toContain('98XXXXXX10');
    expect(sanitized.complainantContact).toContain('c***@citizen.com');
    expect(sanitized.complainantAddress).toContain('XXXXXX');
  });

  it('converts numbers to Indian currency words representation accurately', () => {
    expect(numberToWordsIndian(0)).toBe('Zero');
    expect(numberToWordsIndian(5000)).toBe('Five Thousand');
    expect(numberToWordsIndian(115000)).toBe('One Lakh Fifteen Thousand');
    expect(numberToWordsIndian(1500000)).toBe('Fifteen Lakh');
  });
});
