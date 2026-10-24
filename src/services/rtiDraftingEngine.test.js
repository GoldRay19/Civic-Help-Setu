import { describe, it, expect } from 'vitest';
import { auditRtiQuestions, buildRtiApplication } from './rtiDraftingEngine';

describe('rtiDraftingEngine - Question Audits & Petition Builder', () => {
  it('flags speculative "Why" questions under Section 2(f)', () => {
    const questions = [
      'Why was my mutation rejected?',
      'Certified copy of rejection order and inspection note.'
    ];

    const audit = auditRtiQuestions(questions);
    expect(audit.issues.length).toBe(1);
    expect(audit.issues[0].type).toBe('SPECULATIVE_QUERY');
    expect(audit.issues[0].warning).toContain('Section 2(f)');
  });

  it('flags Section 8 exemption risks', () => {
    const questions = ['Provide confidential cabinet decision notes and military files.'];
    const audit = auditRtiQuestions(questions);
    expect(audit.hasHighRisk).toBe(true);
    expect(audit.issues[0].type).toBe('SECTION_8_RISK');
  });

  it('builds full compliant Section 6(1) RTI application with BPL fee waiver', () => {
    const payload = {
      departmentId: 'municipal-corporation',
      applicantName: 'Kailash Meena',
      applicantAddress: 'Ward 12, Sanganer, Jaipur',
      questions: [
        'Certified copy of contractor tender sanction for road repair.',
        'Copy of quality testing report for bitumen mix used.'
      ],
      isBpl: true,
      bplCardNumber: 'BPL-RJ-2022-98712'
    };

    const res = buildRtiApplication(payload);
    expect(res.applicationText).toContain('Kailash Meena');
    expect(res.applicationText).toContain('Public Information Officer');
    expect(res.applicationText).toContain('BPL-RJ-2022-98712');
    expect(res.applicationText).toContain('fee is NOT payable');
  });
});
