import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createShareableProfile,
  getPublicSharedProfile,
  revokeSharedProfile,
  updateSharedProfileVisibility,
  getActiveShareForUser,
  getShareSecuritySummary,
  verifyShareIntegrity,
  generateShareToken,
  SHARE_EXPIRY_OPTIONS,
  MAX_PIN_ATTEMPTS,
} from './shareableProfileService';

describe('shareableProfileService (#455)', () => {
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

  const mockProfile = {
    fullName: 'Sunita Sharma',
    state: 'Rajasthan',
    district: 'Jaipur',
    category: 'General',
    occupation: 'Self-employed Artisan',
    savedServices: [{ id: 'srv-1', title: 'PMAY-G Rural Housing', category: 'Housing' }],
    applications: [{ serviceName: 'Solar Rooftop Subsidy', stage: 'Field Verification' }],
    readinessScore: 92,
    // Sensitive fields that MUST NEVER leak
    aadhaarNumber: '1234-5678-9012',
    privateNotes: 'Confidential case history',
    accessibilityPreferences: ['step_free_access', 'sign_language_support'],
    requestedAccommodations: ['large print'],
  };

  it('generates a hard-to-guess token and stores privacy snapshot', () => {
    const share = createShareableProfile('user-101', mockProfile, {
      expiry: SHARE_EXPIRY_OPTIONS.DAYS_7,
    });

    expect(share.token).toBeDefined();
    expect(share.token.length).toBeGreaterThanOrEqual(16);
    expect(share.userId).toBe('user-101');
    expect(share.revoked).toBe(false);
  });

  it('allows unauthenticated visitors to fetch active shared profile without private fields', () => {
    const share = createShareableProfile('user-101', mockProfile, {
      visibility: {
        showFullName: true,
        showLocation: true,
        showSavedServices: true,
      },
    });

    const res = getPublicSharedProfile(share.token);
    expect(res.status).toBe('ACTIVE');
    expect(res.readOnly).toBe(true);
    expect(res.profile.fullName).toBe('Sunita Sharma');
    expect(res.profile.location).toBe('Jaipur, Rajasthan');
    expect(res.profile.savedServices).toHaveLength(1);

    // Verify sensitive fields are not in the response
    expect(res.profile.aadhaarNumber).toBeUndefined();
    expect(res.profile.privateNotes).toBeUndefined();
    expect(res.profile.accessibilityPreferences).toBeUndefined();
    expect(res.profile.requestedAccommodations).toBeUndefined();
    expect(JSON.stringify(res.profile)).not.toContain('sign_language_support');
    expect(JSON.stringify(res.profile)).not.toContain('large print');
  });

  it('hides fields when visibility is toggled off', () => {
    const share = createShareableProfile('user-101', mockProfile, {
      visibility: {
        showFullName: false,
        showLocation: false,
        showSavedServices: false,
      },
    });

    const res = getPublicSharedProfile(share.token);
    expect(res.profile.fullName).toBe('Citizen Applicant');
    expect(res.profile.location).toBeNull();
    expect(res.profile.savedServices).toEqual([]);
  });

  it('prevents access when share link is revoked', () => {
    const share = createShareableProfile('user-101', mockProfile);
    const revokeSuccess = revokeSharedProfile(share.token);
    expect(revokeSuccess).toBe(true);

    const res = getPublicSharedProfile(share.token);
    expect(res.status).toBe('REVOKED');
    expect(res.profile).toBeUndefined();
    expect(res.error).toContain('revoked');
  });

  it('rejects expired share links', () => {
    const share = createShareableProfile('user-101', mockProfile);
    // Artificially expire the record
    share.expiresAt = Date.now() - 10000;
    const all = JSON.parse(localStorage.getItem('civicbridge_shareable_citizen_profiles'));
    all[share.token] = share;
    localStorage.setItem('civicbridge_shareable_citizen_profiles', JSON.stringify(all));

    const res = getPublicSharedProfile(share.token);
    expect(res.status).toBe('EXPIRED');
    expect(res.error).toContain('expired');
  });

  it('dynamically updates visibility settings for an existing link', () => {
    const share = createShareableProfile('user-101', mockProfile, {
      visibility: { showOccupation: false },
    });

    let res = getPublicSharedProfile(share.token);
    expect(res.profile.occupation).toBeNull();

    updateSharedProfileVisibility(share.token, { showOccupation: true });
    res = getPublicSharedProfile(share.token);
    expect(res.profile.occupation).toBe('Self-employed Artisan');
  });

  it('retrieves active share record for user', () => {
    createShareableProfile('user-xyz', mockProfile);
    const active = getActiveShareForUser('user-xyz');
    expect(active).not.toBeNull();
    expect(active.userId).toBe('user-xyz');
  });

  describe('Cryptographic Hardening, PIN Lockouts, Burn-After-Read & PII Scrubbing (#734)', () => {
    it('fails closed in generateShareToken when CSPRNG is unavailable instead of using Math.random', () => {
      vi.stubGlobal('crypto', undefined);
      expect(() => generateShareToken()).toThrow(/Cryptographically secure random generator is unavailable/i);
    });

    it('rejects Object.prototype property names passed as tokens', () => {
      expect(getPublicSharedProfile('toString').status).toBe('NOT_FOUND');
      expect(getPublicSharedProfile('constructor').status).toBe('NOT_FOUND');
      expect(getPublicSharedProfile('__proto__').status).toBe('NOT_FOUND');
    });

    it('scrubs Aadhaar, PAN, phone, email, and reference IDs inside shared free-text fields', () => {
      const share = createShareableProfile('user-pii', {
        fullName: 'Ravi Kumar (citizen@example.com)',
        state: 'Karnataka',
        district: 'Bengaluru',
        savedServices: [
          {
            id: 'SRV-98234710',
            title: 'Pension Aadhaar 1234 5678 9012 update',
            category: 'PAN ABCDE1234F Support',
          },
        ],
        applications: [
          {
            serviceName: 'Grievance GRV-2026-123456',
            stage: 'Call +91 9876543210 for slot',
          },
        ],
      });

      const res = getPublicSharedProfile(share.token);
      expect(res.status).toBe('ACTIVE');
      const serialized = JSON.stringify(res.profile);
      expect(serialized).not.toContain('citizen@example.com');
      expect(serialized).not.toContain('1234 5678 9012');
      expect(serialized).not.toContain('ABCDE1234F');
      expect(serialized).not.toContain('9876543210');
      expect(serialized).not.toContain('SRV-98234710');
      expect(serialized).not.toContain('GRV-2026-123456');
      expect(serialized).toContain('[REDACTED_EMAIL]');
      expect(serialized).toContain('[REDACTED_AADHAAR]');
      expect(serialized).toContain('[REDACTED_PAN]');
      expect(serialized).toContain('[REDACTED_PHONE]');
      expect(serialized).toContain('[REDACTED_REF]');
    });

    it('detects snapshot tampering using canonical SHA-256 verification', () => {
      const share = createShareableProfile('user-seal', mockProfile);
      expect(verifyShareIntegrity(share).valid).toBe(true);

      const all = JSON.parse(localStorage.getItem('civicbridge_shareable_citizen_profiles'));
      all[share.token].profileSnapshot.readinessScore = 100;
      localStorage.setItem('civicbridge_shareable_citizen_profiles', JSON.stringify(all));

      const tamperedRes = getPublicSharedProfile(share.token);
      expect(tamperedRes.status).toBe('TAMPERED');
      expect(tamperedRes.profile).toBeUndefined();
    });

    it('enforces salted SHA-256 passcode gating and brute-force lockout after invalid attempts', () => {
      const share = createShareableProfile('user-pin', mockProfile, {
        accessPin: '7492',
      });
      expect(share.passcodeHash).toBeTruthy();
      expect(share.passcodeHash).not.toContain('7492');

      const challenge = getPublicSharedProfile(share.token);
      expect(challenge.status).toBe('PIN_REQUIRED');
      expect(challenge.remainingAttempts).toBe(MAX_PIN_ATTEMPTS);

      for (let i = 1; i < MAX_PIN_ATTEMPTS; i += 1) {
        const wrong = getPublicSharedProfile(share.token, { pin: '0000' });
        expect(wrong.status).toBe('INVALID_PIN');
        expect(wrong.remainingAttempts).toBe(MAX_PIN_ATTEMPTS - i);
      }

      const locked = getPublicSharedProfile(share.token, { pin: '0000' });
      expect(locked.status).toBe('LOCKED');
      expect(locked.retryAfterMs).toBeGreaterThan(0);

      // Even the correct PIN is blocked while locked out
      const blockedCorrect = getPublicSharedProfile(share.token, { pin: '7492' });
      expect(blockedCorrect.status).toBe('LOCKED');
    });

    it('unlocks with valid passcode and enforces single-use burn-after-read maxViews quotas', () => {
      const share = createShareableProfile('user-burn', mockProfile, {
        accessPin: '8123',
        burnAfterRead: true,
      });

      const unlocked = getPublicSharedProfile(share.token, { pin: '8123' });
      expect(unlocked.status).toBe('ACTIVE');
      expect(unlocked.pinProtected).toBe(true);
      expect(unlocked.integrityVerified).toBe(true);
      expect(unlocked.viewsRemaining).toBe(0);
      expect(unlocked.consumedOnThisView).toBe(true);

      // Next read is blocked because single-use quota is exhausted
      const secondRead = getPublicSharedProfile(share.token, { pin: '8123' });
      expect(secondRead.status).toBe('VIEW_LIMIT_REACHED');

      // Exhausted link is excluded from getActiveShareForUser
      expect(getActiveShareForUser('user-burn')).toBeNull();

      const stored = JSON.parse(localStorage.getItem('civicbridge_shareable_citizen_profiles'))[share.token];
      const summary = getShareSecuritySummary(stored);
      expect(summary.accessCount).toBe(1);
      expect(summary.viewsRemaining).toBe(0);
      expect(summary.accessLog.some((e) => e.outcome === 'GRANTED')).toBe(true);
    });
  });
});
