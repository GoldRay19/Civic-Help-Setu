/**
 * Cryptographic Privacy Integrity Service (#696)
 *
 * Provides browser- and Node-compatible SHA-256 hashing, deterministic canonical
 * JSON serialization, hash-chained privacy audit logging, and export dossier
 * integrity verification without requiring a backend server or adding extra
 * localStorage keys.
 */

export const GENESIS_AUDIT_HASH = '0'.repeat(64);
export const MAX_AUDIT_LOG_ENTRIES = 100;

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const SHA256_INIT = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

const rotr = (value, bits) => (value >>> bits) | (value << (32 - bits));

const encodeUtf8 = (input) => new TextEncoder().encode(String(input ?? ''));

/**
 * Computes standard FIPS 180-4 SHA-256 lowercase hexadecimal digest synchronously
 * across browser and Node environments.
 *
 * @param {string} input
 * @returns {string} 64-character lowercase hex digest
 */
export function sha256Hex(input) {
  const bytes = encodeUtf8(input);
  const bitLen = bytes.length * 8;

  // Pad with 0x80 then zeros until length ≡ 56 (mod 64), plus 8-byte big-endian length.
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(paddedLength - 8, highBits, false);
  view.setUint32(paddedLength - 4, lowBits, false);

  const hash = new Uint32Array(SHA256_INIT);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return Array.from(hash, (word) => word.toString(16).padStart(8, '0')).join('');
}

/**
 * Recursively serializes values with sorted object keys so identical logical
 * JSON structures always yield the exact same string and SHA-256 digest.
 *
 * @param {*} value
 * @returns {string}
 */
export function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? 'null' : canonicalStringify(item))).join(',')}]`;
  }

  if (typeof value.toJSON === 'function') {
    return canonicalStringify(value.toJSON());
  }

  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined && typeof value[k] !== 'function')
    .sort();

  const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`);
  return `{${entries.join(',')}}`;
}

/**
 * Computes the canonical SHA-256 entry hash for a single privacy audit event.
 *
 * @param {Object} entry
 * @returns {string}
 */
export function computeAuditEntryHash(entry) {
  const payload = {
    sequence: entry.sequence,
    id: entry.id,
    timestamp: entry.timestamp,
    action: entry.action,
    actorId: entry.actorId,
    metadata: entry.metadata ?? {},
    prevHash: entry.prevHash,
  };
  return sha256Hex(canonicalStringify(payload));
}

/**
 * Creates a new tamper-evident audit entry linked to the latest chained entry
 * (logs are ordered newest-first).
 *
 * @param {Object} baseEntry
 * @param {Array<Object>} existingLogs
 * @returns {Object}
 */
export function createChainedAuditEntry(baseEntry, existingLogs = []) {
  const head = Array.isArray(existingLogs) && existingLogs.length > 0 ? existingLogs[0] : null;
  const hasChainedHead = Boolean(
    head && typeof head.entryHash === 'string' && Number.isInteger(head.sequence) && head.sequence >= 1
  );

  const sequence = hasChainedHead ? head.sequence + 1 : 1;
  const prevHash = hasChainedHead ? head.entryHash : GENESIS_AUDIT_HASH;

  const entry = {
    ...baseEntry,
    sequence,
    prevHash,
  };

  return {
    ...entry,
    entryHash: computeAuditEntryHash(entry),
  };
}

/**
 * Verifies cryptographic integrity across an array of newest-first privacy audit entries.
 * Gracefully identifies empty logs or pre-upgrade legacy unchained logs without throwing.
 *
 * @param {Array<Object>} logs
 * @returns {Object}
 */
