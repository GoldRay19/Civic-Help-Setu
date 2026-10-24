import { RTI_DEPARTMENT_DIRECTORY } from '../data/rtiDepartmentDirectory';

/**
 * Validates RTI questions to prevent rejection under Section 2(f)
 * - Questions should seek records, copies, inspection (not opinions/whys)
 */
export function auditRtiQuestions(questions = []) {
  const issues = [];
  const validQueries = [];

  questions.forEach((q, idx) => {
    const text = q.trim();
    if (!text) return;

    // Check if asking speculative "why" instead of seeking physical record/file notes
    if (/^(why|reason for|why is|explain why)/i.test(text)) {
      issues.push({
        index: idx + 1,
        question: text,
        type: 'SPECULATIVE_QUERY',
        warning: 'Questions asking "Why" or seeking justifications are frequently rejected under RTI Act Section 2(f). Rephrase as: "Please provide certified copies of file notes / correspondence showing the reasons recorded for..."'
      });
    }

    // Check for Section 8 exemptions (national security, cabinet papers, trade secrets)
    if (/(cabinet decision|raw intelligence|military|secret code)/i.test(text)) {
      issues.push({
        index: idx + 1,
        question: text,
        type: 'SECTION_8_RISK',
        warning: 'Subject appears to attract Section 8(1) exemption clauses (national security / Cabinet papers before implementation).'
      });
    }

    validQueries.push(text);
  });

  return {
    validCount: validQueries.length,
    validQueries,
    issues,
    hasHighRisk: issues.some(i => i.type === 'SECTION_8_RISK')
  };
}

/**
 * Generates official formatted Section 6(1) RTI application text
 */
export function buildRtiApplication(payload = {}) {
  const {
    departmentId = 'municipal-corporation',
    applicantName = 'Citizen Applicant',
    applicantAddress = 'Residential Address',
    contactNumber = '',
    questions = [],
    isBpl = false,
    bplCardNumber = '',
    paymentMode = 'Indian Postal Order (IPO) No. ________ of ₹10'
  } = payload;

  const dept = RTI_DEPARTMENT_DIRECTORY.find(d => d.id === departmentId) || RTI_DEPARTMENT_DIRECTORY[0];
  const audit = auditRtiQuestions(questions);
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const formattedQuestions = audit.validQueries.map((q, i) => `   (${i + 1}) ${q}`).join('\n\n');

  const feeClause = isBpl
    ? `An application fee is NOT payable as the applicant belongs to the Below Poverty Line (BPL) category. (Attested copy of BPL Card No. ${bplCardNumber || 'attached'} enclosed).`
    : `An application fee of ₹10/- has been deposited vide: ${paymentMode}.`;

  const applicationText = `APPLICATION FOR INFORMATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

To,
The Public Information Officer (PIO),
${dept.pioDesignation},
${dept.nodalAuthority}

1. Full Name of the Applicant:
   ${applicantName}

2. Complete Postal Address for Reply:
   ${applicantAddress}
   Contact Phone: ${contactNumber || 'As provided in profile'}

3. Particulars of Information Required:
${formattedQuestions}

4. Specified Period:
   Current / Preceding 12 Months

5. Format of Information:
   Certified hard copies under Section 2(j)(ii) of the RTI Act, 2005 sent via Registered / Speed Post.

6. Application Fee Details:
   ${feeClause}

7. Statutory Declaration:
   I hereby state and declare that I am a citizen of India and the information sought does not fall under any of the exemptions specified under Section 8 or Section 9 of the RTI Act, 2005.

Place: ________________________
Date: ${today}

Yours faithfully,

Signature of Applicant:
(${applicantName})`;

  return {
    department: dept,
    audit,
    applicationText,
    isBpl
  };
}
