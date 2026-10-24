import { describe, it, expect, beforeEach } from 'vitest';
import {
  getConsentPreferences,
  isConsentGranted,
  updateConsentPreference,
  enforceAuthorization,
  recordPrivacyAuditLog,
  getPrivacyAuditLogs,
  exportUserData,
  purgeAllUserData,
  USER_DATA_STORAGE_KEYS,
} from './privacyConsentService.js';

describe('Privacy and Consent Management Service (#80)', () => {
  beforeEach(() => {
    if (globalThis.__mockPrivacyStorage) {
      globalThis.__mockPrivacyStorage.clear();
    }
  });

  describe('Consent Preferences and Enforcement', () => {
    it('initializes with default consent preferences and locks essential storage', () => {
      const preferences = getConsentPreferences();
      expect(preferences.essential_storage).toBe(true);
      expect(isConsentGranted('essential_storage')).toBe(true);
      expect(isConsentGranted('analytics_telemetry')).toBe(false);
    });

    it('updates optional consent preferences and stores updated state', () => {
      expect(isConsentGranted('analytics_telemetry')).toBe(false);

      updateConsentPreference('analytics_telemetry', true, 'user_123');
      expect(isConsentGranted('analytics_telemetry')).toBe(true);

      updateConsentPreference('analytics_telemetry', false, 'user_123');
      expect(isConsentGranted('analytics_telemetry')).toBe(false);
    });

    it('throws error when trying to revoke mandatory essential storage', () => {
      expect(() => {
        updateConsentPreference('essential_storage', false, 'user_123');
      }).toThrow(/Cannot revoke consent for mandatory category/);
    });

    it('throws error for unknown consent category', () => {
      expect(() => {
        updateConsentPreference('fictitious_category', true, 'user_123');
      }).toThrow(/Unknown consent category/);
    });
  });

  describe('Authorization Enforcement', () => {
    it('authorizes operations when actor ID matches resource owner ID', () => {
      const authorized = enforceAuthorization('citizen_42', 'citizen_42');
      expect(authorized).toBe(true);
    });

    it('allows admin_root to manage records across users', () => {
      const authorized = enforceAuthorization('admin_root', 'citizen_42');
      expect(authorized).toBe(true);
    });

    it('rejects and blocks unauthorized access attempts with an audit record', () => {
      expect(() => {
        enforceAuthorization('attacker_99', 'citizen_victim');
      }).toThrow(/Access Denied/);

      const logs = getPrivacyAuditLogs();
      const unauthorizedLog = logs.find((l) => l.action === 'UNAUTHORIZED_ACCESS_BLOCKED');
      expect(unauthorizedLog).toBeDefined();
      expect(unauthorizedLog.actorId).toBe('attacker_99');
      expect(unauthorizedLog.metadata.attemptedAccessOn).toBe('citizen_victim');
    });

    it('throws when user authentication context is missing', () => {
      expect(() => {
        enforceAuthorization(null, 'citizen_victim');
      }).toThrow(/Missing user authentication context/);
    });
  });

  describe('Audit Logging Without Sensitive PII', () => {
    it('records security events while strictly stripping sensitive PII keys', () => {
      recordPrivacyAuditLog(
        'TEST_ACTION',
        {
          safeField: 'active',
          password: 'SecretPassword123!',
          aadhaarNumber: '9999-8888-7777',
          email: 'citizen@example.com',
          documentContent: 'Confidential PDF binary',
        },
        'user_456'
      );

      const logs = getPrivacyAuditLogs();
      expect(logs.length).toBeGreaterThan(0);

      const entry = logs[0];
      expect(entry.action).toBe('TEST_ACTION');
      expect(entry.metadata.safeField).toBe('active');
      expect(entry.metadata.password).toBeUndefined();
      expect(entry.metadata.aadhaarNumber).toBeUndefined();
      expect(entry.metadata.email).toBeUndefined();
      expect(entry.metadata.documentContent).toBeUndefined();
    });
  });

  describe('Data Export Workflow', () => {
    it('exports all user-owned data in documented JSON format with sensitive fields redacted', () => {
      // Seed the keys the vault, tracker, saved services and appointments actually write
      const storage = globalThis.__mockPrivacyStorage;
      storage.set(
        'civicbridge_vault_docs',
        JSON.stringify([
          { id: 'doc-1', type: 'Aadhaar Card', category: 'Identity', number: '1234-5678-9012', issuer: 'UIDAI' },
        ])
      );
      storage.set(
        'civicbridge_applications',
        JSON.stringify([{ id: 'APP-100', serviceName: 'Passport' }])
      );
      storage.set('civicbridge_saved_rich', JSON.stringify([{ serviceId: 'pan-card', folder: 'Finance' }]));
      storage.set('civicbridge_office_tokens', JSON.stringify([{ id: 'apt_1', tokenNumber: 'TKN-123456' }]));

      const exported = exportUserData('user_789');

      expect(exported.exportMetadata.userId).toBe('user_789');
      expect(exported.exportMetadata.platform).toBe('Civic-Help-Setu');
      expect(exported.trackedApplications).toHaveLength(1);
      expect(exported.savedServices).toHaveLength(1);
      expect(exported.officeAppointments).toHaveLength(1);
      expect(exported.documentVaultMetadata).toHaveLength(1);
      expect(exported.documentVaultMetadata[0].name).toBe('Aadhaar Card');
      // Verify document number is redacted
      expect(exported.documentVaultMetadata[0].documentNumber).toBe('***REDACTED***');
      expect(JSON.stringify(exported)).not.toContain('1234-5678-9012');
      expect(exported.exportMetadata.includedStorageKeys).toEqual(
        expect.arrayContaining(['civicbridge_vault_docs', 'civicbridge_applications', 'civicbridge_saved_rich', 'civicbridge_office_tokens'])
      );
    });

    it('does not crash on corrupt or missing stored values', () => {
      const storage = globalThis.__mockPrivacyStorage;
      storage.set('civicbridge_vault_docs', '{not json');
      storage.set('civicbridge_reminders', JSON.stringify({ not: 'an array' }));

      const exported = exportUserData('user_789');

      expect(exported.documentVaultMetadata).toEqual([]);
      expect(exported.activeReminders).toEqual([]);
      expect(exported.trackedApplications).toEqual([]);
      expect(exported.notificationSettings).toEqual({});
    });
  });

  describe('Cascading Account Deletion', () => {
    it('purges all related data across vault, applications, saved guides, and resets consents', () => {
      const storage = globalThis.__mockPrivacyStorage;
      storage.set('civicbridge_vault_docs', JSON.stringify([{ id: 'd1' }]));
      storage.set('civicbridge_applications', JSON.stringify([{ id: 'a1' }]));
      storage.set('civicbridge_saved_rich', JSON.stringify([{ serviceId: 's1' }]));
      storage.set('civicbridge_saved', JSON.stringify([{ id: 's1' }]));
      storage.set('civicbridge_office_tokens', JSON.stringify([{ id: 'apt_1' }]));
      storage.set('civic_service_reviews', JSON.stringify([{ id: 'rev-1' }]));
      storage.set('civicbridge_chat_history', JSON.stringify([{ id: 'c1' }]));
      storage.set('civic_journey_progress_new-business', JSON.stringify({ completedTaskIds: ['t1'] }));
      storage.set('civicbridge_theme', 'dark');
      storage.set('civicbridge_consent_preferences', JSON.stringify({ analytics_telemetry: true }));

      const result = purgeAllUserData('user_delete_me', { preserveAuditTrail: true });
      expect(result.success).toBe(true);
      expect(result.deletedKeysCount).toBe(8);

      // Verify all stores are deleted
      for (const key of USER_DATA_STORAGE_KEYS) {
        expect(storage.get(key)).toBeUndefined();
      }
      expect(storage.get('civic_journey_progress_new-business')).toBeUndefined();
      expect(storage.get('civicbridge_consent_preferences')).toBeUndefined();
      // UI preferences are kept
      expect(storage.get('civicbridge_theme')).toBe('dark');

      // Verify deletion audit receipt is retained
      const logs = getPrivacyAuditLogs();
      const purgeLog = logs.find((l) => l.action === 'ACCOUNT_DATA_PERMANENTLY_PURGED');
      expect(purgeLog).toBeDefined();
      expect(purgeLog.actorId).toBe('user_delete_me');
    });
  });
});
