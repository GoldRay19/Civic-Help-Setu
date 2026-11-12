/**
 * shareableProfileService.js
 *
 * Privacy-controlled, integrity-sealed shareable citizen profile service (#455, #734).
 * Enables citizens to generate revocable, privacy-safe, read-only share links
 * with field-level visibility controls, expiry periods, CSPRNG tokens,
 * recursive PII scrubbing, optional salted SHA-256 PIN gates with brute-force
 * lockouts, configurable max-view / burn-after-read quotas, and canonical SHA-256
 * snapshot integrity verification.
 */

import { sha256Hex, canonicalStringify } from './privacyIntegrityService.js';
import { minimizeForExternal } from '../utils/dataMinimization.js';

export const SHARE_EXPIRY_OPTIONS = {
  HOURS_24: '24h',
  DAYS_7: '7d',
  DAYS_30: '30d',
  NEVER: 'never',
};

export const SHARE_VIEW_PRESETS = {
  UNLIMITED: null,
  SINGLE_USE: 1,
  FIVE_VIEWS: 5,
  TEN_VIEWS: 10,
};

export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_ACCESS_LOG_ENTRIES = 25;
export const MIN_PASSCODE_LENGTH = 4;

const STORAGE_KEY = 'civicbridge_shareable_citizen_profiles';
const PASSCODE_DOMAIN = 'civicbridge:share-pin:v1';

/**
 * Generates cryptographically strong random bytes using Web Crypto.
 * Fails closed when no CSPRNG is available rather than falling back to Math.random().
 */
function getRandomBytes(byteLength) {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('Cryptographically secure random generator is unavailable.');
  }
  const bytes = new Uint8Array(byteLength);
  cryptoObj.getRandomValues(bytes);
  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison for fixed-length SHA-256 hex digests.
 */
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Scrubs free-text fields for accidental Aadhaar, PAN, phone, email, secret keys,
 * and reference IDs before storage or public projection.
 */
function scrubText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return minimizeForExternal(trimmed);
}

function scrubSnapshot(rawProfile = {}) {
  const savedServices = Array.isArray(rawProfile.savedServices)
    ? rawProfile.savedServices.map((s) => ({
        id: scrubText(String(s?.id ?? ''), ''),
        title: scrubText(s?.title || s?.name, 'Civic Service'),
        category: scrubText(s?.category || s?.department, ''),
      }))
    : [];

  const applicationMilestones = Array.isArray(rawProfile.applications)
    ? rawProfile.applications.map((a) => ({
        serviceName: scrubText(a?.serviceName || a?.title, 'Civic Service'),
        stage: scrubText(a?.stage || a?.status, 'In Progress'),
        updatedAt: scrubText(a?.updatedAt || a?.date, '') || null,
      }))
    : [];

  return {
    fullName: scrubText(rawProfile.fullName || rawProfile.name, 'Citizen Applicant'),
    state: scrubText(rawProfile.state || rawProfile.location, ''),
    district: scrubText(rawProfile.district, ''),
    category: scrubText(rawProfile.category || rawProfile.socialCategory, ''),
    occupation: scrubText(rawProfile.occupation, ''),
    savedServices,
    applicationMilestones,
    readinessScore:
      typeof rawProfile.readinessScore === 'number' && Number.isFinite(rawProfile.readinessScore)
        ? Math.min(100, Math.max(0, rawProfile.readinessScore))
        : 85,
  };
}

function computeSnapshotSeal({ token, userId, createdAt, profileSnapshot }) {
  return sha256Hex(
    canonicalStringify({
      version: 1,
      token,
      userId,
      createdAt,
      profileSnapshot,
    })
  );
}

/**
 * Verifies canonical SHA-256 snapshot seal of a stored share record.
 */
export function verifyShareIntegrity(record) {
  if (!record || typeof record !== 'object' || typeof record.snapshotSeal !== 'string') {
    return { valid: false, reason: 'MISSING_SEAL' };
  }
  const expectedSeal = computeSnapshotSeal({
    token: record.token,
    userId: record.userId,
    createdAt: record.createdAt,
    profileSnapshot: record.profileSnapshot,
  });
  return {
    valid: constantTimeEqual(record.snapshotSeal, expectedSeal),
    reason: constantTimeEqual(record.snapshotSeal, expectedSeal) ? null : 'SEAL_MISMATCH',
    expectedSeal,
  };
}

