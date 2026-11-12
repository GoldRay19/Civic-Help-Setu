import crypto from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  GENESIS_AUDIT_HASH,
  sha256Hex,
  canonicalStringify,
  createChainedAuditEntry,
  verifyPrivacyAuditLogIntegrity,
  signExportPayload,
  verifyExportedDataIntegrity,
} from './privacyIntegrityService.js';

const nodeSha256 = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');

describe('Cryptographic Privacy Integrity Service (#696)', () => {
  it('computes FIPS 180-4 SHA-256 digests matching Node crypto across empty, ASCII, UTF-8, and multi-block inputs', () => {
    const vectors = [
      '',
      'abc',
      'a'.repeat(55),
      'a'.repeat(56),
      'a'.repeat(64),
      'a'.repeat(130),
      'Civic-Help-Setu DPDP Audit • ₹500 • தமிழ்நாடு • हिंदी',
    ];

    for (const input of vectors) {
      expect(sha256Hex(input)).toBe(nodeSha256(input));
    }
  });

  it('produces order-independent canonical JSON serialization and export integrity seals', () => {
    const payloadA = {
      exportMetadata: { userId: 'u1', platform: 'Civic-Help-Setu', version: '1.0.0' },
      consentPreferences: { personalization: true, essential_storage: true },
      savedServices: [{ id: 's1', name: 'Birth Certificate' }],
    };

    const payloadB = {
      savedServices: [{ name: 'Birth Certificate', id: 's1' }],
      consentPreferences: { essential_storage: true, personalization: true },
      exportMetadata: { version: '1.0.0', platform: 'Civic-Help-Setu', userId: 'u1' },
    };

    expect(canonicalStringify(payloadA)).toBe(canonicalStringify(payloadB));

    const signed = signExportPayload(payloadA);
    expect(signed.exportMetadata.hashAlgorithm).toBe('SHA-256');
    expect(signed.exportMetadata.integrityDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyExportedDataIntegrity(signed).valid).toBe(true);

    const reorderedSigned = {
      ...payloadB,
      exportMetadata: { ...signed.exportMetadata },
    };
    expect(verifyExportedDataIntegrity(reorderedSigned).valid).toBe(true);

    const tampered = {
      ...signed,
      consentPreferences: { ...signed.consentPreferences, personalization: false },
    };
    const tamperedCheck = verifyExportedDataIntegrity(tampered);
    expect(tamperedCheck.valid).toBe(false);
    expect(tamperedCheck.reason).toBe('DIGEST_MISMATCH');
  });

  it('chains audit entries from genesis and detects tampering, reordering, or missing ancestors', () => {
    const logs = [];
    const e1 = createChainedAuditEntry(
      {
        id: 'audit_1',
        timestamp: '2026-11-10T10:00:00.000Z',
        action: 'CONSENT_PREFERENCE_UPDATED',
        actorId: 'citizen_1',
        metadata: { categoryId: 'offline_cache', granted: true },
      },
      logs
    );
    logs.unshift(e1);

    const e2 = createChainedAuditEntry(
      {
        id: 'audit_2',
        timestamp: '2026-11-10T10:05:00.000Z',
        action: 'USER_DATA_EXPORTED',
        actorId: 'citizen_1',
        metadata: { totalCategories: 4 },
      },
      logs
    );
    logs.unshift(e2);

    const e3 = createChainedAuditEntry(
      {
        id: 'audit_3',
        timestamp: '2026-11-10T10:10:00.000Z',
        action: 'RETENTION_POLICY_ENFORCED',
        actorId: 'system',
        metadata: { purgedKeysCount: 1 },
      },
      logs
    );
    logs.unshift(e3);

    expect(e1.sequence).toBe(1);
    expect(e1.prevHash).toBe(GENESIS_AUDIT_HASH);
    expect(e2.prevHash).toBe(e1.entryHash);
    expect(e3.prevHash).toBe(e2.entryHash);

    const cleanCheck = verifyPrivacyAuditLogIntegrity(logs);
    expect(cleanCheck.valid).toBe(true);
    expect(cleanCheck.status).toBe('VERIFIED');
    expect(cleanCheck.verifiedEntries).toBe(3);

    // 1. Tamper metadata on middle entry
    const editedLogs = logs.map((item, idx) =>
      idx === 1 ? { ...item, metadata: { totalCategories: 99 } } : item
    );
    const editedCheck = verifyPrivacyAuditLogIntegrity(editedLogs);
    expect(editedCheck.valid).toBe(false);
    expect(editedCheck.status).toBe('TAMPERED');
    expect(editedCheck.tamperedIndices).toContain(1);

    // 2. Delete middle entry (breaks link between #3 and #1)
    const deletedMiddle = [logs[0], logs[2]];
    const gapCheck = verifyPrivacyAuditLogIntegrity(deletedMiddle);
    expect(gapCheck.valid).toBe(false);
    expect(gapCheck.issues.some((issue) => issue.reason === 'CHAIN_BREAK')).toBe(true);

    // 3. Delete oldest genesis entry (#1) from a small log (< 100 entries)
    const truncatedTail = [logs[0], logs[1]];
    const tailCheck = verifyPrivacyAuditLogIntegrity(truncatedTail);
    expect(tailCheck.valid).toBe(false);
    expect(tailCheck.issues.some((issue) => issue.reason === 'MISSING_ANCESTOR')).toBe(true);
  });
});
