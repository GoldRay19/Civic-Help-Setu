/**
 * Civic Submission Receipt Service
 *
 * Generates verified submission acknowledgment receipts, deterministic
 * digital verification seals, structured receipt summaries, offline-compatible
 * text and JSON exports, scannable SVG QR matrices, and cryptographic SHA-256
 * tamper-verification for tracked civic applications (#742).
 */

import qrcode from 'qrcode-generator';
import { formatDisplayDate } from './trackingService';
import { sha256Hex, canonicalStringify } from './privacyIntegrityService.js';
import { minimizeForExternal } from '../utils/dataMinimization.js';

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
 * Normalizes receipt facts into a canonical structure for deterministic SHA-256 sealing.
 */
function getReceiptCanonicalPayload(data = {}) {
  const appId = String(data.applicationId || data.id || '');
  const recNum = data.receiptNumber || (appId ? `REC-${appId.toUpperCase()}` : 'REC-N/A');

  const rawStages = Array.isArray(data.stages) ? data.stages : [];
  const normalizedStages = rawStages.map((st, idx) => ({
    step: Number(st.step ?? idx + 1),
    title: scrubText(st.title || st.name, `Stage ${idx + 1}`),
    status: scrubText(
      st.status,
      st.completed ? 'COMPLETED' : st.current ? 'IN PROGRESS' : 'PENDING'
    ),
  }));

  return {
    version: 1,
    receiptNumber: recNum,
    applicationId: appId,
    serviceName: scrubText(data.serviceName, 'Civic Public Service'),
    applicantName: scrubText(data.applicantName, 'Citizen Applicant'),
    submissionDate: scrubText(data.submissionDate || data.appliedDate, 'Not Available'),
    targetCompletionDate: scrubText(
      data.targetCompletionDate || data.estimatedCompletion,
      'Under Department Scrutiny'
    ),
    status: scrubText(data.status, 'in-progress'),
    stages: normalizedStages,
  };
}

/**
 * Computes canonical FIPS 180-4 SHA-256 digest over receipt facts.
 *
 * @param {Object} receiptData
 * @returns {string} 64-character lowercase hex digest
 */
export const generateReceiptSha256Digest = (receiptData) => {
  if (!receiptData || (!receiptData.id && !receiptData.applicationId)) {
    return '0'.repeat(64);
  }
  const canonical = getReceiptCanonicalPayload(receiptData);
  return sha256Hex(canonicalStringify(canonical));
};

/**
 * Generates a deterministic alphanumeric verification seal for a tracked application.
 * Uses a robust polynomial rolling hash over key submission fields for backward compatibility.
 *
 * @param {Object} application
 * @returns {string} Formatted verification seal (e.g., CB-SEAL-XXXX-XXXX)
 */
