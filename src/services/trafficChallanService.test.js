import { describe, it, expect } from 'vitest';
import {
  auditRule167ACompliance,
  analyzeChallanDefects,
  generateSection208ContestPetition,
  generateTrafficPoliceGrievance,
  sanitizeChallanCase,
  TRAFFIC_DISPUTE_LEGAL_DISCLAIMER,
  RULE_167A_CRITERIA,
} from './trafficChallanService.js';

describe('trafficChallanService (#1340)', () => {
  it('audits Rule 167A criteria and computes compliance score', () => {
    const allPassed = {};
    RULE_167A_CRITERIA.forEach((c) => {
      allPassed[c.id] = true;
    });

    const result = auditRule167ACompliance(allPassed, 5);
    expect(result.score).toBe(100);
    expect(result.complianceStatus).toBe('COMPLIANT');
    expect(result.isAdmissible).toBe(true);
    expect(result.criticalFailures).toBe(0);
    expect(result.isDelayedService).toBe(false);
  });

  it('detects fatal defect when critical camera calibration fails or notice is delayed > 15 days', () => {
    const checks = {
      clear_number_plate: true,
      vehicle_characteristics: true,
      annual_calibration: false, // Critical failure
    };

    const result = auditRule167ACompliance(checks, 20); // Delayed service (>15 days)
    expect(result.criticalFailures).toBeGreaterThanOrEqual(1);
    expect(result.isDelayedService).toBe(true);
    expect(result.complianceStatus).toBe('FATALLY_DEFECTIVE');
    expect(result.isAdmissible).toBe(false);
  });

  it('analyzes defects and recommends Virtual Court contest for fatal defects', () => {
    const analysis = analyzeChallanDefects(
      ['uncalibrated_camera', 'cloned_plate_alibi'],
      { fineAmount: 2000 }
    );

    expect(analysis.fatalDefectsCount).toBe(2);
    expect(analysis.contestStrength).toBe('STRONG');
    expect(analysis.recommendedAction).toContain('Virtual Court');
    expect(analysis.compoundingAmount).toBe(2000);
  });

  it('drafts Section 208 Virtual Court contest petition with statutory grounds', () => {
    const petition = generateSection208ContestPetition({
      ownerName: 'Vikramaditya Rao',
      ownerContact: 'vikram@example.com / 9845012345',
      ownerAddress: 'Indiranagar, Bengaluru',
      vehicleNumber: 'KA-01-MJ-4099',
      vehicleClass: 'Motor Car (LMV)',
      challanNumber: 'KA26110998341A',
      challanDate: '2026-02-18',
      challanTime: '14:22:10',
      fineAmount: 2000,
      allegedOffence: 'Section 183 - Exceeding Speed Limit',
      location: 'Outer Ring Road, Bellandur',
      selectedDefects: ['uncalibrated_camera', 'cloned_plate_alibi'],
      alibiDetails: 'Fastag records show vehicle at Airport T2 at 14:22 hrs.',
    });

    expect(petition).toContain('BEFORE THE HON\'BLE VIRTUAL COURT');
    expect(petition).toContain('SECTION 208 OF THE MOTOR VEHICLES ACT, 1988');
    expect(petition).toContain('KA-01-MJ-4099');
    expect(petition).toContain('KA26110998341A');
    expect(petition).toContain('₹2,000');
    expect(petition).toContain('Legal Metrology Annual Calibration Certificate');
    expect(petition).toContain(TRAFFIC_DISPUTE_LEGAL_DISCLAIMER);
  });

  it('generates administrative grievance representation for Traffic Police', () => {
    const grievance = generateTrafficPoliceGrievance({
      ownerName: 'Vikramaditya Rao',
      ownerContact: 'vikram@example.com',
      vehicleNumber: 'KA-01-MJ-4099',
      challanNumber: 'KA26110998341A',
      challanDate: '2026-02-18',
      fineAmount: 2000,
      allegedOffence: 'Section 183 - Speed Violation',
      location: 'Outer Ring Road',
      selectedDefects: ['uncalibrated_camera'],
      defectNotes: 'Camera calibration certificate expired in October 2025.',
    });

    expect(grievance).toContain('THE NODAL GRIEVANCE OFFICER');
    expect(grievance).toContain('KA26110998341A');
    expect(grievance).toContain('Rule 167A of the Central Motor Vehicles Rules');
    expect(grievance).toContain('Camera calibration certificate expired');
  });

  it('sanitizes contact numbers and vehicle registration numbers under DPDP Act 2023', () => {
    const raw = {
      ownerContact: '9845012345 / citizen@parivahan.gov',
      vehicleNumber: 'KA-01-MJ-4099',
    };

    const sanitized = sanitizeChallanCase(raw);
    expect(sanitized.ownerContact).toContain('98XXXXXX45');
    expect(sanitized.ownerContact).toContain('c***@parivahan.gov');
    expect(sanitized.vehicleNumber).toContain('KA-01-XX-4099');
  });
});
