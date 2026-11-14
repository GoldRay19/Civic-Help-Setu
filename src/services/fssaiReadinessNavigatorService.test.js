import { describe, it, expect, beforeEach } from 'vitest';
import {
  FSSAI_LICENCE_TIER,
  FBO_KIND_OF_BUSINESS,
  FSSAI_EVIDENCE_CATEGORY,
  STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER,
  isFssaiDataStale,
  resolveFssaiAuthority,
  determineLicenceCategory,
  getFssaiEvidenceMatrix,
  validateFssaiLicenceNumber,
  calculateRenewalTimeline,
  createFssaiDossier,
  getFssaiDossier,
  updateFssaiDossier,
  deleteFssaiDossier,
  sanitizeFssaiDossierForExport,
  submitFssaiCorrectionProposal,
  reviewFssaiCorrectionProposal,
  _resetFssaiInternalStores,
} from './fssaiReadinessNavigatorService';

describe('fssaiReadinessNavigatorService', () => {
  beforeEach(() => {
    _resetFssaiInternalStores();
  });

  describe('Licence Category Determination Engine', () => {
    it('classifies petty food vendor under ₹12 Lakhs as Basic Registration', () => {
      const result = determineLicenceCategory({
        annualTurnoverInLakhs: 8,
        dailyProductionKgOrLtr: 50,
        kindOfBusiness: FBO_KIND_OF_BUSINESS.PETTY_MANUFACTURER_OR_HAWKER,
      });

      expect(result.tier).toBe(FSSAI_LICENCE_TIER.BASIC_REGISTRATION);
      expect(result.formType).toBe('Form A');
      expect(result.feeSchedule.annualFeeInr).toBe(100);
      expect(result.statutoryDisclaimer).toBe(STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER);
    });

    it('classifies business with ₹50 Lakhs turnover as State Licence', () => {
      const result = determineLicenceCategory({
        annualTurnoverInLakhs: 50,
        dailyProductionKgOrLtr: 300,
        kindOfBusiness: FBO_KIND_OF_BUSINESS.RESTAURANT_OR_DHABA,
      });

      expect(result.tier).toBe(FSSAI_LICENCE_TIER.STATE_LICENCE);
      expect(result.formType).toBe('Form B');
      expect(result.feeSchedule.annualFeeInr).toBe(2000);
    });

    it('classifies 3-star hotel as State Licence regardless of initial turnover', () => {
      const result = determineLicenceCategory({
        annualTurnoverInLakhs: 10,
        kindOfBusiness: FBO_KIND_OF_BUSINESS.HOTEL_3_STAR_OR_ABOVE,
      });

      expect(result.tier).toBe(FSSAI_LICENCE_TIER.STATE_LICENCE);
      expect(result.reasons[0]).toContain('3-star or 4-star hospitality');
    });

    it('classifies importer as Central Licence', () => {
      const result = determineLicenceCategory({
        annualTurnoverInLakhs: 5,
        isImporter: true,
      });

      expect(result.tier).toBe(FSSAI_LICENCE_TIER.CENTRAL_LICENCE);
      expect(result.feeSchedule.annualFeeInr).toBe(7500);
      expect(result.reasons).toContain('Direct import of food products/ingredients');
    });

    it('classifies e-commerce food delivery operator as Central Licence', () => {
      const result = determineLicenceCategory({
        annualTurnoverInLakhs: 15,
        isEcommerce: true,
      });

      expect(result.tier).toBe(FSSAI_LICENCE_TIER.CENTRAL_LICENCE);
      expect(result.reasons).toContain('E-commerce food marketplace / online delivery platform');
    });

    it('classifies turnover exceeding ₹20 Crores (2000 Lakhs) as Central Licence', () => {
      const result = determineLicenceCategory({
        annualTurnoverInLakhs: 2500,
      });

      expect(result.tier).toBe(FSSAI_LICENCE_TIER.CENTRAL_LICENCE);
      expect(result.reasons[0]).toContain('exceeds ₹20 Crore limit');
    });
  });

  describe('Authority Resolution & Stale Data', () => {
    it('resolves verified state authority for Maharashtra FDA', () => {
      const auth = resolveFssaiAuthority('MAHARASHTRA');
      expect(auth.isSupported).toBe(true);
      expect(auth.authorityName).toContain('Food and Drug Administration (FDA), Maharashtra');
      expect(auth.disclaimer).toBe(STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER);
    });

    it('resolves verified state authority for Karnataka', () => {
      const auth = resolveFssaiAuthority('KARNATAKA');
      expect(auth.isSupported).toBe(true);
      expect(auth.state).toBe('Karnataka');
    });

    it('returns explicit UNAVAILABLE_OR_UNVERIFIED for unlisted state', () => {
      const auth = resolveFssaiAuthority('UNKNOWN_TERRITORY');
      expect(auth.isSupported).toBe(false);
      expect(auth.status).toBe('UNAVAILABLE_OR_UNVERIFIED');
      expect(auth.disclaimer).toBe(STATUTORY_MUNICIPAL_SEPARATION_DISCLAIMER);
    });

    it('falls back to Central when state is omitted', () => {
      const auth = resolveFssaiAuthority(null);
      expect(auth.isSupported).toBe(false);
      expect(auth.authorityName).toContain('Central Licensing Authority');
    });

    it('evaluates stale data status accurately', () => {
      const freshTime = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      expect(isFssaiDataStale(freshTime, 180)).toBe(false);

      const staleTime = new Date(Date.now() - 210 * 24 * 60 * 60 * 1000).toISOString();
      expect(isFssaiDataStale(staleTime, 180)).toBe(true);
    });
  });

  describe('Evidence Matrices & Licence Validation', () => {
    it('provides basic evidence matrix without technical blueprints for Basic Registration', () => {
      const matrix = getFssaiEvidenceMatrix(FSSAI_LICENCE_TIER.BASIC_REGISTRATION);
      expect(matrix.length).toBe(4);

      const techCat = matrix.find((c) => c.category === FSSAI_EVIDENCE_CATEGORY.TECHNICAL_AND_FOOD_SAFETY);
      expect(techCat).toBeDefined();
      const blueprint = techCat.items.find((i) => i.id === 'PROCESSING_UNIT_BLUEPRINT');
      expect(blueprint.mandatory).toBe(false);
    });

    it('mandates technical blueprints and water test reports for State Licence', () => {
      const matrix = getFssaiEvidenceMatrix(FSSAI_LICENCE_TIER.STATE_LICENCE);
      const techCat = matrix.find((c) => c.category === FSSAI_EVIDENCE_CATEGORY.TECHNICAL_AND_FOOD_SAFETY);
      const blueprint = techCat.items.find((i) => i.id === 'PROCESSING_UNIT_BLUEPRINT');
      expect(blueprint.mandatory).toBe(true);
    });

    it('validates 14-digit FSSAI numbers properly', () => {
      const valid = validateFssaiLicenceNumber('10022021000123');
      expect(valid.isValid).toBe(true);
      expect(valid.likelyCategory).toBe(FSSAI_LICENCE_TIER.BASIC_REGISTRATION);

      const validState = validateFssaiLicenceNumber('21422010000456');
      expect(validState.isValid).toBe(true);
      expect(validState.likelyCategory).toBe(FSSAI_LICENCE_TIER.STATE_LICENCE);

      const invalidLength = validateFssaiLicenceNumber('12345');
      expect(invalidLength.isValid).toBe(false);

      const invalidChars = validateFssaiLicenceNumber('1002202100ABCD');
      expect(invalidChars.isValid).toBe(false);
    });
  });

  describe('Renewal Timelines and Late Penalty Rules', () => {
    it('flags expired licence as non-renewable requiring fresh filing', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = calculateRenewalTimeline(pastDate);
      expect(result.status).toBe('EXPIRED');
      expect(result.canRenew).toBe(false);
    });

    it('calculates late fee penalty of ₹100/day within 30-day window', () => {
      const in10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = calculateRenewalTimeline(in10Days);
      expect(result.status).toBe('PENALTY_WINDOW');
      expect(result.canRenew).toBe(true);
      expect(result.penaltyInr).toBe(2000); // (30 - 10) * 100 = 2000
    });

    it('permits standard renewal without penalty between 31 and 180 days', () => {
      const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const result = calculateRenewalTimeline(in90Days);
      expect(result.status).toBe('STANDARD_RENEWAL_WINDOW');
      expect(result.penaltyInr).toBe(0);
    });

    it('notifies user when too early for renewal (> 180 days)', () => {
      const in250Days = new Date(Date.now() + 250 * 24 * 60 * 60 * 1000).toISOString();
      const result = calculateRenewalTimeline(in250Days);
      expect(result.status).toBe('TOO_EARLY_FOR_RENEWAL');
      expect(result.canRenew).toBe(false);
    });
  });

  describe('Dossier Management, Privacy Redaction & Admin Reviews', () => {
    it('creates and manages user FSSAI preparation dossier', () => {
      const dossier = createFssaiDossier({
        ownerId: 'fbo_user_101',
        businessName: 'Annapurna Sweets & Dairy',
        stateKey: 'MAHARASHTRA',
        annualTurnoverInLakhs: 25,
        dailyProductionKgOrLtr: 150,
      });

      expect(dossier.id).toBeDefined();
      expect(dossier.determinedTier).toBe(FSSAI_LICENCE_TIER.STATE_LICENCE);
      expect(dossier.checklistItems.length).toBeGreaterThan(0);

      const fetched = getFssaiDossier(dossier.id, 'fbo_user_101');
      expect(fetched.id).toBe(dossier.id);

      // Rejects unauthorized access
      expect(() => {
        getFssaiDossier(dossier.id, 'unauthorized_fbo');
      }).toThrow('Access Denied');
    });

    it('updates checklist items and filing status', () => {
      const dossier = createFssaiDossier({
        ownerId: 'fbo_user_202',
        annualTurnoverInLakhs: 5,
      });

      const firstItem = dossier.checklistItems[0];
      const updated = updateFssaiDossier(dossier.id, 'fbo_user_202', {
        itemsToUpdate: [{ itemId: firstItem.itemId, completed: true, documentRef: 'ELEC_BILL_9876' }],
        applicationStatus: 'SUBMITTED_ON_FOSCOS',
        applicationFilingReference: 'FOSCOS/2026/009876',
      });

      expect(updated.applicationStatus).toBe('SUBMITTED_ON_FOSCOS');
      expect(updated.applicationFilingReference).toBe('FOSCOS/2026/009876');
      expect(updated.checklistItems[0].completed).toBe(true);
    });

    it('deletes dossier cleanly with owner authorization', () => {
      const dossier = createFssaiDossier({
        ownerId: 'fbo_user_del',
      });

      const deleted = deleteFssaiDossier(dossier.id, 'fbo_user_del');
      expect(deleted).toBe(true);
      expect(getFssaiDossier(dossier.id, 'fbo_user_del')).toBeNull();
    });

    it('redacts sensitive identifiers for safe export', () => {
      const dossier = createFssaiDossier({
        ownerId: 'confidential_owner',
        businessName: 'Royal Spice Agro Private Limited',
      });

      updateFssaiDossier(dossier.id, 'confidential_owner', {
        itemsToUpdate: [{ itemId: dossier.checklistItems[0].itemId, completed: true, documentRef: 'SENSITIVE_AADHAAR' }],
        applicationFilingReference: 'FOSCOS/APP/9999',
      });

      const sanitized = sanitizeFssaiDossierForExport(dossier);
      expect(sanitized.ownerId).toBe('REDACTED_CITIZEN_ID');
      expect(sanitized.businessName).toBe('REDACTED_BUSINESS_NAME');
      expect(sanitized.applicationFilingReference).toBe('FOSCOS/XXXX/REDACTED');
      expect(sanitized.checklistItems[0].documentRef).toBe('REDACTED_ATTACHMENT_ID');
    });

    it('processes community correction proposals through admin review', () => {
      const proposal = submitFssaiCorrectionProposal({
        stateKey: 'GOA',
        proposedAuthorityName: 'Directorate of Food and Drugs Administration, Goa',
        officialGazetteOrSourceUrl: 'https://dfda.goa.gov.in',
        submissionNotes: 'Updated portal endpoint for Goa FDA.',
      });

      expect(proposal.proposalId).toBeDefined();
      expect(proposal.reviewStatus).toBe('PENDING_ADMIN_REVIEW');

      const reviewed = reviewFssaiCorrectionProposal(
        proposal.proposalId,
        'APPROVED',
        'Verified against Goa State portal.'
      );
      expect(reviewed.reviewStatus).toBe('APPROVED');
      expect(reviewed.reviewerNotes).toContain('Verified against Goa');
    });

    it('rejects invalid review decision', () => {
      const proposal = submitFssaiCorrectionProposal({
        stateKey: 'TEST_KEY',
        officialGazetteOrSourceUrl: 'https://official.gov.in',
      });

      expect(() => {
        reviewFssaiCorrectionProposal(proposal.proposalId, 'UNDER_CONSIDERATION');
      }).toThrow("Decision must be either 'APPROVED' or 'REJECTED'");
    });
  });
});