export const generateReceiptVerificationHash = (application) => {
  if (!application || !application.id) return 'CB-SEAL-0000-0000';

  const payload = [
    String(application.id || ''),
    String(application.serviceName || ''),
    String(application.applicantName || 'Citizen'),
    String(application.appliedDate || ''),
    'CIVIC_BRIDGE_STATUTORY_ACK',
  ].join('|');

  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  // Generate deterministic 8-character hex parts
  const unsigned = hash >>> 0;
  const part1 = (unsigned & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const part2 = ((unsigned >>> 16) & 0xffff).toString(16).toUpperCase().padStart(4, '0');

  return `CB-SEAL-${part1}-${part2}`;
};

/**
 * Builds a standardized, PII-scrubbed receipt data structure for an application
 * with dual verification seals (short legacy seal and canonical SHA-256 digest).
 *
 * @param {Object} application
 * @returns {Object} Structured receipt data
 */
export const buildReceiptSummary = (application) => {
  if (!application) return null;

  const receiptNumber = `REC-${String(application.id || 'N/A').toUpperCase()}`;
  const verificationSeal = generateReceiptVerificationHash(application);

  const rawApplied = application.submissionDate || application.appliedDate;
  const formattedAppliedDate =
    formatDisplayDate(rawApplied) || rawApplied || 'Not Available';

  const rawCompletion =
    application.targetCompletionDate || application.estimatedCompletion;
  const formattedCompletionDate =
    formatDisplayDate(rawCompletion) || rawCompletion || 'Under Department Scrutiny';

  const cleanServiceName = scrubText(application.serviceName, 'Civic Public Service');
  const cleanApplicantName = scrubText(application.applicantName, 'Citizen Applicant');
  const cleanStatus = scrubText(application.status, 'in-progress');

  const stagesSummary = Array.isArray(application.stages)
    ? application.stages.map((stage, idx) => ({
        step: Number(stage.step ?? idx + 1),
        title: scrubText(stage.title || stage.name, `Stage ${idx + 1}`),
        status: scrubText(
          stage.status,
          stage.completed ? 'COMPLETED' : stage.current ? 'IN PROGRESS' : 'PENDING'
        ),
        date: scrubText(stage.date, stage.completed ? 'Completed' : 'Pending'),
      }))
    : [];

  const intermediate = {
    receiptNumber,
    applicationId: application.id,
    serviceName: cleanServiceName,
    applicantName: cleanApplicantName,
    submissionDate: formattedAppliedDate,
    targetCompletionDate: formattedCompletionDate,
    status: cleanStatus,
    stages: stagesSummary,
  };

  const sha256Digest = generateReceiptSha256Digest(intermediate);

  return {
    ...intermediate,
    verificationSeal,
    sha256Digest,
    issuedAt: new Date().toISOString(),
    statutoryNotice:
      'Official acknowledgment slip under State Right to Public Services Charter. Quote reference number for all statutory appellate escalations or RTIs.',
  };
};

/**
 * Formats receipt summary into an ink-friendly, SMS/WhatsApp ready plain-text slip
 * embedding both verification seal and canonical SHA-256 digest.
 *
 * @param {Object} receipt
 * @returns {string} Plain-text formatted slip
 */
export const formatReceiptAsPlainText = (receipt) => {
  if (!receipt) return '';

  const border = '==================================================';
  const subBorder = '--------------------------------------------------';

  const lines = [
    border,
    '           CIVIC-HELP-SETU PORTAL                 ',
    '       OFFICIAL SUBMISSION ACKNOWLEDGMENT         ',
    border,
    `Receipt No        : ${receipt.receiptNumber}`,
    `Reference ID      : ${receipt.applicationId}`,
    `Digital Seal      : ${receipt.verificationSeal}`,
    `SHA-256 Digest   : ${receipt.sha256Digest || generateReceiptSha256Digest(receipt)}`,
    subBorder,
    `Service Requested : ${receipt.serviceName}`,
    `Applicant Name    : ${receipt.applicantName}`,
    `Filing Date       : ${receipt.submissionDate}`,
    `Target Completion : ${receipt.targetCompletionDate}`,
    `Current Status    : ${String(receipt.status).toUpperCase()}`,
    subBorder,
    'APPLICATION PROCESSING TIMELINE:',
  ];

  if (receipt.stages && receipt.stages.length > 0) {
    receipt.stages.forEach((st) => {
      lines.push(`  [${st.status}] Stage ${st.step}: ${st.title}`);
    });
  } else {
    lines.push('  [PENDING] Departmental Intake & Document Verification');
  }

  lines.push(
    subBorder,
    'STATUTORY NOTICE:',
    receipt.statutoryNotice,
    border,
    'Retain this acknowledgment slip for all official communications.',
    border
  );

  return lines.join('\n');
};

/**
 * Verifies cryptographic integrity of a receipt object or payload.
 *
 * @param {Object} receipt
 * @returns {Object} Verification verdict
 */
export const verifyReceiptIntegrity = (receipt) => {
  if (!receipt || typeof receipt !== 'object') {
    return {
      valid: false,
      status: 'INVALID',
      reason: 'Missing or malformed receipt data.',
    };
  }

  const expectedDigest = generateReceiptSha256Digest(receipt);
  const actualDigest = receipt.sha256Digest || receipt.digest;

  if (actualDigest && typeof actualDigest === 'string') {
    const isDigestMatch = constantTimeEqual(
      actualDigest.trim().toLowerCase(),
      expectedDigest.toLowerCase()
    );
    if (!isDigestMatch) {
      return {
        valid: false,
        status: 'TAMPERED',
        reason: 'Cryptographic SHA-256 seal mismatch: receipt data has been modified.',
        expectedDigest,
        actualDigest,
      };
    }
    return {
      valid: true,
      status: 'VALID',
      digest: expectedDigest,
      summary: receipt,
    };
  }

  // Fallback to legacy verification seal if SHA-256 digest is absent
  const expectedSeal = generateReceiptVerificationHash(receipt);
  const actualSeal = receipt.verificationSeal;
  if (actualSeal && typeof actualSeal === 'string') {
    const isSealMatch = actualSeal.trim().toUpperCase() === expectedSeal.toUpperCase();
    if (!isSealMatch) {
      return {
        valid: false,
        status: 'TAMPERED',
        reason: 'Verification seal mismatch: application metadata does not match issuance record.',
        expectedSeal,
        actualSeal,
      };
    }
    return {
      valid: true,
      status: 'LEGACY_VALID',
      verificationSeal: expectedSeal,
      summary: receipt,
    };
  }

  return {
    valid: false,
    status: 'INVALID',
    reason: 'Receipt contains no verifiable digital seal or SHA-256 digest.',
  };
};

/**
 * Parses either an ASCII plain-text slip or a JSON export dossier, and
 * verifies its authenticity against cryptographic seals.
 *
 * @param {string} rawText
 * @returns {Object} Verdict and parsed data
 */
export const parseAndVerifyReceiptText = (rawText) => {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return {
      valid: false,
      status: 'INVALID',
      reason: 'Empty receipt input.',
    };
  }

  const trimmed = rawText.trim();

  // 1. Attempt JSON parsing
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const target = parsed.receipt || parsed;
      return verifyReceiptIntegrity(target);
    } catch {
      // Fall through to text slip parser
    }
  }

  // 2. Parse ASCII receipt slip format
  const extractField = (pattern) => {
    const match = trimmed.match(pattern);
    return match && match[1] ? match[1].trim() : null;
  };

  const receiptNumber = extractField(/Receipt No\s*:\s*([^\n\r]+)/i);
  const applicationId = extractField(/Reference ID\s*:\s*([^\n\r]+)/i);
  const verificationSeal = extractField(/Digital Seal\s*:\s*([^\n\r]+)/i);
  const sha256Digest = extractField(/SHA-256 Digest\s*:\s*([^\n\r]+)/i);
  const serviceName = extractField(/Service Requested\s*:\s*([^\n\r]+)/i);
  const applicantName = extractField(/Applicant Name\s*:\s*([^\n\r]+)/i);
  const submissionDate = extractField(/Filing Date\s*:\s*([^\n\r]+)/i);
  const targetCompletionDate = extractField(/Target Completion\s*:\s*([^\n\r]+)/i);
  const status = extractField(/Current Status\s*:\s*([^\n\r]+)/i);

  if (!applicationId && !receiptNumber) {
    return {
      valid: false,
      status: 'INVALID',
      reason: 'Unrecognized receipt slip format. Could not locate reference ID.',
    };
  }

  // Extract timeline stages: [STATUS] Stage X: Title
  const stageMatches = [...trimmed.matchAll(/\[(COMPLETED|IN PROGRESS|PENDING)\]\s*Stage\s*(\d+)\s*:\s*([^\n\r]+)/gi)];
  const stages = stageMatches.map((m) => ({
    status: m[1].toUpperCase(),
    step: Number(m[2]),
    title: m[3].trim(),
    date: m[1].toUpperCase() === 'COMPLETED' ? 'Completed' : 'Pending',
  }));

  const parsedReceipt = {
    receiptNumber: receiptNumber || `REC-${String(applicationId).toUpperCase()}`,
    applicationId: applicationId || receiptNumber.replace(/^REC-/i, ''),
    serviceName: serviceName || 'Civic Public Service',
    applicantName: applicantName || 'Citizen Applicant',
    submissionDate: submissionDate || 'Not Available',
    targetCompletionDate: targetCompletionDate || 'Under Department Scrutiny',
    status: (status || 'in-progress').toLowerCase(),
    stages,
    verificationSeal,
    sha256Digest,
  };

  const verdict = verifyReceiptIntegrity(parsedReceipt);
  return {
    ...verdict,
    parsedReceipt,
  };
};

