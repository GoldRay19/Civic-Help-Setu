import { describe, it, expect, beforeEach } from 'vitest';
import {
  APPROVAL_STAGE,
  MILESTONE_STATUS,
  EVIDENCE_CATEGORY,
  STATUTORY_SCOPE_DISCLAIMER,
  isDataStale,
  resolveCompetentAuthority,
  getStageChecklistRequirements,
  createBuildingApprovalChecklist,
  getBuildingApprovalChecklist,
  updateBuildingApprovalChecklist,
  recordDeficiencyNotice,
  resolveDeficiency,
  transitionApprovalStage,
  deleteBuildingApprovalChecklist,
  sanitizeBuildingPlanDataForExport,
  submitCorrectionProposal,
  reviewCorrectionProposal,
  _resetInternalStores,
} from './buildingPlanApprovalWorkspaceService';

describe('buildingPlanApprovalWorkspaceService', () => {
  beforeEach(() => {
    _resetInternalStores();
  });

  describe('Authority Resolution & Legal Scope Boundaries', () => {
    it('resolves verified municipal and development authorities for Bengaluru', () => {
      const auth = resolveCompetentAuthority('KARNATAKA_BENGALURU');
      expect(auth.isSupported).toBe(true);
      expect(auth.municipalAuthority).toContain('Bruhat Bengaluru Mahanagara Palike');
      expect(auth.developmentAuthority).toContain('Bangalore Development Authority');
      expect(auth.scrutinyPortal).toBe('https://bpas.bbmp.gov.in');
      expect(auth.disclaimer).toBe(STATUTORY_SCOPE_DISCLAIMER);
    });

    it('resolves verified authorities for Mumbai (BMC and MMRDA)', () => {
      const auth = resolveCompetentAuthority('MAHARASHTRA_MUMBAI');
      expect(auth.isSupported).toBe(true);
      expect(auth.city).toBe('Mumbai');
      expect(auth.municipalAuthority).toContain('Brihanmumbai Municipal Corporation');
      expect(auth.statutoryRulebook).toContain('DCPR 2034');
    });

    it('returns explicit UNAVAILABLE_OR_UNVERIFIED for unlisted jurisdictions without guessing', () => {
      const auth = resolveCompetentAuthority('UNKNOWN_REMOTE_DISTRICT');
      expect(auth.isSupported).toBe(false);
      expect(auth.status).toBe('UNAVAILABLE_OR_UNVERIFIED');
      expect(auth.recommendedAction).toBeDefined();
      expect(auth.disclaimer).toBe(STATUTORY_SCOPE_DISCLAIMER);
    });

    it('handles null or empty jurisdiction gracefully', () => {
      const auth = resolveCompetentAuthority(null);
      expect(auth.isSupported).toBe(false);
      expect(auth.status).toBe('UNAVAILABLE_OR_UNVERIFIED');
    });

    it('evaluates stale data status accurately based on timestamp threshold', () => {
      const recentTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      expect(isDataStale(recentTimestamp, 180)).toBe(false);

      const oldTimestamp = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
      expect(isDataStale(oldTimestamp, 180)).toBe(true);

      expect(isDataStale(null)).toBe(true);
    });
  });

  describe('Stage Requirements & Evidence Separation', () => {
    it('retrieves stage checklist for PLAN_SANCTION with all 4 required evidence categories', () => {
      const reqs = getStageChecklistRequirements(APPROVAL_STAGE.PLAN_SANCTION, 'KARNATAKA_BENGALURU');
      expect(reqs.stage).toBe(APPROVAL_STAGE.PLAN_SANCTION);
      expect(reqs.requiredCategories.length).toBe(4);

      const categoryKeys = reqs.requiredCategories.map((c) => c.category);
      expect(categoryKeys).toContain(EVIDENCE_CATEGORY.OWNERSHIP_EVIDENCE);
      expect(categoryKeys).toContain(EVIDENCE_CATEGORY.SITE_AND_DRAWINGS);
      expect(categoryKeys).toContain(EVIDENCE_CATEGORY.PROFESSIONAL_EVIDENCE);
      expect(categoryKeys).toContain(EVIDENCE_CATEGORY.STATUTORY_NOCS);
    });

    it('retrieves stage checklist for OCCUPANCY_CERTIFICATE focusing on final operational clearances', () => {
      const reqs = getStageChecklistRequirements(APPROVAL_STAGE.OCCUPANCY_CERTIFICATE, 'DELHI_NCT');
      expect(reqs.stage).toBe(APPROVAL_STAGE.OCCUPANCY_CERTIFICATE);
      const nocCat = reqs.requiredCategories.find((c) => c.category === EVIDENCE_CATEGORY.STATUTORY_NOCS);
      expect(nocCat).toBeDefined();
      const fireNoc = nocCat.items.find((i) => i.id === 'FIRE_FINAL_NOC');
      expect(fireNoc.mandatory).toBe(true);
    });

    it('throws error when querying an unsupported stage', () => {
      expect(() => getStageChecklistRequirements('INVALID_STAGE', 'DELHI_NCT')).toThrow('Unknown approval stage');
    });
  });

  describe('Dossier Lifecycle, Ownership Privacy & Deficiency Workflows', () => {
    it('creates a user building approval checklist dossier with initialized checklist items', () => {
      const dossier = createBuildingApprovalChecklist({
        ownerId: 'user_cit_101',
        jurisdictionKey: 'KARNATAKA_BENGALURU',
        stage: APPROVAL_STAGE.PLAN_SANCTION,
        plotReference: 'Survey No. 42/1, Whitefield',
        proposedUse: 'RESIDENTIAL',
        totalPlotAreaSqM: 240,
        proposedBuiltUpAreaSqM: 380,
        supervisingArchitectCoa: 'CA/2018/98765',
        structuralEngineerLicence: 'RSE/BBMP/2021/45',
      });

      expect(dossier.id).toBeDefined();
      expect(dossier.ownerId).toBe('user_cit_101');
      expect(dossier.currentStage).toBe(APPROVAL_STAGE.PLAN_SANCTION);
      expect(dossier.currentMilestone).toBe(MILESTONE_STATUS.DOCUMENT_INTAKE_AND_FEE_SCRUTINY);
      expect(dossier.checklistItems.length).toBeGreaterThan(0);
      expect(dossier.statutoryDisclaimer).toBe(STATUTORY_SCOPE_DISCLAIMER);
    });

    it('enforces owner-based authorization and rejects unauthorized access', () => {
      const dossier = createBuildingApprovalChecklist({
        ownerId: 'user_valid_owner',
        jurisdictionKey: 'MAHARASHTRA_MUMBAI',
      });

      const fetched = getBuildingApprovalChecklist(dossier.id, 'user_valid_owner');
      expect(fetched).toBeDefined();
      expect(fetched.id).toBe(dossier.id);

      expect(() => {
        getBuildingApprovalChecklist(dossier.id, 'unauthorized_attacker');
      }).toThrow('Access Denied');
    });

    it('updates item completion status and milestone progression', () => {
      const dossier = createBuildingApprovalChecklist({
        ownerId: 'user_dev_99',
        jurisdictionKey: 'DELHI_NCT',
      });

      const firstItem = dossier.checklistItems[0];
      const updated = updateBuildingApprovalChecklist(dossier.id, 'user_dev_99', {
        itemsToUpdate: [{ itemId: firstItem.itemId, completed: true, documentRef: 'DOC_REG_1234' }],
        currentMilestone: MILESTONE_STATUS.TECHNICAL_BYELAW_SCRUTINY,
        milestoneNote: 'Drawings submitted for scrutiny',
      });

      expect(updated.currentMilestone).toBe(MILESTONE_STATUS.TECHNICAL_BYELAW_SCRUTINY);
      const updatedItem = updated.checklistItems.find((i) => i.itemId === firstItem.itemId);
      expect(updatedItem.completed).toBe(true);
      expect(updatedItem.documentRef).toBe('DOC_REG_1234');
      expect(updated.milestoneHistory.length).toBe(2);
    });

    it('manages deficiency notices with statutory response deadline and resolution', () => {
      const dossier = createBuildingApprovalChecklist({
        ownerId: 'user_builder_1',
        jurisdictionKey: 'MAHARASHTRA_PUNE',
      });

      const withDeficiency = recordDeficiencyNotice(dossier.id, 'user_builder_1', {
        observationNumber: 'OBS-PUNE-2026-09',
        description: 'Rear setback margin short by 0.45 meters according to UDCPR Table 6.',
        responseDeadlineDays: 15,
      });

      expect(withDeficiency.currentMilestone).toBe(MILESTONE_STATUS.DEFICIENCY_NOTICE_ISSUED);
      expect(withDeficiency.deficiencyNotices.length).toBe(1);

      const def = withDeficiency.deficiencyNotices[0];
      expect(def.status).toBe('PENDING_RECTIFICATION');
      expect(def.responseDeadlineDate).toBeDefined();

      // Resolve deficiency
      const resolved = resolveDeficiency(
        dossier.id,
        'user_builder_1',
        def.deficiencyId,
        'Revised site plan submitted with 3.0m rear setback'
      );

      expect(resolved.currentMilestone).toBe(MILESTONE_STATUS.DEFICIENCY_RESOLVED);
      expect(resolved.deficiencyNotices[0].status).toBe('RESOLVED');
      expect(resolved.deficiencyNotices[0].rectificationDetails).toContain('3.0m rear setback');
    });

    it('transitions across lifecycle stages (e.g. from SANCTION to OCCUPANCY)', () => {
      const dossier = createBuildingApprovalChecklist({
        ownerId: 'user_cit_stage',
        jurisdictionKey: 'TELANGANA_HYDERABAD',
        stage: APPROVAL_STAGE.PLAN_SANCTION,
      });

      const transitioned = transitionApprovalStage(
        dossier.id,
        'user_cit_stage',
        APPROVAL_STAGE.OCCUPANCY_CERTIFICATE
      );

      expect(transitioned.currentStage).toBe(APPROVAL_STAGE.OCCUPANCY_CERTIFICATE);
      const hasOcItem = transitioned.checklistItems.some((i) => i.itemId === 'FIRE_FINAL_NOC');
      expect(hasOcItem).toBe(true);
    });

    it('deletes building approval dossier cleanly with owner authorization', () => {
      const dossier = createBuildingApprovalChecklist({
        ownerId: 'user_to_delete',
        jurisdictionKey: 'TAMIL_NADU_CHENNAI',
      });

      const deleted = deleteBuildingApprovalChecklist(dossier.id, 'user_to_delete');
      expect(deleted).toBe(true);
      expect(getBuildingApprovalChecklist(dossier.id, 'user_to_delete')).toBeNull();
    });
  });

  describe('Privacy Redaction for Safe Exports & Community Review', () => {
    it('redacts sensitive personal identifiers and site credentials for exports', () => {
      const dossier = createBuildingApprovalChecklist({
        ownerId: 'private_user_443',
        jurisdictionKey: 'KARNATAKA_BENGALURU',
        plotReference: 'Plot 789, Sy 33, Kadugodi Village',
        supervisingArchitectCoa: 'CA/2012/55555',
        structuralEngineerLicence: 'STR/999/BBMP',
      });

      updateBuildingApprovalChecklist(dossier.id, 'private_user_443', {
        itemsToUpdate: [{ itemId: dossier.checklistItems[0].itemId, completed: true, documentRef: 'CONFIDENTIAL_DEED_99' }],
      });

      const sanitized = sanitizeBuildingPlanDataForExport(dossier);
      expect(sanitized.ownerId).toBe('REDACTED_CITIZEN_ID');
      expect(sanitized.plotReference).toBe('REDACTED_SITE_REF');
      expect(sanitized.supervisingArchitectCoa).toBe('COA/XXXX/REDACTED');
      expect(sanitized.structuralEngineerLicence).toBe('SE/XXXX/REDACTED');
      expect(sanitized.checklistItems[0].documentRef).toBe('REDACTED_ATTACHMENT_ID');
    });

    it('processes community correction proposals through admin review pipeline', () => {
      const proposal = submitCorrectionProposal({
        jurisdictionKey: 'MAHARASHTRA_NASHIK',
        proposedAuthorityName: 'Nashik Municipal Corporation (NMC)',
        proposedPortalUrl: 'https://nmc.gov.in',
        officialGazetteOrSourceUrl: 'https://urban.maharashtra.gov.in/gazette/2026/nmc',
        submissionNotes: 'Nashik NMC migrated to UDCPR single window portal.',
        contributorId: 'contributor_nashik_civic',
      });

      expect(proposal.proposalId).toBeDefined();
      expect(proposal.reviewStatus).toBe('PENDING_ADMIN_REVIEW');

      const reviewed = reviewCorrectionProposal(
        proposal.proposalId,
        'APPROVED',
        'Verified against Urban Development Department gazette.'
      );

      expect(reviewed.reviewStatus).toBe('APPROVED');
      expect(reviewed.reviewerNotes).toContain('Verified against Urban Development');
    });

    it('rejects invalid decision in admin review', () => {
      const proposal = submitCorrectionProposal({
        jurisdictionKey: 'TEST_KEY',
        officialGazetteOrSourceUrl: 'https://official.gov.in',
      });

      expect(() => {
        reviewCorrectionProposal(proposal.proposalId, 'MAYBE_LATER');
      }).toThrow("Decision must be either 'APPROVED' or 'REJECTED'");
    });
  });
});
