/**
 * applicationStatusQrService.js
 *
 * QR-based application status lookup service (#458, #739).
 * Generates privacy-safe, opaque, revocable lookup tokens for tracked applications
 * with CSPRNG entropy, recursive PII scrubbing, canonical SHA-256 snapshot seals,
 * optional salted SHA-256 passcode gates with brute-force lockout, and
 * configurable view-quota / burn-after-read limits.
 */

import qrcode from 'qrcode-generator';
import { sha256Hex, canonicalStringify } from './privacyIntegrityService.js';
import { minimizeForExternal } from '../utils/dataMinimization.js';

export const STATUS_QR_EXPIRY_OPTIONS = {
  DAYS_30: '30d',
  DAYS_7: '7d',
  HOURS_24: '24h',
  NEVER: 'never',
};

export const STATUS_QR_VIEW_PRESETS = {
  UNLIMITED: null,
  SINGLE_USE: 1,
  FIVE_VIEWS: 5,
  TEN_VIEWS: 10,
};

export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_ACCESS_LOG_ENTRIES = 25;
export const MIN_PASSCODE_LENGTH = 4;

const STORAGE_KEY = 'civicbridge_app_status_qr_tokens';
const RATE_LIMIT_KEY = 'civicbridge_app_status_qr_rate_limits';
const PASSCODE_DOMAIN = 'civicbridge:status-qr-pin:v1';

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

function scrubPublicData(applicationRecord = {}) {
  const safeMilestones = Array.isArray(applicationRecord.milestones)
    ? applicationRecord.milestones.map((m) => ({
        label: scrubText(m?.label || m?.title, 'Milestone'),
        status: scrubText(m?.status, 'PENDING'),
        completedAt: scrubText(m?.completedAt || m?.date, '') || null,
      }))
    : [
        { label: 'Application Submitted', status: 'COMPLETED', completedAt: 'Recorded' },
        { label: 'Under Review / Verification', status: 'IN_PROGRESS', completedAt: null },
        { label: 'Final Decision & Notice', status: 'PENDING', completedAt: null },
      ];

  return {
    serviceName: scrubText(
      applicationRecord.serviceName || applicationRecord.title,
      'Civic Service Application'
    ),
    department: scrubText(applicationRecord.department, 'Government Department'),
    stage: scrubText(applicationRecord.status || applicationRecord.stage, 'In Progress'),
    submissionDate: scrubText(applicationRecord.submissionDate || applicationRecord.appliedOn, '') || null,
    expectedResolution: scrubText(applicationRecord.expectedResolution, 'Within statutory SLA'),
    milestones: safeMilestones,
  };
}

function computeStatusSeal({ token, applicationId, createdAt, publicData }) {
  return sha256Hex(
    canonicalStringify({
      version: 1,
      token,
      applicationId,
      createdAt,
      publicData,
    })
  );
}

/**
 * Verifies canonical SHA-256 snapshot seal of a stored QR token record.
 */