/**
 * Builds an SVG path matrix for receipt verification QR codes.
 *
 * @param {Object|string} verificationPayload
 * @returns {{ path: string, size: number }}
 */
export const buildReceiptQrPath = (verificationPayload) => {
  const payloadStr =
    typeof verificationPayload === 'object'
      ? JSON.stringify(verificationPayload)
      : String(verificationPayload || '');

  const qr = qrcode(0, 'M');
  qr.addData(payloadStr);
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
};

/**
 * Exports signed receipt dossier JSON structure.
 *
 * @param {Object} application
 * @returns {Object} Exportable JSON dossier
 */
export const exportSignedReceiptDossier = (application) => {
  const summary = buildReceiptSummary(application);
  if (!summary) return null;

  return {
    version: 1,
    exportType: 'CIVIC_STATUTORY_SUBMISSION_RECEIPT',
    issuedAt: summary.issuedAt,
    receipt: summary,
    signatureMetadata: {
      algorithm: 'SHA-256',
      canonicalDigest: summary.sha256Digest,
      verificationSeal: summary.verificationSeal,
    },
  };
};

/**
 * Triggers browser download of the receipt as a .txt document.
 *
 * @param {Object} receipt
 */
export const downloadReceiptTextFile = (receipt) => {
  if (!receipt || typeof document === 'undefined') return;

  const content = formatReceiptAsPlainText(receipt);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Submission-Receipt-${receipt.applicationId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers browser download of the signed receipt dossier as a .json document.
 *
 * @param {Object} receipt
 */
export const downloadReceiptJsonDossier = (receipt) => {
  if (!receipt || typeof document === 'undefined') return;

  const dossier = exportSignedReceiptDossier(receipt);
  if (!dossier) return;

  const content = JSON.stringify(dossier, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `Submission-Receipt-${receipt.applicationId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