function hashPasscode(pin, salt) {
  return sha256Hex(`${PASSCODE_DOMAIN}:${salt}:${pin}`);
}

function normalizePasscode(rawPin) {
  if (rawPin === undefined || rawPin === null) return null;
  const trimmed = String(rawPin).trim();
  if (!trimmed) return null;
  if (trimmed.length < MIN_PASSCODE_LENGTH) {
    throw new Error(`Passcode must be at least ${MIN_PASSCODE_LENGTH} characters long.`);
  }
  return trimmed;
}

function normalizeMaxViews(options = {}) {
  if (options.burnAfterRead === true) return 1;
  if (options.maxViews === undefined || options.maxViews === null || options.maxViews === '') {
    return null;
  }
  const parsed = Number(options.maxViews);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('maxViews must be a positive integer.');
  }
  return parsed;
}

function appendAccessLog(record, outcome, details = {}) {
  const existing = Array.isArray(record.accessLog) ? record.accessLog : [];
  const nextEntry = {
    outcome,
    timestamp: Date.now(),
    ...details,
  };
  record.accessLog = [...existing, nextEntry].slice(-MAX_ACCESS_LOG_ENTRIES);
}

/**
 * Calculates Unix timestamp for expiry option.
 */
export function calculateExpiryTime(option = SHARE_EXPIRY_OPTIONS.DAYS_7) {
  const now = Date.now();
  switch (option) {
    case SHARE_EXPIRY_OPTIONS.HOURS_24:
      return now + 24 * 60 * 60 * 1000;
    case SHARE_EXPIRY_OPTIONS.DAYS_7:
      return now + 7 * 24 * 60 * 60 * 1000;
    case SHARE_EXPIRY_OPTIONS.DAYS_30:
      return now + 30 * 24 * 60 * 60 * 1000;
    case SHARE_EXPIRY_OPTIONS.NEVER:
    default:
      return null;
  }
}

/**
 * Generates a cryptographically secure 32-character hex token (128-bit entropy).
 */
export function generateShareToken() {
  return bytesToHex(getRandomBytes(16));
}

/**
 * Loads all shareable profile entries from storage.
 */