export function verifyStatusTokenIntegrity(record) {
  if (!record || typeof record !== 'object' || typeof record.snapshotSeal !== 'string') {
    return { valid: false, reason: 'MISSING_SEAL' };
  }
  const expectedSeal = computeStatusSeal({
    token: record.token,
    applicationId: record.applicationId,
    createdAt: record.createdAt,
    publicData: record.publicData,
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
 * Generates an opaque, hard-to-guess token (32 hex characters / 128-bit entropy).
 */
export function generateStatusToken() {
  return bytesToHex(getRandomBytes(16));
}

/**
 * Loads all token registries from local storage.
 */
export function getAllStatusTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Saves all token registries to local storage.
 */
function saveAllStatusTokens(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates Unix timestamp for expiry option.
 */
export function calculateExpiryTime(option = STATUS_QR_EXPIRY_OPTIONS.DAYS_30) {
  const now = Date.now();
  switch (option) {
    case STATUS_QR_EXPIRY_OPTIONS.HOURS_24:
      return now + 24 * 60 * 60 * 1000;
    case STATUS_QR_EXPIRY_OPTIONS.DAYS_7:
      return now + 7 * 24 * 60 * 60 * 1000;
    case STATUS_QR_EXPIRY_OPTIONS.DAYS_30:
      return now + 30 * 24 * 60 * 60 * 1000;
    case STATUS_QR_EXPIRY_OPTIONS.NEVER:
    default:
      return null;
  }
}

/**
 * Registers or rotates a QR lookup token for an application record with
 * cryptographic snapshot seals, PII scrubbing, optional passcode, and view quotas.
 *
 * @param {string} applicationId - Unique ID of tracked application
 * @param {Object} applicationRecord - Application data to project
 * @param {Object} [options] - Passcode, expiry, maxViews, burnAfterRead
 * @returns {Object} Token metadata record
 */
export function createOrRotateStatusToken(applicationId, applicationRecord = {}, options = {}) {
  if (!applicationId) throw new Error('Application ID is required');

  const pin = normalizePasscode(options.accessPin ?? options.passcode);
  const maxViews = normalizeMaxViews(options);

  const all = getAllStatusTokens();
  const token = generateStatusToken();
  const createdAt = Date.now();
  const expiryOption = options.expiry || STATUS_QR_EXPIRY_OPTIONS.DAYS_30;
  const expiresAt = calculateExpiryTime(expiryOption);

  // Deactivate any existing active tokens for this application
  Object.keys(all).forEach((existingToken) => {
    if (
      Object.prototype.hasOwnProperty.call(all, existingToken) &&
      all[existingToken] &&
      all[existingToken].applicationId === applicationId &&
      !all[existingToken].revoked
    ) {
      all[existingToken].revoked = true;
      all[existingToken].revokedReason = 'ROTATED';
      all[existingToken].revokedAt = createdAt;
      appendAccessLog(all[existingToken], 'ROTATED');
    }
  });

  const publicData = scrubPublicData(applicationRecord);
  const snapshotSeal = computeStatusSeal({
    token,
    applicationId,
    createdAt,
    publicData,
  });

  let passcodeSalt = null;
  let passcodeHash = null;
  if (pin) {
    passcodeSalt = bytesToHex(getRandomBytes(16));
    passcodeHash = hashPasscode(pin, passcodeSalt);
  }

  const record = {
    token,
    applicationId,
    createdAt,
    expiresAt,
    expiryOption,
    revoked: false,
    publicData,
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

  all[token] = record;
  saveAllStatusTokens(all);

  return record;
}

/**
 * Revokes a status lookup token immediately.
 */
export function revokeStatusToken(token) {
  const all = getAllStatusTokens();
  if (Object.prototype.hasOwnProperty.call(all, token) && all[token]) {
    all[token].revoked = true;
    all[token].revokedReason = 'MANUAL_REVOCATION';
    all[token].revokedAt = Date.now();
    appendAccessLog(all[token], 'REVOKED_BY_OWNER');
    saveAllStatusTokens(all);
    return true;
  }
  return false;
}

/**
 * Checks client rate limits to prevent brute-force token harvesting.
 * Allows at most 10 requests per 60 seconds per client IP/session.
 */
export function checkLookupRateLimit(clientIdentifier = 'default_client') {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const registry = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 10;

    const clientHistory = (registry[clientIdentifier] || []).filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (clientHistory.length >= maxRequests) {
      return { allowed: false, retryAfterSeconds: Math.ceil((windowMs - (now - clientHistory[0])) / 1000) };
    }

    clientHistory.push(now);
    registry[clientIdentifier] = clientHistory;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(registry));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * Resolves a public, privacy-safe status view by opaque token.
 * Validates rate limit, existence, revocation, expiration, view quota,
 * canonical SHA-256 seal, and optional salted passcode.
 *
 * @param {string} token - Opaque QR token
 * @param {string} [clientIdentifier] - Rate limiter identifier
 * @param {Object} [options] - Passcode / PIN challenge
 * @returns {Object} Public status view result
 */
export function resolvePublicStatusByToken(token, clientIdentifier = 'web_client', options = {}) {
  if (!token || typeof token !== 'string') {
    return { status: 'INVALID', error: 'Invalid or missing lookup token' };
  }

  const rateCheck = checkLookupRateLimit(clientIdentifier);
  if (!rateCheck.allowed) {
    return {
      status: 'RATE_LIMITED',
      retryAfterSeconds: rateCheck.retryAfterSeconds,
      error: `Too many lookup attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
    };
  }

  const all = getAllStatusTokens();
  if (!Object.prototype.hasOwnProperty.call(all, token)) {
    return { status: 'NOT_FOUND', error: 'No active application found matching this QR code.' };
  }

  const record = all[token];
  if (!record || typeof record !== 'object') {
    return { status: 'NOT_FOUND', error: 'No active application found matching this QR code.' };
  }

  if (record.revoked) {
    appendAccessLog(record, 'REVOKED_BLOCKED');
    saveAllStatusTokens(all);
    return {
      status: 'REVOKED',
      error: 'This lookup QR code has been rotated or deactivated by the applicant for security.',
    };
  }

  const now = Date.now();
  if (record.expiresAt && now > record.expiresAt) {
    appendAccessLog(record, 'EXPIRED_BLOCKED');
    saveAllStatusTokens(all);
    return {
      status: 'EXPIRED',
      error: 'This lookup QR code has expired. Please check your account dashboard for an updated QR pass.',
    };
  }

  if (typeof record.maxViews === 'number' && (record.accessCount || 0) >= record.maxViews) {
    appendAccessLog(record, 'VIEW_LIMIT_BLOCKED');
    saveAllStatusTokens(all);
    return {
      status: 'VIEW_LIMIT_REACHED',
      maxViews: record.maxViews,
      accessCount: record.accessCount,
      viewsRemaining: 0,
      error: 'This status lookup QR pass has reached its maximum allowed view limit.',
    };
  }

  const integrity = verifyStatusTokenIntegrity(record);
  if (!integrity.valid) {
    appendAccessLog(record, 'TAMPER_DETECTED', { reason: integrity.reason });
    saveAllStatusTokens(all);
    return {
      status: 'TAMPERED',
      error: 'Cryptographic integrity check failed for this application status pass.',
    };
  }

  // Optional salted SHA-256 passcode gate + brute-force lockout
  if (record.passcodeHash && record.passcodeSalt) {
    if (record.lockedUntil && now < record.lockedUntil) {
      appendAccessLog(record, 'LOCKED_BLOCKED');
      saveAllStatusTokens(all);
      return {
        status: 'LOCKED',
        lockedUntil: record.lockedUntil,
        retryAfterMs: record.lockedUntil - now,
        error: 'Too many incorrect passcode attempts. Access to this QR pass is temporarily locked.',
      };
    }

    if (record.lockedUntil && now >= record.lockedUntil) {
      record.lockedUntil = null;
      record.failedAttempts = 0;
    }

    const suppliedPin = String(options?.pin ?? options?.passcode ?? '').trim();
    if (!suppliedPin) {
      saveAllStatusTokens(all);
      return {
        status: 'PIN_REQUIRED',
        remainingAttempts: Math.max(0, MAX_PIN_ATTEMPTS - (record.failedAttempts || 0)),
        expiresAt: record.expiresAt,
        createdAt: record.createdAt,
        error: 'A viewer passcode is required to unlock this application status pass.',
      };
    }

    const candidateHash = hashPasscode(suppliedPin, record.passcodeSalt);
    if (!constantTimeEqual(candidateHash, record.passcodeHash)) {
      record.failedAttempts = (record.failedAttempts || 0) + 1;

      if (record.failedAttempts >= MAX_PIN_ATTEMPTS) {
        record.lockedUntil = now + PIN_LOCKOUT_MS;
        appendAccessLog(record, 'LOCKED', { failedAttempts: record.failedAttempts });
        saveAllStatusTokens(all);
        return {
          status: 'LOCKED',
          lockedUntil: record.lockedUntil,
          retryAfterMs: PIN_LOCKOUT_MS,
          error: 'Too many incorrect passcode attempts. Access to this QR pass is temporarily locked.',
        };
      }

      const remainingAttempts = MAX_PIN_ATTEMPTS - record.failedAttempts;
      appendAccessLog(record, 'INVALID_PIN', { remainingAttempts });
      saveAllStatusTokens(all);
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
  saveAllStatusTokens(all);

  const cleanPublicData = scrubPublicData(record.publicData);

  return {
    status: 'ACTIVE',
    application: cleanPublicData,
    expiresAt: record.expiresAt,
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
 * Returns owner-facing security summary for a QR status pass.
 */
export function getStatusSecuritySummary(record) {
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
    integrityVerified: verifyStatusTokenIntegrity(record).valid,
    integrityFingerprint:
      typeof record.snapshotSeal === 'string' ? record.snapshotSeal.slice(0, 12) : null,
    accessLog: Array.isArray(record.accessLog) ? record.accessLog : [],
  };
}

/**
 * Finds the latest active (non-revoked, non-expired, quota-remaining) status token for an application.
 */
export function getActiveStatusTokenForApplication(applicationId) {
  if (!applicationId) return null;
  const all = getAllStatusTokens();
  const records = Object.values(all)
    .filter((r) => r && r.applicationId === applicationId && !r.revoked)
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

/**
 * Generates the SVG path for the QR code payload.
 */
export function buildStatusQrPath(lookupUrl) {
  if (!lookupUrl || typeof lookupUrl !== 'string') {
    throw new Error('Valid lookup URL is required');
  }

  const qr = qrcode(0, 'M');
  qr.addData(lookupUrl);
  qr.make();

  const count = qr.getModuleCount();
  const cells = [];
  const pad = 4;

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        cells.push(`M${c + pad},${r + pad}h1v1h-1z`);
      }
    }
  }

  return {
    path: cells.join(''),
    size: count + pad * 2,
  };
}
