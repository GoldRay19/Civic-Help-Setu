import { describe, it, expect, beforeEach } from 'vitest';
import {
  FIRE_NOC_STAGE,
  MILESTONE_STATUS,
  EVIDENCE_CATEGORIES,
  STATUTORY_SCOPE_DISCLAIMER,
  isDataStale,
  resolveFireAuthority,
  evaluateNocApplicability,
  getStageChecklistRequirements,
  createFireSafetyChecklist,
  getFireSafetyChecklist,
  updateFireSafetyChecklist,
  recordFireDeficiencyNotice,
  resolveFireDeficiency,
  deleteFireSafetyChecklist,
  sanitizeFireChecklistForExport,
  submitFireCorrectionProposal,
  validateCommunityFireCorrection,
  reviewFireCorrectionProposal,
  _resetInternalStores
} from './fireSafetyComplianceService';

describe('fireSafetyComplianceService', () => {
  beforeEach(() => {
    _resetInternalStores();
  });

  describe('Authority Resolution & Data Provenance', () => {
    it('resolves verified Delhi Fire Service records with portal and statutory rules', () => {
      const auth = resolveFireAuthority('delhi');
      expect(auth.verified).toBe(true);
      expect(auth.authorityName).toContain('Delhi Fire Service');
      expect(auth.portalUrl).toBe('https://dfs.delhigovt.nic.in');
      expect(auth.statutoryAct).toContain('Delhi Fire Service Act, 2007');
      expect(auth.disclaimer).toBe(STATUTORY_SCOPE_DISCLAIMER);
    });

    it('resolves verified Mumbai Fire Brigade under Maharashtra 2006 Act', () => {
      const auth = resolveFireAuthority('maharashtra_mumbai');
      expect(auth.verified).toBe(true);
      expect(auth.city).toBe('Mumbai');
      expect(auth.statutoryAct).toContain('Maharashtra Fire Prevention');
      expect(auth.guidanceNotes).toContain('Form B');
    });

    it('resolves verified Bengaluru KSFES with 21-day Sakala timeline', () => {
      const auth = resolveFireAuthority('karnataka_bengaluru');
      expect(auth.verified).toBe(true);
      expect(auth.turnaroundDays).toBe(21);
      expect(auth.statutoryAct).toContain('Karnataka Fire Force Act');
    });

    it('returns explicit UNAVAILABLE_OR_UNVERIFIED for unlisted jurisdictions without guessing', () => {
      const auth = resolveFireAuthority('unknown_rural_district');
      expect(auth.verified).toBe(false);
      expect(auth.status).toBe('UNAVAILABLE_OR_UNVERIFIED');
      expect(auth.portalUrl).toBeNull();
      expect(auth.recommendedAction).toBeDefined();
    });

    it('handles empty or null jurisdiction safely', () => {
      const auth = resolveFireAuthority('');
      expect(auth.verified).toBe(false);
      expect(auth.status).toBe('UNAVAILABLE_OR_UNVERIFIED');
    });

    it('evaluates stale data status correctly using the 180-day threshold', () => {
      const recent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(isDataStale(recent, 180)).toBe(false);

      const old = new Date(Date.now() - 210 * 24 * 60 * 60 * 1000).toISOString();
      expect(isDataStale(old, 180)).toBe(true);

      expect(isDataStale(null)).toBe(true);
    });
  });

  describe('NBC 2016 Building Occupancy & Height/Area Thresholds', () => {
    it('marks Institutional (Hospitals / Group C) as unconditionally MANDATORY', () => {
      const result = evaluateNocApplicability('GROUP_C', 5, 200);
      expect(result.status).toBe('MANDATORY');
      expect(result.isMandatory).toBe(true);
      expect(result.isExempt).toBe(false);
    });

    it('marks Hazardous (Group J) as unconditionally MANDATORY', () => {
      const result = evaluateNocApplicability('GROUP_J', 0, 0);
      expect(result.status).toBe('MANDATORY');
      expect(result.isMandatory).toBe(true);
    });

    it('evaluates Residential (Group A): low-rise (<15m) is exempt, high-rise (>=15m) is mandatory', () => {
      const lowRise = evaluateNocApplicability('GROUP_A', 12, 400);
      expect(lowRise.isMandatory).toBe(false);
      expect(lowRise.isExempt).toBe(true);

      const highRise = evaluateNocApplicability('GROUP_A', 18, 400);
      expect(highRise.isMandatory).toBe(true);
      expect(highRise.isExempt).toBe(false);
    });

    it('evaluates Educational (Group B): triggers on height >=9m or area >=500 sq.m', () => {
      const smallSchool = evaluateNocApplicability('GROUP_B', 6, 250);
      expect(smallSchool.isMandatory).toBe(false);

      const tallSchool = evaluateNocApplicability('GROUP_B', 12, 300);
      expect(tallSchool.isMandatory).toBe(true);

      const largeCampus = evaluateNocApplicability('GROUP_B', 8, 800);
      expect(largeCampus.isMandatory).toBe(true);
    });

    it('evaluates Commercial Business (Group E): triggers on area >=500 sq.m or height >=15m', () => {
      const largeOffice = evaluateNocApplicability('GROUP_E', 10, 600);
      expect(largeOffice.isMandatory).toBe(true);

      const smallLowRise = evaluateNocApplicability('GROUP_E', 8, 200);
      expect(smallLowRise.isMandatory).toBe(false);
    });

    it('evaluates Assembly (Group D): triggers on area >=200 sq.m', () => {
      const banquet = evaluateNocApplicability('GROUP_D', 6, 350);
      expect(banquet.isMandatory).toBe(true);
    });
  });

  describe('Stage Requirements & Evidence Separation', () => {
    it('retrieves PROVISIONAL_NOC stage checklist with plan and zoning categories', () => {
      const reqs = getStageChecklistRequirements(FIRE_NOC_STAGE.PROVISIONAL_NOC, 'delhi', 'GROUP_E');
      expect(reqs.stage).toBe(FIRE_NOC_STAGE.PROVISIONAL_NOC);
      expect(reqs.requiredCategories.length).toBeGreaterThan(0);

      const cats = reqs.requiredCategories.map((c) => c.category);
      expect(cats).toContain(EVIDENCE_CATEGORIES.BUILDING_PLANS);
      expect(cats).toContain(EVIDENCE_CATEGORIES.LEGAL_OCCUPANCY);

      const sitePlan = reqs.requiredCategories[0].items.find((i) => i.id === 'PLAN_SITE_LAYOUT');
      expect(sitePlan.officialRule).toContain('NBC 2016');
      expect(sitePlan.mandatory).toBe(true);
    });

    it('retrieves FINAL_FIRE_CERTIFICATE stage checklist with active and passive systems', () => {
      const reqs = getStageChecklistRequirements(FIRE_NOC_STAGE.FINAL_FIRE_CERTIFICATE, 'maharashtra_mumbai', 'GROUP_C');
      expect(reqs.stage).toBe(FIRE_NOC_STAGE.FINAL_FIRE_CERTIFICATE);

      const cats = reqs.requiredCategories.map((c) => c.category);
      expect(cats).toContain(EVIDENCE_CATEGORIES.ACTIVE_FIRE_SYSTEMS);
      expect(cats).toContain(EVIDENCE_CATEGORIES.PASSIVE_FIRE_SYSTEMS);

      const pumps = reqs.requiredCategories[0].items.find((i) => i.id === 'SYS_FIRE_PUMPS');
      expect(pumps).toBeDefined();
      expect(pumps.mandatory).toBe(true);
    });

    it('retrieves RENEWAL_FIRE_CERTIFICATE stage checklist with audit and logbook proofs', () => {
      const reqs = getStageChecklistRequirements(FIRE_NOC_STAGE.RENEWAL_FIRE_CERTIFICATE, 'karnataka_bengaluru', 'GROUP_A');
      expect(reqs.stage).toBe(FIRE_NOC_STAGE.RENEWAL_FIRE_CERTIFICATE);

      const allItems = reqs.requiredCategories.flatMap((c) => c.items);
      const formB = allItems.find((i) => i.id === 'CERT_PERIODIC_FORM_B');
      expect(formB).toBeDefined();
      expect(formB.mandatory).toBe(true);
    });

    it('throws when querying an invalid stage', () => {
      expect(() => getStageChecklistRequirements('INVALID_STAGE', 'delhi')).toThrow('Unknown Fire NOC stage');
    });
  });

  describe('Dossier Lifecycle (CRUD) & Authorization Safeguards', () => {
    it('creates a private Fire NOC checklist dossier with initialized checklist items', () => {
      const dossier = createFireSafetyChecklist({
        ownerId: 'citizen_123',
        jurisdictionId: 'delhi',
        buildingGroupCode: 'GROUP_E',
        stage: FIRE_NOC_STAGE.PROVISIONAL_NOC,
        buildingName: 'Tower A Business Park',
        heightMeters: 24,
        coveredAreaSqM: 1200
      });

      expect(dossier.id).toMatch(/^fire_/);
      expect(dossier.ownerId).toBe('citizen_123');
      expect(dossier.currentMilestone).toBe(MILESTONE_STATUS.APPLICATION_INTAKE);
      expect(dossier.checklistItems.length).toBeGreaterThan(0);
      expect(dossier.statutoryDisclaimer).toBe(STATUTORY_SCOPE_DISCLAIMER);
    });

    it('throws error if ownerId is missing during creation', () => {
      expect(() => createFireSafetyChecklist({ ownerId: '' })).toThrow('Valid ownerId is required');
    });

    it('retrieves existing dossier and enforces ownership authorization', () => {
      const dossier = createFireSafetyChecklist({ ownerId: 'citizen_123', jurisdictionId: 'delhi' });
      const fetched = getFireSafetyChecklist(dossier.id, 'citizen_123');
      expect(fetched.id).toBe(dossier.id);

      expect(() => getFireSafetyChecklist(dossier.id, 'unauthorized_attacker')).toThrow('Access Denied');
    });

    it('updates item completion state and milestone history', () => {
      const dossier = createFireSafetyChecklist({ ownerId: 'citizen_123', jurisdictionId: 'delhi' });
      const firstItemId = dossier.checklistItems[0].itemId;

      const updated = updateFireSafetyChecklist(dossier.id, 'citizen_123', {
        itemsToUpdate: [{ itemId: firstItemId, completed: true, documentRef: 'DOC-2026-PLAN-1' }],
        currentMilestone: MILESTONE_STATUS.PLAN_TECHNICAL_SCRUTINY,
        submissionToken: 'DFS/2026/0998'
      });

      const updatedItem = updated.checklistItems.find((i) => i.itemId === firstItemId);
      expect(updatedItem.completed).toBe(true);
      expect(updatedItem.verifiedDate).toBeDefined();
      expect(updatedItem.documentRef).toBe('DOC-2026-PLAN-1');
      expect(updated.currentMilestone).toBe(MILESTONE_STATUS.PLAN_TECHNICAL_SCRUTINY);
      expect(updated.submissionToken).toBe('DFS/2026/0998');
    });

    it('deletes an existing dossier cleanly', () => {
      const dossier = createFireSafetyChecklist({ ownerId: 'citizen_123', jurisdictionId: 'delhi' });
      const success = deleteFireSafetyChecklist(dossier.id, 'citizen_123');
      expect(success).toBe(true);

      const check = getFireSafetyChecklist(dossier.id, 'citizen_123');
      expect(check).toBeNull();
    });
  });

  describe('Deficiency Notice / Inspection Tracking', () => {
    it('records a shortfall memo and updates milestone', () => {
      const dossier = createFireSafetyChecklist({ ownerId: 'citizen_123', jurisdictionId: 'delhi' });

      const updated = recordFireDeficiencyNotice(dossier.id, 'citizen_123', {
        memoNumber: 'DFS/INSP/MEMO/04',
        description: 'Standby diesel pump automatic cut-in switch failure during flow test',
        responseDeadlineDays: 15
      });

      expect(updated.currentMilestone).toBe(MILESTONE_STATUS.DEFICIENCY_NOTICE_ISSUED);
      expect(updated.deficiencyNotices.length).toBe(1);
      expect(updated.deficiencyNotices[0].status).toBe('PENDING_RECTIFICATION');
      expect(updated.deficiencyNotices[0].responseDeadlineDate).toBeDefined();
    });

    it('resolves deficiency notice and updates milestone when all shortfalls are cleared', () => {
      const dossier = createFireSafetyChecklist({ ownerId: 'citizen_123', jurisdictionId: 'delhi' });
      recordFireDeficiencyNotice(dossier.id, 'citizen_123', {
        description: 'Pressure gauge replaced'
      });

      const defId = dossier.deficiencyNotices[0].deficiencyId;
      const resolved = resolveFireDeficiency(dossier.id, 'citizen_123', defId, 'New calibrated gauge fitted and tested.');

      expect(resolved.deficiencyNotices[0].status).toBe('RESOLVED');
      expect(resolved.currentMilestone).toBe(MILESTONE_STATUS.DEFICIENCY_RESOLVED);
    });
  });

  describe('PII Sanitization & Export Security', () => {
    it('redacts all sensitive citizen identifiers and credentials', () => {
      const dossier = createFireSafetyChecklist({
        ownerId: 'citizen_aadhaar_882199',
        jurisdictionId: 'delhi',
        buildingName: 'Private Villa 42, Plot 109',
        architectCoaNumber: 'CA/2012/55442',
        fireConsultantLicence: 'FSC/DL/990'
      });

      dossier.submissionToken = 'TOKEN_DELHI_PRIVATE_998';
      dossier.checklistItems[0].documentRef = 'PRIVATE_SCAN_01.PDF';

      const sanitized = sanitizeFireChecklistForExport(dossier);
      expect(sanitized.ownerId).toBe('REDACTED_CITIZEN_ID');
      expect(sanitized.buildingName).toBe('REDACTED_PREMISES');
      expect(sanitized.submissionToken).toBe('TOKEN_XXXX_REDACTED');
      expect(sanitized.architectCoaNumber).toBe('COA/XXXX/REDACTED');
      expect(sanitized.fireConsultantLicence).toBe('FSC/XXXX/REDACTED');
      expect(sanitized.checklistItems[0].documentRef).toBe('REDACTED_FILE_REF');
    });
  });

  describe('Community Corrections & Admin Moderation', () => {
    it('submits a valid community correction proposal', () => {
      const proposal = submitFireCorrectionProposal({
        jurisdictionKey: 'DELHI_NCT',
        proposedAuthorityName: 'Delhi Fire Service Headquarters',
        officialGazetteOrSourceUrl: 'https://dfs.delhigovt.nic.in/notification-2026',
        submissionNotes: 'Updated portal URL for online inspection bookings.'
      });

      expect(proposal.proposalId).toMatch(/^fire_corr_/);
      expect(proposal.reviewStatus).toBe('PENDING_ADMIN_REVIEW');
    });

    it('validates community correction payload requirements', () => {
      const invalid = validateCommunityFireCorrection({ jurisdictionKey: '', officialGazetteOrSourceUrl: 'not_a_url' });
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);

      const valid = validateCommunityFireCorrection({
        jurisdictionKey: 'MAHARASHTRA_MUMBAI',
        officialGazetteOrSourceUrl: 'https://mahafireservice.gov.in'
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors.length).toBe(0);
    });

    it('allows admin review to approve or reject community proposals', () => {
      const proposal = submitFireCorrectionProposal({
        jurisdictionKey: 'DELHI_NCT',
        officialGazetteOrSourceUrl: 'https://dfs.delhigovt.nic.in'
      });

      const approved = reviewFireCorrectionProposal(proposal.proposalId, 'APPROVED', 'Verified against gazette order.');
      expect(approved.reviewStatus).toBe('APPROVED');
      expect(approved.reviewerNotes).toBe('Verified against gazette order.');
      expect(approved.reviewedAt).toBeDefined();
    });
  });
});

