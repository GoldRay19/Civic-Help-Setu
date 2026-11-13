import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateReceiptVerificationHash,
  generateReceiptSha256Digest,
  buildReceiptSummary,
  formatReceiptAsPlainText,
  verifyReceiptIntegrity,
  parseAndVerifyReceiptText,
  buildReceiptQrPath,
  exportSignedReceiptDossier,
  downloadReceiptTextFile,
  downloadReceiptJsonDossier,
} from './submissionReceiptService';

describe('submissionReceiptService', () => {
  const sampleApp = {
    id: 'APP-10294-DL',
    serviceName: 'Driving License Renewal',
    applicantName: 'Vikram Joshi',
    appliedDate: '2026-10-15',
    estimatedCompletion: '2026-10-30',
    status: 'in-progress',
    stages: [
      { title: 'Application Submitted', completed: true, date: '15 Oct 2026' },
      { title: 'Document Verification', current: true, completed: false },
      { title: 'Biometrics & Driving Test', completed: false },
      { title: 'Smart Card Dispatch', completed: false },
    ],
  };

  describe('generateReceiptVerificationHash (legacy seal)', () => {
    it('generates a consistent, deterministic verification seal for an application', () => {
      const seal1 = generateReceiptVerificationHash(sampleApp);
      const seal2 = generateReceiptVerificationHash(sampleApp);

      expect(seal1).toBe(seal2);
      expect(seal1).toMatch(/^CB-SEAL-[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    it('handles null and empty application data safely when generating hash', () => {
      expect(generateReceiptVerificationHash(null)).toBe('CB-SEAL-0000-0000');
      expect(generateReceiptVerificationHash({})).toBe('CB-SEAL-0000-0000');
    });
  });

  describe('generateReceiptSha256Digest (#742)', () => {
    it('generates a deterministic 64-character lowercase hex digest', () => {
      const digest1 = generateReceiptSha256Digest(sampleApp);
      const digest2 = generateReceiptSha256Digest(sampleApp);

      expect(digest1).toBe(digest2);
      expect(digest1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is invariant to object property insertion order (canonical serialization)', () => {
      const appOrderA = {
        id: 'APP-CANONICAL-1',
        serviceName: 'Birth Certificate',
        applicantName: 'Meera Rao',
        submissionDate: '2026-09-01',
        status: 'approved',
      };
      const appOrderB = {
        status: 'approved',
        applicantName: 'Meera Rao',
        submissionDate: '2026-09-01',
        id: 'APP-CANONICAL-1',
        serviceName: 'Birth Certificate',
      };

      const digestA = generateReceiptSha256Digest(appOrderA);
      const digestB = generateReceiptSha256Digest(appOrderB);

      expect(digestA).toBe(digestB);
    });

    it('returns a fallback 64-zero string for missing or empty application payloads', () => {
      expect(generateReceiptSha256Digest(null)).toBe('0'.repeat(64));
      expect(generateReceiptSha256Digest({})).toBe('0'.repeat(64));
    });
  });

  describe('buildReceiptSummary & PII scrubbing (#742)', () => {
    it('builds structured receipt summary with both verification seal and SHA-256 digest', () => {
      const summary = buildReceiptSummary(sampleApp);

      expect(summary).not.toBeNull();
      expect(summary.receiptNumber).toBe('REC-APP-10294-DL');
      expect(summary.applicationId).toBe('APP-10294-DL');
      expect(summary.serviceName).toBe('Driving License Renewal');
      expect(summary.applicantName).toBe('Vikram Joshi');
      expect(summary.verificationSeal).toContain('CB-SEAL-');
      expect(summary.sha256Digest).toMatch(/^[0-9a-f]{64}$/);
      expect(summary.statutoryNotice).toContain('State Right to Public Services');
      expect(summary.stages).toHaveLength(4);
      expect(summary.stages[0].status).toBe('COMPLETED');
      expect(summary.stages[1].status).toBe('IN PROGRESS');
      expect(summary.stages[2].status).toBe('PENDING');
    });

    it('returns null when building receipt summary for undefined application', () => {
      expect(buildReceiptSummary(null)).toBeNull();
    });

    it('scrubs sensitive PII patterns such as Aadhaar and PAN from applicant and service metadata', () => {
      const sensitiveApp = {
        id: 'APP-SENSITIVE-77',
        serviceName: 'Income Certificate (PAN: ABCDE1234F)',
        applicantName: 'Rohan Sharma (Aadhaar: 1234 5678 9012)',
        appliedDate: '2026-10-01',
        estimatedCompletion: '2026-10-15',
        status: 'in-progress',
      };

      const summary = buildReceiptSummary(sensitiveApp);
      expect(summary.applicantName).not.toContain('1234 5678 9012');
      expect(summary.serviceName).not.toContain('ABCDE1234F');
    });
  });

  describe('formatReceiptAsPlainText', () => {
    it('formats receipt summary into plain-text ASCII slip with embedded seals', () => {
      const summary = buildReceiptSummary(sampleApp);
      const textSlip = formatReceiptAsPlainText(summary);

      expect(textSlip).toContain('CIVIC-HELP-SETU PORTAL');
      expect(textSlip).toContain('OFFICIAL SUBMISSION ACKNOWLEDGMENT');
      expect(textSlip).toContain('Reference ID      : APP-10294-DL');
      expect(textSlip).toContain('Applicant Name    : Vikram Joshi');
      expect(textSlip).toContain('Digital Seal      : CB-SEAL-');
      expect(textSlip).toContain('SHA-256 Digest   : ' + summary.sha256Digest);
      expect(textSlip).toContain('[COMPLETED] Stage 1: Application Submitted');
    });

    it('returns empty string if receipt is null or undefined', () => {
      expect(formatReceiptAsPlainText(null)).toBe('');
    });
  });

  describe('verifyReceiptIntegrity (#742)', () => {
    it('verifies a genuine receipt summary successfully as VALID', () => {
      const summary = buildReceiptSummary(sampleApp);
      const verdict = verifyReceiptIntegrity(summary);

      expect(verdict.valid).toBe(true);
      expect(verdict.status).toBe('VALID');
      expect(verdict.digest).toBe(summary.sha256Digest);
    });

    it('detects tampering when serviceName is modified', () => {
      const summary = buildReceiptSummary(sampleApp);
      const tampered = { ...summary, serviceName: 'Illegal Passport Expedite' };

      const verdict = verifyReceiptIntegrity(tampered);
      expect(verdict.valid).toBe(false);
      expect(verdict.status).toBe('TAMPERED');
      expect(verdict.reason).toContain('Cryptographic SHA-256 seal mismatch');
    });

    it('detects tampering when applicantName is modified', () => {
      const summary = buildReceiptSummary(sampleApp);
      const tampered = { ...summary, applicantName: 'Forged Identity' };

      const verdict = verifyReceiptIntegrity(tampered);
      expect(verdict.valid).toBe(false);
      expect(verdict.status).toBe('TAMPERED');
    });

    it('detects tampering when timeline stages are altered', () => {
      const summary = buildReceiptSummary(sampleApp);
      const tampered = {
        ...summary,
        stages: [{ step: 1, title: 'Bypassed Verification', status: 'COMPLETED', date: 'Now' }],
      };

      const verdict = verifyReceiptIntegrity(tampered);
      expect(verdict.valid).toBe(false);
      expect(verdict.status).toBe('TAMPERED');
    });

    it('falls back to legacy verification seal when SHA-256 digest is absent', () => {
      const legacyReceipt = {
        id: sampleApp.id,
        applicationId: sampleApp.id,
        serviceName: sampleApp.serviceName,
        applicantName: sampleApp.applicantName,
        appliedDate: sampleApp.appliedDate,
        verificationSeal: generateReceiptVerificationHash(sampleApp),
      };

      const verdict = verifyReceiptIntegrity(legacyReceipt);
      expect(verdict.valid).toBe(true);
      expect(verdict.status).toBe('LEGACY_VALID');

      // Tampering legacy seal
      const tamperedLegacy = { ...legacyReceipt, applicantName: 'Altered Name' };
      const tamperedVerdict = verifyReceiptIntegrity(tamperedLegacy);
      expect(tamperedVerdict.valid).toBe(false);
      expect(tamperedVerdict.status).toBe('TAMPERED');
    });

    it('returns INVALID for empty or invalid receipt objects', () => {
      expect(verifyReceiptIntegrity(null).status).toBe('INVALID');
      expect(verifyReceiptIntegrity({}).status).toBe('INVALID');
    });
  });

  describe('parseAndVerifyReceiptText (#742)', () => {
    it('parses and verifies a generated plain-text slip as authentic', () => {
      const summary = buildReceiptSummary(sampleApp);
      const plainText = formatReceiptAsPlainText(summary);

      const verdict = parseAndVerifyReceiptText(plainText);
      expect(verdict.valid).toBe(true);
      expect(verdict.status).toBe('VALID');
      expect(verdict.parsedReceipt.applicationId).toBe(sampleApp.id);
    });

    it('detects tampering in an ASCII text slip with altered service name', () => {
      const summary = buildReceiptSummary(sampleApp);
      const plainText = formatReceiptAsPlainText(summary);
      const tamperedText = plainText.replace(
        'Driving License Renewal',
        'Unauthorized Commercial Permit'
      );

      const verdict = parseAndVerifyReceiptText(tamperedText);
      expect(verdict.valid).toBe(false);
      expect(verdict.status).toBe('TAMPERED');
    });

    it('parses and verifies an exported JSON dossier', () => {
      const dossier = exportSignedReceiptDossier(sampleApp);
      const jsonText = JSON.stringify(dossier, null, 2);

      const verdict = parseAndVerifyReceiptText(jsonText);
      expect(verdict.valid).toBe(true);
      expect(verdict.status).toBe('VALID');
    });

    it('returns INVALID for empty or unparseable input', () => {
      expect(parseAndVerifyReceiptText('').status).toBe('INVALID');
      expect(parseAndVerifyReceiptText('Random string without receipt headers').status).toBe(
        'INVALID'
      );
    });
  });

  describe('buildReceiptQrPath (#742)', () => {
    it('generates a valid SVG path matrix and non-zero size for verification payload', () => {
      const payload = {
        id: sampleApp.id,
        rec: 'REC-' + sampleApp.id,
        seal: 'CB-SEAL-1234-5678',
        sha256: 'abcdef1234567890'.repeat(4),
      };

      const qr = buildReceiptQrPath(payload);
      expect(qr).toBeDefined();
      expect(typeof qr.path).toBe('string');
      expect(qr.path).toContain('M');
      expect(qr.path).toContain('h1v1h-1z');
      expect(qr.size).toBeGreaterThan(20);
    });
  });

  describe('exportSignedReceiptDossier (#742)', () => {
    it('creates a complete signed dossier with signature metadata', () => {
      const dossier = exportSignedReceiptDossier(sampleApp);

      expect(dossier).toBeDefined();
      expect(dossier.exportType).toBe('CIVIC_STATUTORY_SUBMISSION_RECEIPT');
      expect(dossier.signatureMetadata.algorithm).toBe('SHA-256');
      expect(dossier.signatureMetadata.canonicalDigest).toBe(dossier.receipt.sha256Digest);
      expect(dossier.signatureMetadata.verificationSeal).toBe(dossier.receipt.verificationSeal);
    });

    it('returns null when application is null', () => {
      expect(exportSignedReceiptDossier(null)).toBeNull();
    });
  });

  describe('downloadReceiptTextFile and downloadReceiptJsonDossier in DOM environment', () => {
    const originalDocument = globalThis.document;
    const originalURL = globalThis.URL;

    afterEach(() => {
      globalThis.document = originalDocument;
      globalThis.URL = originalURL;
    });

    it('triggers text file download with correct filename and URL revocation', () => {
      const mockClick = vi.fn();
      const mockAppend = vi.fn();
      const mockRemove = vi.fn();
      const mockCreateObjectUrl = vi.fn().mockReturnValue('blob:dummy-receipt-url');
      const mockRevokeObjectUrl = vi.fn();

      globalThis.document = {
        createElement: vi.fn().mockReturnValue({
          href: '',
          download: '',
          click: mockClick,
        }),
        body: {
          appendChild: mockAppend,
          removeChild: mockRemove,
        },
      };

      globalThis.URL = {
        createObjectURL: mockCreateObjectUrl,
        revokeObjectURL: mockRevokeObjectUrl,
      };

      const summary = buildReceiptSummary(sampleApp);
      downloadReceiptTextFile(summary);

      expect(mockCreateObjectUrl).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith('blob:dummy-receipt-url');
    });

    it('triggers JSON dossier download with correct filename and URL revocation', () => {
      const mockClick = vi.fn();
      const mockAppend = vi.fn();
      const mockRemove = vi.fn();
      const mockCreateObjectUrl = vi.fn().mockReturnValue('blob:dummy-dossier-url');
      const mockRevokeObjectUrl = vi.fn();

      globalThis.document = {
        createElement: vi.fn().mockReturnValue({
          href: '',
          download: '',
          click: mockClick,
        }),
        body: {
          appendChild: mockAppend,
          removeChild: mockRemove,
        },
      };

      globalThis.URL = {
        createObjectURL: mockCreateObjectUrl,
        revokeObjectURL: mockRevokeObjectUrl,
      };

      const summary = buildReceiptSummary(sampleApp);
      downloadReceiptJsonDossier(summary);

      expect(mockCreateObjectUrl).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectUrl).toHaveBeenCalledWith('blob:dummy-dossier-url');
    });

    it('returns safely if document is missing', () => {
      delete globalThis.document;
      const summary = buildReceiptSummary(sampleApp);
      expect(() => downloadReceiptTextFile(summary)).not.toThrow();
      expect(() => downloadReceiptJsonDossier(summary)).not.toThrow();
    });
  });
});
