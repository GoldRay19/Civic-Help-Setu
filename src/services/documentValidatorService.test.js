import { describe, it, expect } from 'vitest';
import {
  validateVerhoeff,
  validateAadhaar,
  validatePan,
  validatePassport,
  validateVoterId,
  validateDrivingLicense,
  inspectDocumentFile,
  generatePreflightAudit
} from './documentValidatorService';

describe('documentValidatorService - Verhoeff & Aadhaar Checks', () => {
  it('validates Verhoeff checksum correctly', () => {
    // Known valid Verhoeff test sample
    expect(validateVerhoeff('234567890124')).toBe(true);
    expect(validateVerhoeff('123456789012')).toBe(false);
  });

  it('rejects invalid length and initial digits for Aadhaar', () => {
    expect(validateAadhaar('12345678901').valid).toBe(false);
    expect(validateAadhaar('098765432101').valid).toBe(false);
    expect(validateAadhaar('198765432101').valid).toBe(false);
  });

  it('accepts valid Aadhaar and generates masked preview', () => {
    const res = validateAadhaar('234567890124');
    expect(res.valid).toBe(true);
    expect(res.maskedPreview).toBe('XXXX-XXXX-0124');
  });
});

describe('documentValidatorService - PAN Validation', () => {
  it('validates standard individual PAN format', () => {
    const validRes = validatePan('ABCPE1234F');
    expect(validRes.valid).toBe(true);
    expect(validRes.entityType).toContain('Individual');
  });

  it('detects company and trust PAN codes', () => {
    const compRes = validatePan('ABCCE1234F');
    expect(compRes.valid).toBe(true);
    expect(compRes.entityType).toContain('Company');

    const trustRes = validatePan('ABCTE1234F');
    expect(trustRes.valid).toBe(true);
    expect(trustRes.entityType).toContain('Trust');
  });

  it('rejects malformed PAN numbers', () => {
    expect(validatePan('12345ABCDE').valid).toBe(false);
    expect(validatePan('ABCDE123F').valid).toBe(false);
    expect(validatePan('abcde12345').valid).toBe(false);
  });
});

describe('documentValidatorService - Passport & Voter ID & DL', () => {
  it('validates passport format', () => {
    expect(validatePassport('A1234567').valid).toBe(true);
    expect(validatePassport('Z1234567').valid).toBe(false); // Z not allowed
    expect(validatePassport('A0234567').valid).toBe(false); // First digit cannot be 0
  });

  it('validates voter ID (EPIC) format', () => {
    expect(validateVoterId('ABC1234567').valid).toBe(true);
    expect(validateVoterId('AB1234567').valid).toBe(false);
  });

  it('validates driving license (Sarathi standard format)', () => {
    expect(validateDrivingLicense('DL0120210012345').valid).toBe(true);
    expect(validateDrivingLicense('DL01ABC').valid).toBe(false);
  });
});

describe('documentValidatorService - File Inspection & Audit', () => {
  it('flags files exceeding government 2MB portal limit', () => {
    const oversizedFile = {
      name: 'scan_copy.pdf',
      size: 3 * 1024 * 1024 // 3MB
    };
    const inspect = inspectDocumentFile(oversizedFile);
    expect(inspect.passed).toBe(false);
    expect(inspect.issues[0]).toContain('exceeds government portal maximum limit');
  });

  it('accepts standard compliant files and yields READY status', () => {
    const validFile = {
      name: 'aadhaar_masked.pdf',
      size: 450 * 1024 // 450KB
    };
    const inspect = inspectDocumentFile(validFile);
    expect(inspect.passed).toBe(true);
    expect(inspect.readinessScore).toBe(100);
  });

  it('generates full preflight audit report for expiring document', () => {
    const docData = {
      title: 'Commercial Driving Permit',
      type: 'DRIVING_LICENSE',
      expiryDate: '2020-01-01', // Expired
      file: { name: 'permit.pdf', size: 300 * 1024 }
    };
    const audit = generatePreflightAudit(docData);
    expect(audit.status).toBe('REJECT_RISK');
    expect(audit.recommendations.some(r => r.includes('Renew this document'))).toBe(true);
  });
});
