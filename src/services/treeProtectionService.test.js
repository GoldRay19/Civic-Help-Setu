import { describe, it, expect, beforeEach } from 'vitest';
import {
  TREE_OPERATION_TYPE,
  VERIFICATION_STATE,
  CHECKLIST_ITEM_STATUS,
  resolveCompetentTreeAuthority,
  isDataStale,
  listSupportedJurisdictions,
  getProtectedSpeciesDirectory,
  getTreeActionRequirements,
  getEmergencyHazardRoute,
  getIllegalFellingReportRoute,
  validateTreeChecklistInput,
  validateFeedbackSubmission,
  createTreeChecklist,
  getTreeChecklist,
  updateTreeChecklist,
  deleteTreeChecklist,
  listUserTreeChecklists,
  sanitizeTreeChecklistForExport,
  submitTreeDataCorrection,
  reviewTreeDataCorrection,
  getPendingCorrectionProposals,
  _resetInternalStores,
} from './treeProtectionService';

describe('treeProtectionService', () => {
  beforeEach(() => {
    _resetInternalStores();
  });

  describe('resolveCompetentTreeAuthority & isDataStale', () => {
    it('resolves verified authority details for Delhi NCT with dated official source', () => {
      const auth = resolveCompetentTreeAuthority('DELHI_NCT');
      expect(auth.isSupported).toBe(true);
      expect(auth.city).toBe('Delhi');
      expect(auth.authorityName).toContain('Department of Forests and Wildlife');
      expect(auth.statutoryAct).toContain('Delhi Preservation of Trees Act, 1994');
      expect(auth.sourceUrl).toBe('https://forest.delhigovt.nic.in/tree-felling-permission');
      expect(auth.effectiveDate).toBe('2026-09-01');
      expect(auth.verificationTimestamp).toBeDefined();
      expect(auth.publicObjectionWindowDays).toBe(15);
      expect(auth.compensatoryPlantationRatio).toContain('1:10');
      expect(auth.statutoryPenalties.imprisonmentMax).toBeDefined();
    });

    it('resolves verified authority for Bengaluru (BBMP) case-insensitively with whitespace', () => {
      const auth = resolveCompetentTreeAuthority('  karnataka_bengaluru  ');
      expect(auth.isSupported).toBe(true);
      expect(auth.city).toBe('Bengaluru');
      expect(auth.statutoryAct).toContain('Karnataka Preservation of Trees Act, 1976');
      expect(auth.emergencyHelpline).toContain('080-22660000');
    });

    it('resolves verified authority for Mumbai (BMC)', () => {
      const auth = resolveCompetentTreeAuthority('MAHARASHTRA_MUMBAI');
      expect(auth.isSupported).toBe(true);
      expect(auth.statutoryAct).toContain('Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975');
      expect(auth.compensatoryPlantationRatio).toContain('Heritage trees');
    });

    it('returns explicit UNAVAILABLE_OR_UNVERIFIED for unknown jurisdictions without guessing', () => {
      const fallback = resolveCompetentTreeAuthority('UNKNOWN_VILLAGE');
      expect(fallback.isSupported).toBe(false);
      expect(fallback.status).toBe(VERIFICATION_STATE.UNAVAILABLE_OR_UNVERIFIED);
      expect(fallback.message).toContain('unverified in this registry');
      expect(fallback.sourceUrl).toBeNull();
      expect(fallback.recommendedAction).toContain('District Forest Officer');
    });

    it('detects stale data correctly when verification timestamp exceeds maxStaleDays', () => {
      const oldTimestamp = '2023-01-01T00:00:00Z';
      expect(isDataStale(oldTimestamp, 180)).toBe(true);

      const recentTimestamp = new Date().toISOString();
      expect(isDataStale(recentTimestamp, 180)).toBe(false);

      expect(isDataStale(null)).toBe(true);
      expect(isDataStale('invalid-date')).toBe(true);
    });

    it('lists all supported jurisdictions with active source URLs', () => {
      const list = listSupportedJurisdictions();
      expect(list.length).toBeGreaterThanOrEqual(6);
      list.forEach((item) => {
        expect(item.jurisdictionKey).toBeDefined();
        expect(item.sourceUrl).toMatch(/^https:\/\//);
        expect(item.verificationTimestamp).toBeDefined();
      });
    });

    it('returns protected species directory with statutory rules', () => {
      const species = getProtectedSpeciesDirectory();
      expect(species.length).toBeGreaterThanOrEqual(5);
      const sandalwood = species.find((s) => s.commonName === 'Sandalwood');
      expect(sandalwood).toBeDefined();
      expect(sandalwood.rules).toContain('State Forest Department');
    });
  });

  describe('getTreeActionRequirements', () => {
    it('distinguishes requirements between Pruning and Transplantation', () => {
      const pruningReqs = getTreeActionRequirements(TREE_OPERATION_TYPE.PRUNING, 'DELHI_NCT');
      expect(pruningReqs.operation.id).toBe(TREE_OPERATION_TYPE.PRUNING);

      const transplantReqs = getTreeActionRequirements(TREE_OPERATION_TYPE.TRANSPLANTATION, 'DELHI_NCT');
      expect(transplantReqs.operation.id).toBe(TREE_OPERATION_TYPE.TRANSPLANTATION);

      // Verify conditional requirement behavior
      const transplantPlanPruning = pruningReqs.evidenceChecklist
        .flatMap((cat) => cat.items)
        .find((item) => item.id === 'TRANSPLANT_RECEIVING_SITE_PLAN');
      expect(transplantPlanPruning.mandatory).toBe(false);

      const transplantPlanTransplant = transplantReqs.evidenceChecklist
        .flatMap((cat) => cat.items)
        .find((item) => item.id === 'TRANSPLANT_RECEIVING_SITE_PLAN');
      expect(transplantPlanTransplant.mandatory).toBe(true);
    });

    it('includes statutory notices and editorial guidance distinctly', () => {
      const reqs = getTreeActionRequirements(TREE_OPERATION_TYPE.REMOVAL, 'KARNATAKA_BENGALURU');
      expect(reqs.statutoryNotice).toContain('Statutory Notice:');
      expect(reqs.editorialNotice).toContain('Editorial Advice:');
      expect(reqs.authority.inspectionMandatory).toBe(true);
    });
  });

  describe('Emergency & Illegal Felling Routes', () => {
    it('returns dedicated fast-track emergency route with hotline and steps', () => {
      const emergency = getEmergencyHazardRoute('DELHI_NCT');
      expect(emergency.isEmergency).toBe(true);
      expect(emergency.routeType).toBe('EMERGENCY_DANGEROUS_TREE');
      expect(emergency.emergencyHotline).toBeDefined();
      expect(emergency.immediateActionSteps.length).toBe(4);
      expect(emergency.immediateActionSteps[0].title).toContain('Cordon Off');
      expect(emergency.immediateActionSteps[0].instruction).toContain('pedestrians');
    });

    it('returns dedicated whistleblower route for illegal felling reporting', () => {
      const report = getIllegalFellingReportRoute('MAHARASHTRA_MUMBAI');
      expect(report.isEnforcement).toBe(true);
      expect(report.routeType).toBe('ILLEGAL_FELLING_REPORT');
      expect(report.confidentialityNotice).toContain('Whistleblower Protection');
      expect(report.legalPenaltiesApplicable.fineMax).toBeDefined();
    });
  });

  describe('Validation Helpers', () => {
    it('validates checklist input correctly', () => {
      const invalid = validateTreeChecklistInput({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors.some((e) => e.includes('ownerId'))).toBe(true);
      expect(invalid.errors.some((e) => e.includes('jurisdictionKey'))).toBe(true);

      const invalidOp = validateTreeChecklistInput({
        ownerId: 'user123',
        jurisdictionKey: 'DELHI_NCT',
        operationType: 'INVALID_OP',
      });
      expect(invalidOp.valid).toBe(false);

      const valid = validateTreeChecklistInput({
        ownerId: 'user123',
        jurisdictionKey: 'DELHI_NCT',
        operationType: TREE_OPERATION_TYPE.PRUNING,
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors.length).toBe(0);
    });

    it('validates feedback submissions correctly', () => {
      expect(validateFeedbackSubmission({ comment: 'hi' }).valid).toBe(false);
      expect(validateFeedbackSubmission({ comment: 'Valid comment', rating: 6 }).valid).toBe(false);
      expect(validateFeedbackSubmission({ comment: 'Great detailed tree guide!', rating: 5 }).valid).toBe(true);
    });
  });

  describe('User-Managed Checklist CRUD & Access Control', () => {
    it('creates, retrieves, and lists user checklists', () => {
      const dossier = createTreeChecklist({
        ownerId: 'citizen_99',
        jurisdictionKey: 'DELHI_NCT',
        operationType: TREE_OPERATION_TYPE.PRUNING,
        treeSpecies: 'Neem (Azadirachta indica)',
        estimatedGirthCm: 45,
      });

      expect(dossier.id).toMatch(/^tree_/);
      expect(dossier.ownerId).toBe('citizen_99');
      expect(dossier.checklistItems.length).toBeGreaterThan(0);

      const fetched = getTreeChecklist(dossier.id, 'citizen_99');
      expect(fetched).toEqual(dossier);

      const userList = listUserTreeChecklists('citizen_99');
      expect(userList.length).toBe(1);
      expect(userList[0].id).toBe(dossier.id);
    });

    it('enforces ownerId access control and denies unauthorized inspection', () => {
      const dossier = createTreeChecklist({
        ownerId: 'citizen_alpha',
        jurisdictionKey: 'KARNATAKA_BENGALURU',
      });

      expect(() => {
        getTreeChecklist(dossier.id, 'citizen_intruder');
      }).toThrow('Access Denied: You are not authorized');
    });

    it('updates checklist items and metadata with owner authorization', () => {
      const dossier = createTreeChecklist({
        ownerId: 'citizen_owner',
        jurisdictionKey: 'MAHARASHTRA_PUNE',
      });

      const firstItemId = dossier.checklistItems[0].itemId;

      const updated = updateTreeChecklist(dossier.id, 'citizen_owner', {
        treeSpecies: 'Gulmohar',
        itemsToUpdate: [
          {
            itemId: firstItemId,
            completed: true,
            documentRef: 'DOC-SALE-DEED-2026',
            notes: 'Registered deed uploaded',
          },
        ],
      });

      expect(updated.treeSpecies).toBe('Gulmohar');
      const updatedItem = updated.checklistItems.find((i) => i.itemId === firstItemId);
      expect(updatedItem.completed).toBe(true);
      expect(updatedItem.status).toBe(CHECKLIST_ITEM_STATUS.COMPLETED);
      expect(updatedItem.documentRef).toBe('DOC-SALE-DEED-2026');
      expect(updatedItem.verifiedDate).toBeDefined();
    });

    it('deletes checklist record strictly with owner authorization', () => {
      const dossier = createTreeChecklist({
        ownerId: 'citizen_delete_test',
        jurisdictionKey: 'DELHI_NCT',
      });

      expect(() => {
        deleteTreeChecklist(dossier.id, 'intruder_user');
      }).toThrow('Access Denied');

      const deleted = deleteTreeChecklist(dossier.id, 'citizen_delete_test');
      expect(deleted).toBe(true);

      const notFound = getTreeChecklist(dossier.id, 'citizen_delete_test');
      expect(notFound).toBeNull();
    });
  });

  describe('Privacy & Personal Identifier Redaction', () => {
    it('sanitizes personal identifiers and private notes for safe public export', () => {
      const dossier = createTreeChecklist({
        ownerId: 'private_citizen_aadhaar_1234',
        jurisdictionKey: 'DELHI_NCT',
        treeLocationDescription: 'Plot No. 42, Civil Lines, Latitude 28.6139, Longitude 77.2090',
      });

      updateTreeChecklist(dossier.id, 'private_citizen_aadhaar_1234', {
        itemsToUpdate: [
          {
            itemId: dossier.checklistItems[0].itemId,
            completed: true,
            documentRef: 'MY_PERSONAL_SALE_DEED_TOKEN_8923',
            notes: 'Contains sensitive family survey number',
          },
        ],
      });

      const raw = getTreeChecklist(dossier.id, 'private_citizen_aadhaar_1234');
      const sanitized = sanitizeTreeChecklistForExport(raw);

      expect(sanitized.ownerId).toBe('REDACTED_CITIZEN_ID');
      expect(sanitized.treeLocationDescription).toBe('REDACTED_PLOT_SURVEY_LOCATION');
      expect(sanitized.checklistItems[0].documentRef).toBe('REDACTED_DOCUMENT_ATTACHMENT');
      expect(sanitized.checklistItems[0].notes).toBe('REDACTED_CITIZEN_NOTES');
      // Original record in memory must remain untouched
      expect(raw.ownerId).toBe('private_citizen_aadhaar_1234');
    });

    it('returns null when sanitizing null or non-object payload', () => {
      expect(sanitizeTreeChecklistForExport(null)).toBeNull();
    });
  });

  describe('Community Corrections & Admin Review Workflow', () => {
    it('submits a correction proposal requiring verifiable official URL', () => {
      expect(() => {
        submitTreeDataCorrection({ jurisdictionKey: 'DELHI_NCT' });
      }).toThrow('mandatory');

      const proposal = submitTreeDataCorrection({
        jurisdictionKey: 'DELHI_NCT',
        proposedAuthorityName: 'GNCTD Forest Department Ward 4',
        officialGazetteOrSourceUrl: 'https://egazette.nic.in/tree-order-2026',
        submissionNotes: 'Updated objection window to 21 days as per recent high court directive.',
      });

      expect(proposal.proposalId).toMatch(/^corr_tree_/);
      expect(proposal.reviewStatus).toBe('PENDING_ADMIN_REVIEW');

      const pending = getPendingCorrectionProposals();
      expect(pending.length).toBe(1);
      expect(pending[0].proposalId).toBe(proposal.proposalId);
    });

    it('reviews, approves or rejects proposal with administrator notes', () => {
      const proposal = submitTreeDataCorrection({
        jurisdictionKey: 'KARNATAKA_BENGALURU',
        officialGazetteOrSourceUrl: 'https://bbmp.gov.in/gazette/2026',
      });

      expect(() => {
        reviewTreeDataCorrection(proposal.proposalId, 'INVALID_DECISION');
      }).toThrow("Decision must be either 'APPROVED' or 'REJECTED'");

      const reviewed = reviewTreeDataCorrection(
        proposal.proposalId,
        'APPROVED',
        'Verified against official BBMP circular.'
      );

      expect(reviewed.reviewStatus).toBe('APPROVED');
      expect(reviewed.reviewerNotes).toBe('Verified against official BBMP circular.');
      expect(reviewed.reviewedAt).toBeDefined();

      const remainingPending = getPendingCorrectionProposals();
      expect(remainingPending.length).toBe(0);
    });
  });
});
