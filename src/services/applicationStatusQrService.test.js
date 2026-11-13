import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createOrRotateStatusToken,
  resolvePublicStatusByToken,
  revokeStatusToken,
  checkLookupRateLimit,
  buildStatusQrPath,
  generateStatusToken,
  verifyStatusTokenIntegrity,
  getStatusSecuritySummary,
  getActiveStatusTokenForApplication,
  MAX_PIN_ATTEMPTS,
} from './applicationStatusQrService';

describe('applicationStatusQrService (#458, #739)', () => {
  beforeEach(() => {
    const store = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((k) => store[k] || null),
      setItem: vi.fn((k, v) => {
        store[k] = String(v);
      }),
      removeItem: vi.fn((k) => {
        delete store[k];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const mockApp = {
    id: 'APP-9988',
    serviceName: 'Ration Card Renewal',
    department: 'Food & Civil Supplies',
    status: 'Field Inspection Scheduled',
    submissionDate: '2026-10-15',
    // Sensitive fields that MUST NOT leak
    applicantAadhaar: '9988-7766-5544',
    applicantPhone: '+91 9876543210',
    internalOfficerNotes: 'Priority verification required',
  };

  it('creates an opaque status token without leaking sensitive fields', () => {
    const record = createOrRotateStatusToken(mockApp.id, mockApp);

    expect(record.token).toBeDefined();
    expect(record.token.length).toBe(32);
    expect(record.token).not.toContain(mockApp.id);
    expect(record.publicData.serviceName).toBe('Ration Card Renewal');
    expect(record.publicData.applicantAadhaar).toBeUndefined();
    expect(record.publicData.applicantPhone).toBeUndefined();
  });

  it('resolves active status by token with integrity seal', () => {
    const record = createOrRotateStatusToken(mockApp.id, mockApp);
    const res = resolvePublicStatusByToken(record.token, 'test_client_1');

    expect(res.status).toBe('ACTIVE');
    expect(res.readOnly).toBe(true);
    expect(res.application.serviceName).toBe('Ration Card Renewal');
    expect(res.application.stage).toBe('Field Inspection Scheduled');
    expect(res.application.milestones).toBeDefined();
    expect(res.integrityVerified).toBe(true);
    expect(res.integrityDigest).toBe(record.snapshotSeal);
  });

  it('rotates previous tokens when a new one is created', () => {
    const token1 = createOrRotateStatusToken(mockApp.id, mockApp);
    const token2 = createOrRotateStatusToken(mockApp.id, mockApp);

    const check1 = resolvePublicStatusByToken(token1.token, 'test_client_2');
    expect(check1.status).toBe('REVOKED');

    const check2 = resolvePublicStatusByToken(token2.token, 'test_client_3');
    expect(check2.status).toBe('ACTIVE');
  });

  it('revokes an active token and blocks further access', () => {
    const record = createOrRotateStatusToken(mockApp.id, mockApp);
    const revoked = revokeStatusToken(record.token);
    expect(revoked).toBe(true);

    const res = resolvePublicStatusByToken(record.token, 'test_client_4');
    expect(res.status).toBe('REVOKED');
    expect(res.error).toContain('rotated or deactivated');
  });

  it('enforces client rate limiting after 10 requests within window', () => {
    for (let i = 0; i < 10; i++) {
      const check = checkLookupRateLimit('rate_limit_client');
      expect(check.allowed).toBe(true);
    }

    const blocked = checkLookupRateLimit('rate_limit_client');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('builds SVG QR matrix for lookup URL', () => {
    const url = 'https://civichelpsetu.gov.in/app-status/abc123token';
    const { path, size } = buildStatusQrPath(url);
    expect(path).toBeDefined();
    expect(path.startsWith('M')).toBe(true);
    expect(size).toBeGreaterThan(20);
  });

  describe('Cryptographic Hardening, PIN Lockout, Burn-After-Read & PII Scrubbing (#739)', () => {
    it('fails closed in generateStatusToken when CSPRNG is unavailable instead of using Math.random', () => {
      vi.stubGlobal('crypto', undefined);
      expect(() => generateStatusToken()).toThrow(/Cryptographically secure random generator is unavailable/i);
    });

    it('rejects Object.prototype property names passed as tokens', () => {
      expect(resolvePublicStatusByToken('toString').status).toBe('NOT_FOUND');
      expect(resolvePublicStatusByToken('constructor').status).toBe('NOT_FOUND');
      expect(resolvePublicStatusByToken('__proto__').status).toBe('NOT_FOUND');
    });

    it('scrubs Aadhaar, PAN, phone, email, and reference IDs in milestone labels and free-text fields', () => {
      const record = createOrRotateStatusToken('APP-SEC-1', {
        serviceName: 'Grievance GRV-2026-987654',
        department: 'Revenue Dept (officer@district.gov.in)',
        status: 'Contact +91 9123456789',
        milestones: [
          {
            label: 'Aadhaar 1234 5678 9012 linked for PAN ABCDE1234F',
            status: 'COMPLETED',
            completedAt: 'Ref SRV-12345678',
          },
        ],
      });

      const res = resolvePublicStatusByToken(record.token, 'scrub_test_client');
      expect(res.status).toBe('ACTIVE');
      const serialized = JSON.stringify(res.application);
      expect(serialized).not.toContain('officer@district.gov.in');
      expect(serialized).not.toContain('1234 5678 9012');
      expect(serialized).not.toContain('ABCDE1234F');
      expect(serialized).not.toContain('9123456789');
      expect(serialized).not.toContain('GRV-2026-987654');
      expect(serialized).not.toContain('SRV-12345678');
      expect(serialized).toContain('[REDACTED_EMAIL]');
      expect(serialized).toContain('[REDACTED_AADHAAR]');
      expect(serialized).toContain('[REDACTED_PAN]');
      expect(serialized).toContain('[REDACTED_PHONE]');
      expect(serialized).toContain('[REDACTED_REF]');
    });

    it('detects stored milestone snapshot tampering using canonical SHA-256 verification', () => {
      const record = createOrRotateStatusToken('APP-SEAL', mockApp);
      expect(verifyStatusTokenIntegrity(record).valid).toBe(true);

      const all = JSON.parse(localStorage.getItem('civicbridge_app_status_qr_tokens'));
      all[record.token].publicData.stage = 'Tampered Approval Granted';
      localStorage.setItem('civicbridge_app_status_qr_tokens', JSON.stringify(all));

      const tamperedRes = resolvePublicStatusByToken(record.token, 'tamper_test_client');
      expect(tamperedRes.status).toBe('TAMPERED');
      expect(tamperedRes.application).toBeUndefined();
    });

    it('enforces salted SHA-256 passcode gating and brute-force lockout after repeated failed attempts', () => {
      const record = createOrRotateStatusToken('APP-PIN', mockApp, {
        accessPin: '9421',
      });
      expect(record.passcodeHash).toBeTruthy();
      expect(record.passcodeHash).not.toContain('9421');

      const challenge = resolvePublicStatusByToken(record.token, 'pin_client');
      expect(challenge.status).toBe('PIN_REQUIRED');
      expect(challenge.remainingAttempts).toBe(MAX_PIN_ATTEMPTS);

      for (let i = 1; i < MAX_PIN_ATTEMPTS; i++) {
        const wrong = resolvePublicStatusByToken(record.token, 'pin_client', { pin: '0000' });
        expect(wrong.status).toBe('INVALID_PIN');
        expect(wrong.remainingAttempts).toBe(MAX_PIN_ATTEMPTS - i);
      }

      const locked = resolvePublicStatusByToken(record.token, 'pin_client', { pin: '0000' });
      expect(locked.status).toBe('LOCKED');
      expect(locked.retryAfterMs).toBeGreaterThan(0);

      // Even correct PIN is blocked during lockout
      const blockedCorrect = resolvePublicStatusByToken(record.token, 'pin_client', { pin: '9421' });
      expect(blockedCorrect.status).toBe('LOCKED');
    });

    it('unlocks with valid passcode and enforces single-use burn-after-read maxViews quota', () => {
      const record = createOrRotateStatusToken('APP-BURN', mockApp, {
        accessPin: '4321',
        burnAfterRead: true,
      });

      const unlocked = resolvePublicStatusByToken(record.token, 'burn_client', { pin: '4321' });
      expect(unlocked.status).toBe('ACTIVE');
      expect(unlocked.pinProtected).toBe(true);
      expect(unlocked.integrityVerified).toBe(true);
      expect(unlocked.viewsRemaining).toBe(0);
      expect(unlocked.consumedOnThisView).toBe(true);

      // Second read is blocked because single-use quota is exhausted
      const secondRead = resolvePublicStatusByToken(record.token, 'burn_client', { pin: '4321' });
      expect(secondRead.status).toBe('VIEW_LIMIT_REACHED');

      // Exhausted token is excluded from active token queries
      expect(getActiveStatusTokenForApplication('APP-BURN')).toBeNull();

      const stored = JSON.parse(localStorage.getItem('civicbridge_app_status_qr_tokens'))[record.token];
      const summary = getStatusSecuritySummary(stored);
      expect(summary.accessCount).toBe(1);
      expect(summary.viewsRemaining).toBe(0);
      expect(summary.accessLog.some((e) => e.outcome === 'GRANTED')).toBe(true);
    });
  });
});
