import { describe, it, expect, beforeEach } from 'vitest';
import {
  getConsentPreferences,
  isConsentGranted,
  updateConsentPreference,
  revokeConsentAndPurge,
  getRetentionPolicyStatus,
  enforceRetentionPolicies,
  enforceAuthorization,
  recordPrivacyAuditLog,
  getPrivacyAuditLogs,
  verifyStoredAuditLogIntegrity,
  verifyExportedDataIntegrity,
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
    it('disables direct browser exports that bypass account binding and one-time links', () => {
      expect(() => exportUserData('user_789')).toThrow(/authenticated Privacy Centre/);
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

  describe('Consent-Withdrawal Cascade, Retention Enforcement & Audit Chain (#696)', () => {
    it('purges dependent non-essential stores when optional consent is revoked while preserving essential data', () => {
      const storage = globalThis.__mockPrivacyStorage;
      updateConsentPreference('offline_cache', true, 'citizen_99');
      updateConsentPreference('chat_session_memory', true, 'citizen_99');

      storage.set('civicbridge_offline_cache', JSON.stringify({ services: { passport: { cachedAt: '2026-11-10T00:00:00.000Z' } } }));
      storage.set('civicbridge_offline_last_sync', '2026-11-10T00:00:00.000Z');
      storage.set('civicbridge_chat_history', JSON.stringify([{ id: 'm1', timestamp: '2026-11-10T00:00:00.000Z', text: 'hi' }]));
      // Mandatory user records must remain untouched
      storage.set('civicbridge_vault_docs', JSON.stringify([{ id: 'doc-1' }]));

      const offlinePurge = revokeConsentAndPurge('offline_cache', 'citizen_99');
      expect(offlinePurge.purgedKeys).toEqual(
        expect.arrayContaining(['civicbridge_offline_cache', 'civicbridge_offline_last_sync'])
      );
      expect(storage.get('civicbridge_offline_cache')).toBeUndefined();
      expect(storage.get('civicbridge_offline_last_sync')).toBeUndefined();
      expect(storage.get('civicbridge_vault_docs')).toBeDefined();

      // Revoking via updateConsentPreference also triggers dependent cleanup
      updateConsentPreference('chat_session_memory', false, 'citizen_99');
      expect(storage.get('civicbridge_chat_history')).toBeUndefined();

      const auditIntegrity = verifyStoredAuditLogIntegrity();
      expect(auditIntegrity.valid).toBe(true);
      expect(auditIntegrity.status).toBe('VERIFIED');
      expect(getPrivacyAuditLogs().some((l) => l.action === 'CONSENT_REVOCATION_PURGE')).toBe(true);
    });

    it('detects expired non-essential stores beyond retentionDays and prunes stale chat turns without dropping active ones', () => {
      const storage = globalThis.__mockPrivacyStorage;
      const nowMs = Date.parse('2026-11-11T00:00:00.000Z');

      updateConsentPreference('offline_cache', true, 'citizen_ttl');
      updateConsentPreference('chat_session_memory', true, 'citizen_ttl');

      // 45 days old (> 30 days TTL for offline_cache)
      storage.set(
        'civicbridge_offline_cache',
        JSON.stringify({ services: { aadhaar: { cachedAt: '2026-09-27T00:00:00.000Z' } } })
      );
      storage.set('civicbridge_offline_last_sync', '2026-09-27T00:00:00.000Z');

      // Mixed chat history: one 25-day-old turn (> 14 days TTL) + one 2-day-old turn (retained)
      storage.set(
        'civicbridge_chat_history',
        JSON.stringify([
          { id: 'old-msg', timestamp: '2026-10-17T00:00:00.000Z', text: 'stale' },
          { id: 'fresh-msg', timestamp: '2026-11-09T00:00:00.000Z', text: 'recent' },
        ])
      );

      const preview = getRetentionPolicyStatus(nowMs);
      expect(preview.actionRequired).toBe(true);
      expect(preview.totalExpiredKeys).toBe(3);

      const enforced = enforceRetentionPolicies({ nowMs, actorId: 'system_cron' });
      expect(enforced.actionTaken).toBe(true);
      expect(enforced.purgedKeys).toEqual(
        expect.arrayContaining(['civicbridge_offline_cache', 'civicbridge_offline_last_sync'])
      );
      expect(enforced.prunedRecordsCount).toBe(1);

      const remainingChat = JSON.parse(storage.get('civicbridge_chat_history'));
      expect(remainingChat).toHaveLength(1);
      expect(remainingChat[0].id).toBe('fresh-msg');
      expect(getRetentionPolicyStatus(nowMs).actionRequired).toBe(false);
    });

    it('seals exported data dossiers with a canonical SHA-256 digest and detects audit log tampering', () => {
      const storage = globalThis.__mockPrivacyStorage;
      storage.set('civicbridge_saved_rich', JSON.stringify([{ serviceId: 'passport' }]));

      const exported = exportUserData('citizen_verify');
      expect(exported.exportMetadata.hashAlgorithm).toBe('SHA-256');
      expect(verifyExportedDataIntegrity(exported).valid).toBe(true);

      const alteredExport = {
        ...exported,
        savedServices: [{ serviceId: 'tampered' }],
      };
      expect(verifyExportedDataIntegrity(alteredExport).valid).toBe(false);

      // Tamper stored audit log entry in storage
      const logs = getPrivacyAuditLogs();
      logs[0].metadata = { totalCategories: 999 };
      storage.set('civicbridge_privacy_audit_log', JSON.stringify(logs));

      const tamperReport = verifyStoredAuditLogIntegrity();
      expect(tamperReport.valid).toBe(false);
      expect(tamperReport.status).toBe('TAMPERED');
    });
  });
});
