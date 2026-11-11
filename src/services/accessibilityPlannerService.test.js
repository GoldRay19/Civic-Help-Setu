import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessibilityCatalog,
  getOfficeAccessibilityProfile,
  isAuditDateStale,
  buildPersonalVisitChecklist,
  savePersonalVisitPlan,
  loadPersonalVisitPlan,
  deletePersonalVisitPlan,
  exportVisitPlanSummary,
  STALE_AUDIT_DAYS_THRESHOLD,
  ACCESSIBILITY_STORAGE_KEY,
} from './accessibilityPlannerService.js';

const createMockStorage = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
};

describe('accessibilityPlannerService (#144)', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  describe('Feature Catalog', () => {
    it('returns standardized public accessibility feature definitions', () => {
      const catalog = getAccessibilityCatalog();
      expect(catalog.length).toBeGreaterThanOrEqual(10);

      const ids = catalog.map((f) => f.id);
      expect(ids).toContain('step_free_access');
      expect(ids).toContain('elevators');
      expect(ids).toContain('accessible_counters');
      expect(ids).toContain('accessible_washrooms');
      expect(ids).toContain('tactile_paving');
      expect(ids).toContain('sign_language_support');
      expect(ids).toContain('accessible_formats');
      expect(ids).toContain('accompanying_helper');
    });
  });

  describe('Source-backed and unknown accessibility details', () => {
    it('does not present an office attribute as verified without a direct source and verification date', () => {
      const profile = getOfficeAccessibilityProfile('delhi-south-collectorate');

      expect(profile.officeId).toBe('delhi-south-collectorate');
      expect(profile.hasAuditRecord).toBe(false);
      expect(profile.officialSource).toBeNull();
      expect(profile.auditWarning).toContain('unverified');

      for (const feature of profile.features) {
        expect(feature.status).toBe('not_verified');
        expect(feature.statusLabel).toBe('Not Verified');
        expect(feature.source).toBeNull();
        expect(feature.verificationDate).toBeNull();
      }
    });

    it('detects stale dates without implying that an office has been audited', () => {
      expect(isAuditDateStale('2026-09-15')).toBe(false); // recent (< 180 days)
      expect(isAuditDateStale('2024-05-10')).toBe(true); // stale (> 180 days)
      expect(isAuditDateStale(null)).toBe(true);
      expect(STALE_AUDIT_DAYS_THRESHOLD).toBe(180);
    });

    it('handles null, undefined, or empty office IDs gracefully', () => {
      const nullProfile = getOfficeAccessibilityProfile(null);
      expect(nullProfile.officeId).toBeNull();
      expect(nullProfile.hasAuditRecord).toBe(false);
      expect(nullProfile.features.every((f) => f.status === 'not_verified')).toBe(true);
    });
  });

  describe('Personal Visit Checklist Builder & Storage', () => {
    it('builds confirmation questions without representing unknown attributes as confirmed', () => {
      const checklist = buildPersonalVisitChecklist('delhi-south-collectorate', [
        'step_free_access',
        'tactile_paving',
      ]);

      expect(checklist.officeName).toContain('District Magistrate Office');
      expect(checklist.officialContacts.phone).toBeDefined();
      expect(checklist.officialContacts.portalUrl).toBeDefined();

      const questions = checklist.questionsToConfirm;
      expect(questions).toHaveLength(2);
      expect(questions.every((q) => q.status === 'not_verified')).toBe(true);
      expect(questions.every((q) => q.urgency === 'high')).toBe(true);
    });

    it('requires explicit consent and stores only selected preferences', () => {
      const officeId = 'delhi-south-collectorate';
      const planData = {
        neededFeatureIds: ['step_free_access', 'accessible_washrooms'],
        confirmedQuestionIds: ['step_free_access'],
        diagnosis: 'must not be stored',
      };

      expect(savePersonalVisitPlan(officeId, planData, mockStorage)).toBe(false);
      expect(mockStorage.getItem(ACCESSIBILITY_STORAGE_KEY)).toBeNull();

      const saved = savePersonalVisitPlan(officeId, planData, mockStorage, true);
      expect(saved).toBe(true);

      const loaded = loadPersonalVisitPlan(officeId, mockStorage);
      expect(loaded.neededFeatureIds).toEqual(['step_free_access', 'accessible_washrooms']);
      expect(loaded.confirmedQuestionIds).toEqual(['step_free_access']);
      expect(loaded.diagnosis).toBeUndefined();
      expect(loaded.consentGivenAt).toBeDefined();
      expect(loaded.updatedAt).toBeDefined();
    });

    it('deletes only the selected office plan and removes the key when empty', () => {
      savePersonalVisitPlan('office-one', { neededFeatureIds: ['step_free_access'] }, mockStorage, true);
      savePersonalVisitPlan('office-two', { neededFeatureIds: ['accessible_formats'] }, mockStorage, true);

      expect(deletePersonalVisitPlan('office-one', mockStorage)).toBe(true);
      expect(loadPersonalVisitPlan('office-one', mockStorage)).toBeNull();
      expect(loadPersonalVisitPlan('office-two', mockStorage).neededFeatureIds).toEqual(['accessible_formats']);
      expect(deletePersonalVisitPlan('office-two', mockStorage)).toBe(true);
      expect(mockStorage.getItem(ACCESSIBILITY_STORAGE_KEY)).toBeNull();
    });

    it('exports a request note with only explicitly selected details', () => {
      const checklist = buildPersonalVisitChecklist('delhi-south-collectorate', [
        'step_free_access',
        'accessible_formats',
      ]);
      checklist.privateNotes = 'do not print';
      checklist.questionsToConfirm[0].notes = 'unselected audit metadata';

      const summary = exportVisitPlanSummary(checklist);
      expect(summary).toContain('Office visit request');
      expect(summary).toContain('District Magistrate Office');
      expect(summary).toContain('- Step-Free Entrance & Ramp');
      expect(summary).toContain('- Accessible Formats');
      expect(summary).not.toContain('Sign-Language Support');
      expect(summary).not.toContain('do not print');
      expect(summary).not.toContain('unselected audit metadata');
      expect(summary).not.toContain('Status:');
      expect(summary).not.toContain('Official Contact');
      expect(summary).not.toContain('Generated on');
      expect(summary).not.toContain('diagnosis');
    });

    it('returns empty string if export is called with null', () => {
      expect(exportVisitPlanSummary(null)).toBe('');
    });
  });
});