export function getAllSharedProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllSharedProfiles(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a privacy-controlled, PII-scrubbed, SHA-256 sealed shareable profile record.
 *
 * @param {string} userId - ID or username of the owner
 * @param {Object} rawProfile - Full citizen profile
 * @param {Object} options - Visibility, expiry, accessPin/passcode, maxViews, burnAfterRead
 * @returns {Object} Created share record
 */
export function createShareableProfile(userId, rawProfile = {}, options = {}) {
  if (!userId) throw new Error('User ID is required to create a shareable profile');

  const pin = normalizePasscode(options.accessPin ?? options.passcode);
  const maxViews = normalizeMaxViews(options);

  const all = getAllSharedProfiles();
  const token = generateShareToken();
  const createdAt = Date.now();
  const expiryOption = options.expiry || SHARE_EXPIRY_OPTIONS.DAYS_7;
  const expiresAt = calculateExpiryTime(expiryOption);

  const visibility = {
    showFullName: options.visibility?.showFullName ?? true,
    showLocation: options.visibility?.showLocation ?? true,
    showCategory: options.visibility?.showCategory ?? true,
    showOccupation: options.visibility?.showOccupation ?? false,
    showSavedServices: options.visibility?.showSavedServices ?? true,
    showApplicationMilestones: options.visibility?.showApplicationMilestones ?? true,
    showReadinessScore: options.visibility?.showReadinessScore ?? true,
  };

  const profileSnapshot = scrubSnapshot(rawProfile);
  const snapshotSeal = computeSnapshotSeal({
    token,
    userId,
    createdAt,
    profileSnapshot,
  });

  let passcodeSalt = null;
  let passcodeHash = null;
  if (pin) {
    passcodeSalt = bytesToHex(getRandomBytes(16));
    passcodeHash = hashPasscode(pin, passcodeSalt);
  }

  const shareRecord = {
    token,
    userId,
    createdAt,
    expiresAt,
    expiryOption,
    revoked: false,
    visibility,
    profileSnapshot,
    snapshotSeal,
    passcodeSalt,
    passcodeHash,
    failedAttempts: 0,
    lockedUntil: null,
    maxViews,
    accessCount: 0,
    lastAccessedAt: null,
    accessLog: [],
  };

  all[token] = shareRecord;
  saveAllSharedProfiles(all);

  return shareRecord;
}

/**
 * Retrieves the public, privacy-filtered view of a shared profile by token.
 * Validates existence, revocation, expiry, view quota, canonical SHA-256 seal,
 * and optional salted passcode with brute-force lockout protection.
 *
 * @param {string} token
 * @param {Object} [options]
 * @param {string} [options.pin]
 * @param {string} [options.passcode]
 * @returns {Object} Result status and sanitized public profile when ACTIVE
 */
export function getPublicSharedProfile(token, options = {}) {
  if (!token || typeof token !== 'string') {
    return { status: 'NOT_FOUND', error: 'Invalid share token' };
  }

  const all = getAllSharedProfiles();
  if (!Object.prototype.hasOwnProperty.call(all, token)) {
    return { status: 'NOT_FOUND', error: 'Share link does not exist' };
  }

  const record = all[token];
  if (!record || typeof record !== 'object') {
    return { status: 'NOT_FOUND', error: 'Share link does not exist' };
  }

  if (record.revoked) {
    appendAccessLog(record, 'REVOKED_BLOCKED');
    saveAllSharedProfiles(all);
    return { status: 'REVOKED', error: 'This profile share link has been revoked by the owner' };
  }

  const now = Date.now();
  if (record.expiresAt && now > record.expiresAt) {
    appendAccessLog(record, 'EXPIRED_BLOCKED');
    saveAllSharedProfiles(all);
    return { status: 'EXPIRED', error: 'This profile share link has expired' };
  }

  if (typeof record.maxViews === 'number' && (record.accessCount || 0) >= record.maxViews) {
    appendAccessLog(record, 'VIEW_LIMIT_BLOCKED');
    saveAllSharedProfiles(all);
    return {
      status: 'VIEW_LIMIT_REACHED',
      maxViews: record.maxViews,
      accessCount: record.accessCount,
      viewsRemaining: 0,
      error: 'This shared profile link has reached its maximum allowed view limit.',
    };
  }

  const integrity = verifyShareIntegrity(record);
  if (!integrity.valid) {
    appendAccessLog(record, 'TAMPER_DETECTED', { reason: integrity.reason });
    saveAllSharedProfiles(all);
    return {
      status: 'TAMPERED',
      error: 'Cryptographic integrity check failed for this shared profile snapshot.',
    };
  }

  // Optional salted SHA-256 passcode gate + brute-force lockout
  if (record.passcodeHash && record.passcodeSalt) {
    if (record.lockedUntil && now < record.lockedUntil) {
      appendAccessLog(record, 'LOCKED_BLOCKED');
      saveAllSharedProfiles(all);
      return {
        status: 'LOCKED',
        lockedUntil: record.lockedUntil,
        retryAfterMs: record.lockedUntil - now,
        error: 'Too many incorrect passcode attempts. Access is temporarily locked.',
      };
    }

    if (record.lockedUntil && now >= record.lockedUntil) {
      record.lockedUntil = null;
      record.failedAttempts = 0;
    }

    const suppliedPin = String(options?.pin ?? options?.passcode ?? '').trim();
    if (!suppliedPin) {
      saveAllSharedProfiles(all);
      return {
        status: 'PIN_REQUIRED',
        remainingAttempts: Math.max(0, MAX_PIN_ATTEMPTS - (record.failedAttempts || 0)),
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
        error: 'A viewer passcode is required to unlock this shared profile.',
      };
    }

    const candidateHash = hashPasscode(suppliedPin, record.passcodeSalt);
    if (!constantTimeEqual(candidateHash, record.passcodeHash)) {
      record.failedAttempts = (record.failedAttempts || 0) + 1;

      if (record.failedAttempts >= MAX_PIN_ATTEMPTS) {
        record.lockedUntil = now + PIN_LOCKOUT_MS;
        appendAccessLog(record, 'LOCKED', { failedAttempts: record.failedAttempts });
        saveAllSharedProfiles(all);
        return {
          status: 'LOCKED',
          lockedUntil: record.lockedUntil,
          retryAfterMs: PIN_LOCKOUT_MS,
          error: 'Too many incorrect passcode attempts. Access is temporarily locked.',
        };
      }

      const remainingAttempts = MAX_PIN_ATTEMPTS - record.failedAttempts;
      appendAccessLog(record, 'INVALID_PIN', { remainingAttempts });
      saveAllSharedProfiles(all);
      return {
        status: 'INVALID_PIN',
        remainingAttempts,
        error: `Incorrect passcode. ${remainingAttempts} attempt(s) remaining before temporary lockout.`,
      };
    }

    record.failedAttempts = 0;
    record.lockedUntil = null;
  }

  // Authorized read: increment view counter & audit trail
  record.accessCount = (record.accessCount || 0) + 1;
  record.lastAccessedAt = now;
  const viewsRemaining =
    typeof record.maxViews === 'number' ? Math.max(0, record.maxViews - record.accessCount) : null;

  appendAccessLog(record, 'GRANTED', { viewNumber: record.accessCount });
  all[token] = record;
  saveAllSharedProfiles(all);

  // Strip and project sanitized fields strictly based on visibility settings
  const vis = record.visibility || {};
  const snap = scrubSnapshot({
    ...record.profileSnapshot,
    applications: record.profileSnapshot?.applicationMilestones,
  });

  const publicData = {
    fullName: vis.showFullName ? snap.fullName : 'Citizen Applicant',
    location: vis.showLocation
      ? [snap.district, snap.state].filter(Boolean).join(', ')
      : null,
    category: vis.showCategory ? snap.category : null,
    occupation: vis.showOccupation ? snap.occupation : null,
    savedServices: vis.showSavedServices ? snap.savedServices : [],
    applicationMilestones: vis.showApplicationMilestones ? snap.applicationMilestones : [],
    readinessScore: vis.showReadinessScore ? snap.readinessScore : null,
  };

  return {
    status: 'ACTIVE',
    profile: publicData,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
    readOnly: true,
    maxViews: record.maxViews ?? null,
    accessCount: record.accessCount,
    viewsRemaining,
    consumedOnThisView: viewsRemaining === 0,
    pinProtected: Boolean(record.passcodeHash),
    integrityVerified: true,
    integrityDigest: record.snapshotSeal,
  };
}

/**
 * Revokes an existing share link.
 */
export function revokeSharedProfile(token) {
  const all = getAllSharedProfiles();
  if (Object.prototype.hasOwnProperty.call(all, token) && all[token]) {
    all[token].revoked = true;
    all[token].revokedAt = Date.now();
    appendAccessLog(all[token], 'REVOKED_BY_OWNER');
    saveAllSharedProfiles(all);
    return true;
  }
  return false;
}

/**
 * Updates field visibility on an active share link.
 */
export function updateSharedProfileVisibility(token, newVisibility = {}) {
  const all = getAllSharedProfiles();
  if (!Object.prototype.hasOwnProperty.call(all, token) || !all[token]) return null;

  all[token].visibility = {
    ...all[token].visibility,
    ...newVisibility,
  };
  saveAllSharedProfiles(all);
  return all[token];
}

/**
 * Returns owner-facing security summary for a share record.
 */
export function getShareSecuritySummary(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const now = Date.now();
  const locked = Boolean(record.lockedUntil && now < record.lockedUntil);
  const viewsRemaining =
    typeof record.maxViews === 'number'
      ? Math.max(0, record.maxViews - (record.accessCount || 0))
      : null;

  return {
    pinProtected: Boolean(record.passcodeHash),
    maxViews: record.maxViews ?? null,
    accessCount: record.accessCount || 0,
    viewsRemaining,
    locked,
    lockedUntil: locked ? record.lockedUntil : null,
    integrityVerified: verifyShareIntegrity(record).valid,
    integrityFingerprint:
      typeof record.snapshotSeal === 'string' ? record.snapshotSeal.slice(0, 12) : null,
    accessLog: Array.isArray(record.accessLog) ? record.accessLog : [],
  };
}

/**
 * Finds the latest active (non-revoked, non-expired, quota-remaining) share record for a given user.
 */
export function getActiveShareForUser(userId) {
  if (!userId) return null;
  const all = getAllSharedProfiles();
  const records = Object.values(all)
    .filter((r) => r && r.userId === userId && !r.revoked)
    .sort((a, b) => b.createdAt - a.createdAt);

  const now = Date.now();
  for (const r of records) {
    const withinExpiry = !r.expiresAt || now <= r.expiresAt;
    const withinViews = typeof r.maxViews !== 'number' || (r.accessCount || 0) < r.maxViews;
    if (withinExpiry && withinViews) {
      return r;
    }
  }
  return null;
}