export function verifyPrivacyAuditLogIntegrity(logs = []) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return {
      valid: true,
      status: 'EMPTY',
      totalEntries: 0,
      verifiedEntries: 0,
      legacyEntries: 0,
      tamperedIndices: [],
      issues: [],
      trimmedWindow: false,
    };
  }

  const chainedIndices = [];
  let legacyEntries = 0;
  for (let i = 0; i < logs.length; i += 1) {
    const entry = logs[i];
    if (entry && typeof entry.entryHash === 'string') {
      chainedIndices.push(i);
    } else {
      legacyEntries += 1;
    }
  }

  if (chainedIndices.length === 0) {
    return {
      valid: true,
      status: 'LEGACY_UNCHAINED',
      totalEntries: logs.length,
      verifiedEntries: 0,
      legacyEntries,
      tamperedIndices: [],
      issues: [],
      trimmedWindow: false,
    };
  }

  const issues = [];
  const tamperedSet = new Set();

  for (let i = 0; i < logs.length; i += 1) {
    const entry = logs[i];
    const hasHash = Boolean(entry && typeof entry.entryHash === 'string');

    // A missing hash *newer* than the oldest chained entry indicates tampering/injection.
    if (!hasHash) {
      const latestChainedIdx = chainedIndices[chainedIndices.length - 1];
      if (i < latestChainedIdx) {
        tamperedSet.add(i);
        issues.push({
          index: i,
          id: entry?.id || null,
          reason: 'MISSING_HASH',
          detail: 'Unchained entry inserted inside a hash-chained audit window.',
        });
      }
      continue;
    }

    if (!Number.isInteger(entry.sequence) || entry.sequence < 1 || typeof entry.prevHash !== 'string') {
      tamperedSet.add(i);
      issues.push({
        index: i,
        id: entry.id || null,
        reason: 'INVALID_CHAIN_FIELDS',
        detail: 'Missing or malformed sequence/prevHash field.',
      });
      continue;
    }

    const expectedHash = computeAuditEntryHash(entry);
    if (entry.entryHash !== expectedHash) {
      tamperedSet.add(i);
      issues.push({
        index: i,
        id: entry.id || null,
        reason: 'HASH_MISMATCH',
        detail: 'Audit entry contents do not match its SHA-256 entryHash.',
      });
    }

    const nextOlder = i + 1 < logs.length ? logs[i + 1] : null;
    if (nextOlder && typeof nextOlder.entryHash === 'string') {
      if (entry.prevHash !== nextOlder.entryHash || entry.sequence !== nextOlder.sequence + 1) {
        tamperedSet.add(i);
        issues.push({
          index: i,
          id: entry.id || null,
          reason: 'CHAIN_BREAK',
          detail: 'Audit entry prevHash or sequence does not link to the preceding entry.',
        });
      }
    } else if (i === chainedIndices[chainedIndices.length - 1]) {
      const isRollingWindowTail = logs.length >= MAX_AUDIT_LOG_ENTRIES;
      if (!isRollingWindowTail && (entry.sequence !== 1 || entry.prevHash !== GENESIS_AUDIT_HASH)) {
        tamperedSet.add(i);
        issues.push({
          index: i,
          id: entry.id || null,
          reason: 'MISSING_ANCESTOR',
          detail: 'Chain tail does not originate at sequence 1 genesis hash.',
        });
      }
    }
  }

  const tamperedIndices = Array.from(tamperedSet).sort((a, b) => a - b);
  const valid = tamperedIndices.length === 0;
  let status = 'VERIFIED';
  if (!valid) {
    status = 'TAMPERED';
  } else if (legacyEntries > 0) {
    status = 'PARTIAL_LEGACY';
  }

  return {
    valid,
    status,
    totalEntries: logs.length,
    verifiedEntries: chainedIndices.length - tamperedIndices.filter((idx) => chainedIndices.includes(idx)).length,
    legacyEntries,
    tamperedIndices,
    issues,
    trimmedWindow: logs.length >= MAX_AUDIT_LOG_ENTRIES,
  };
}

const stripIntegrityFields = (exportPayload) => {
  if (!exportPayload || typeof exportPayload !== 'object') return {};
  const meta =
    exportPayload.exportMetadata && typeof exportPayload.exportMetadata === 'object'
      ? { ...exportPayload.exportMetadata }
      : {};
  delete meta.integrityDigest;
  delete meta.hashAlgorithm;
  return {
    ...exportPayload,
    exportMetadata: meta,
  };
};

/**
 * Adds a canonical SHA-256 integrity seal to an exported personal data dossier.
 *
 * @param {Object} exportPayload
 * @returns {Object}
 */
export function signExportPayload(exportPayload) {
  const normalized = stripIntegrityFields(exportPayload);
  const integrityDigest = sha256Hex(canonicalStringify(normalized));
  return {
    ...normalized,
    exportMetadata: {
      ...normalized.exportMetadata,
      hashAlgorithm: 'SHA-256',
      integrityDigest,
    },
  };
}

/**
 * Validates whether an exported JSON data dossier matches its embedded SHA-256 digest.
 *
 * @param {Object} exportPayload
 * @returns {Object}
 */
export function verifyExportedDataIntegrity(exportPayload) {
  if (!exportPayload || typeof exportPayload !== 'object' || Array.isArray(exportPayload)) {
    return {
      valid: false,
      reason: 'INVALID_PAYLOAD',
      algorithm: 'SHA-256',
      expectedDigest: null,
      actualDigest: null,
    };
  }

  const expectedDigest = exportPayload.exportMetadata?.integrityDigest || null;
  if (typeof expectedDigest !== 'string' || !/^[a-f0-9]{64}$/i.test(expectedDigest)) {
    return {
      valid: false,
      reason: 'MISSING_DIGEST',
      algorithm: 'SHA-256',
      expectedDigest: null,
      actualDigest: null,
    };
  }

  const actualDigest = sha256Hex(canonicalStringify(stripIntegrityFields(exportPayload)));
  const valid = actualDigest === expectedDigest.toLowerCase();

  return {
    valid,
    reason: valid ? 'VERIFIED' : 'DIGEST_MISMATCH',
    algorithm: exportPayload.exportMetadata?.hashAlgorithm || 'SHA-256',
    expectedDigest: expectedDigest.toLowerCase(),
    actualDigest,
  };
}
