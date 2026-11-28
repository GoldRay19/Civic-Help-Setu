import { describe, it, expect } from 'vitest';
import {
  maskIdentifier,
  calculateEntitlement,
  auditWeighmentAndCost,
  calculateFoodSecurityAllowance,
  auditBiometricFallbackCompliance,
  generateDgroComplaintDossier,
  generateFoodCommissionAppealDossier
} from './nfsaRationService';

describe('nfsaRationService', () => {
  describe('maskIdentifier', () => {
    it('masks ration card and aadhaar numbers cleanly according to privacy guidelines', () => {
      expect(maskIdentifier('123456789012', 'Aadhaar')).toBe('12******9012');
      expect(maskIdentifier('RC987654321', 'RC')).toBe('RC*****4321');
      expect(maskIdentifier(null, 'RC')).toBe('RC-XXXX');
      expect(maskIdentifier('123', 'RC')).toBe('RC-****');
    });
  });

  describe('calculateEntitlement', () => {
    it('calculates fixed 35 kg entitlement for Antyodaya Anna Yojana (AAY) regardless of member count', () => {
      const aay = calculateEntitlement({ cardType: 'AAY', familyMembers: 2, scheme: 'PMGKAY_FREE' });
      expect(aay.cardType).toBe('AAY');
      expect(aay.totalGrainKg).toBe(35);
      expect(aay.riceKg + aay.wheatKg).toBe(35);
      expect(aay.statutoryCost).toBe(0); // free under PMGKAY
    });

    it('calculates 5 kg per member per month for Priority Households (PHH)', () => {
      const phh = calculateEntitlement({ cardType: 'PHH', familyMembers: 5, scheme: 'NFSA_STATUTORY' });
      expect(phh.cardType).toBe('PHH');
      expect(phh.totalGrainKg).toBe(25); // 5 members * 5 kg
      expect(phh.riceKg).toBe(15); // 60% of 25 = 15 kg
      expect(phh.wheatKg).toBe(10); // 40% of 25 = 10 kg
      // rice: 15 * 3 = 45; wheat: 10 * 2 = 20; total = 65
      expect(phh.statutoryCost).toBe(65);
    });
  });

  describe('auditWeighmentAndCost', () => {
    it('flags weighment deficits and illegal price extortion', () => {
      const entitlement = { totalGrainKg: 35, statutoryCost: 0 };
      const audit = auditWeighmentAndCost({
        entitlement,
        actualDeliveredKg: 28,
        actualChargedRupees: 150
      });

      expect(audit.deficitKg).toBe(7);
      expect(audit.deficitPercentage).toBe(20);
      expect(audit.overchargeRupees).toBe(150);
      expect(audit.hasWeighmentDeficit).toBe(true);
      expect(audit.hasOvercharging).toBe(true);
      expect(audit.isCompliant).toBe(false);
    });

    it('validates compliant distribution when delivered accurately with zero cost', () => {
      const entitlement = { totalGrainKg: 35, statutoryCost: 0 };
      const audit = auditWeighmentAndCost({
        entitlement,
        actualDeliveredKg: 35,
        actualChargedRupees: 0
      });

      expect(audit.deficitKg).toBe(0);
      expect(audit.overchargeRupees).toBe(0);
      expect(audit.isCompliant).toBe(true);
    });
  });

  describe('calculateFoodSecurityAllowance', () => {
    it('computes statutory allowance at Minimum Support Price for non-supplied grain', () => {
      const fsa = calculateFoodSecurityAllowance({
        deficitKg: 10,
        delayedDays: 30
      });

      // 6 kg rice at ~23 + 4 kg wheat at ~22.75
      expect(fsa.safeDeficit).toBe(10);
      expect(fsa.baseAllowance).toBeGreaterThan(200);
      expect(fsa.isDelayedPastStatutoryDeadline).toBe(true);
      expect(fsa.delayPenaltyInterest).toBeGreaterThan(0);
      expect(fsa.totalFoodSecurityAllowance).toBeGreaterThan(fsa.baseAllowance);
    });
  });

  describe('auditBiometricFallbackCompliance', () => {
    it('flags illegal denial when FPS dealer refuses fallback mechanism upon fingerprint failure', () => {
      const audit = auditBiometricFallbackCompliance({
        failureMode: 'FINGERPRINT_ATTRITION',
        fallbackOffered: 'NONE',
        refusalOfRation: true
      });

      expect(audit.isIllegalDenial).toBe(true);
      expect(audit.statutoryInfraction).toContain('DIRECT STATUTORY BREACH');
      expect(audit.fallbackMandated.length).toBe(3);
    });

    it('recognizes compliant transactions when OTP or manual fallback was provided', () => {
      const audit = auditBiometricFallbackCompliance({
        failureMode: 'EPOS_NETWORK_OUTAGE',
        fallbackOffered: 'MANUAL_EXEMPTION_REGISTER',
        refusalOfRation: false,
        offlineRegisterAvailable: true
      });

      expect(audit.isIllegalDenial).toBe(false);
      expect(audit.statutoryInfraction).toContain('COMPLIANT');
    });
  });

  describe('dossier generators', () => {
    it('generates formal Section 15 DGRO petition with statutory details', () => {
      const text = generateDgroComplaintDossier({
        complainantName: 'Rameshwar Lal',
        maskedRationCard: 'RC-12****34',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        monthYear: 'October 2026',
        auditResult: { entitledKg: 35, actualDeliveredKg: 28, deficitKg: 7, deficitPercentage: 20, expectedCost: 0, actualChargedRupees: 100, overchargeRupees: 100 },
        fsaResult: { totalFoodSecurityAllowance: 165 },
        biometricAudit: { isIllegalDenial: true, failureMode: 'Fingerprint Sensor Failure' },
        selectedViolations: ['Refusal of biometric fallback', '7 kg short-weighing']
      });

      expect(text).toContain('SECTION 15 OF THE NATIONAL FOOD SECURITY ACT');
      expect(text).toContain('Rameshwar Lal');
      expect(text).toContain('RC-12****34');
      expect(text).toContain('FOOD SECURITY ALLOWANCE');
      expect(text).toContain('Varanasi');
    });

    it('generates formal Section 16 State Food Commission appeal', () => {
      const text = generateFoodCommissionAppealDossier({
        complainantName: 'Smt. Kamla Devi',
        maskedRationCard: 'RC-99****11',
        dgroOrderNo: 'DGRO/VNS/2026/891',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        fsaAmount: 180
      });

      expect(text).toContain('STATE FOOD COMMISSION');
      expect(text).toContain('SECTION 16');
      expect(text).toContain('Smt. Kamla Devi');
      expect(text).toContain('DGRO/VNS/2026/891');
    });
  });
});
