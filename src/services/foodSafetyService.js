/**
 * @file foodSafetyService.js
 * @description Core statutory calculation and legal petition drafting engine for food adulteration,
 * hygiene compliance, and consumer injury compensation under the Food Safety and Standards Act, 2006 (FSSA 2006).
 */

export const FSSA_SECTIONS = {
  SECTION_40: 'Section 40 - Right of Consumer / Purchaser to Analyze Food Sample',
  SECTION_51: 'Section 51 - Penalty for Selling Substandard Food (up to ₹5,00,000)',
  SECTION_52: 'Section 52 - Penalty for Misbranded Food (up to ₹3,00,000)',
  SECTION_53: 'Section 53 - Penalty for Misleading Advertisement (up to ₹10,00,000)',
  SECTION_54: 'Section 54 - Food Containing Extraneous Matter (up to ₹1,00,000)',
  SECTION_56: 'Section 56 - Penalty for Unhygienic or Unsanitary Processing (up to ₹1,00,000)',
  SECTION_59: 'Section 59 - Punishment for Unsafe Food (Imprisonment & Fines up to ₹10,00,000)',
  SECTION_65: 'Section 65 - Mandatory Compensation to Victim / Consumers for Injury or Death',
  SECTION_68: 'Section 68 - Adjudication by Adjudicating Officer (Additional District Magistrate - ADM)',
};

export const SCHEDULE_4_CRITERIA = [
  {
    id: 'potable_water',
    category: 'Water & Utilities',
    title: 'Potable Water Testing (IS 10500 Compliance)',
    description: 'Quarterly microbiological and chemical water test reports from accredited laboratory.',
    statutoryWeight: 15,
    critical: true,
  },
  {
    id: 'cold_chain',
    category: 'Temperature Control',
    title: 'Cold-Chain Monitoring & Temperature Logs',
    description: 'Chilled storage maintained <= 5°C, frozen <= -18°C, hot display >= 60°C with logged daily checks.',
    statutoryWeight: 15,
    critical: true,
  },
  {
    id: 'medical_fitness',
    category: 'Personnel Hygiene',
    title: 'Food Handler Medical Fitness (Form IX)',
    description: 'Annual medical examination, de-worming, and enteric vaccinations for all kitchen staff.',
    statutoryWeight: 10,
    critical: false,
  },
  {
    id: 'pest_control',
    category: 'Sanitation',
    title: 'Integrated Pest Management (IPM) Contract & Audit',
    description: 'Pest eradication contracts, mapped insect light traps, rodent baiting log, and zero infestation.',
    statutoryWeight: 15,
    critical: true,
  },
  {
    id: 'cross_contamination',
    category: 'Food Handling',
    title: 'Cross-Contamination Prevention & Segregation',
    description: 'Color-coded chopping boards, separate utensils, and physical segregation of raw and cooked items.',
    statutoryWeight: 10,
    critical: false,
  },
  {
    id: 'oil_quality',
    category: 'Food Quality',
    title: 'Cooking Oil Quality (TPC <= 25%)',
    description: 'Total Polar Compounds (TPC) not exceeding 25%, strict prohibition of repeated reheating / burnt oil.',
    statutoryWeight: 15,
    critical: true,
  },
  {
    id: 'waste_disposal',
    category: 'Sanitation',
    title: 'Waste Management & Kitchen Grease Traps',
    description: 'Foot-operated covered bins, continuous refuse removal, and operational grease traps.',
    statutoryWeight: 10,
    critical: false,
  },
  {
    id: 'traceability',
    category: 'Supply Chain',
    title: 'Raw Material Traceability & Batch Records',
    description: 'Purchase invoices with supplier FSSAI 14-digit licenses, expiry dates ledger, and fifo rotation.',
    statutoryWeight: 10,
    critical: false,
  },
];

export const VIOLATION_CATEGORIES = {
  SUBSTANDARD: {
    id: 'substandard',
    label: 'Substandard Food (Below FSSAI compositional limits without health risk)',
    section: 'Section 51',
    maxPenalty: 500000,
    forum: 'Adjudicating Officer (ADM)',
  },
  MISBRANDED: {
    id: 'misbranded',
    label: 'Misbranded / False Labeling / Missing Mandatory Disclaimers',
    section: 'Section 52',
    maxPenalty: 300000,
    forum: 'Adjudicating Officer (ADM)',
  },
  MISLEADING_AD: {
    id: 'misleading_ad',
    label: 'Misleading Advertisement or Deceptive Nutritional Claims',
    section: 'Section 53',
    maxPenalty: 1000000,
    forum: 'Adjudicating Officer (ADM)',
  },
  EXTRANEOUS_MATTER: {
    id: 'extraneous_matter',
    label: 'Food Containing Extraneous Matter (Insects, plastics, metallic shards)',
    section: 'Section 54',
    maxPenalty: 100000,
    forum: 'Adjudicating Officer (ADM)',
  },
  UNHYGIENIC_PROCESSING: {
    id: 'unhygienic_processing',
    label: 'Unhygienic or Unsanitary Manufacturing/Cooking Conditions',
    section: 'Section 56',
    maxPenalty: 100000,
    forum: 'Adjudicating Officer (ADM)',
  },
  UNSAFE_FOOD: {
    id: 'unsafe_food',
    label: 'Unsafe Food (Poisonous, noxious, contaminated causing illness)',
    section: 'Section 59',
    maxPenalty: 1000000,
    forum: 'Special Court / Judicial Magistrate First Class',
  },
};

export const INJURY_TIERS = {
  NONE: {
    id: 'NONE',
    label: 'No Physical Injury (Economic or aesthetic loss only)',
    statutoryCompensation: 0,
    section: 'N/A',
  },
  TEMPORARY_INJURY: {
    id: 'TEMPORARY_INJURY',
    label: 'Minor / Non-Grievous Injury (Acute gastroenteritis, vomiting, outpatient care)',
    statutoryCompensation: 100000, // Up to 1 lakh under Sec 65
    section: 'Section 65(1)(c)',
  },
  GRIEVOUS_INJURY: {
    id: 'GRIEVOUS_INJURY',
    label: 'Grievous Injury (Organ impairment, hospitalization > 20 days, severe toxicity)',
    statutoryCompensation: 300000, // Up to 3 lakh under Sec 65
    section: 'Section 65(1)(b)',
  },
  FATALITY: {
    id: 'FATALITY',
    label: 'Fatal Poisoning / Death of Consumer',
    statutoryCompensation: 500000, // Not less than 5 lakh under Sec 65
    section: 'Section 65(1)(a)',
  },
};

export const FOOD_SAFETY_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '1. Internal Audit (Draft)' },
  { value: 'FBO_NOTICE_ISSUED', label: '2. Pre-Litigation Notice to Food Business Operator' },
  { value: 'COMPLAINT_FILED_DO', label: '3. Complaint Filed with Designated Officer (FSSAI)' },
  { value: 'ADM_ADJUDICATION_PENDING', label: '4. ADM Adjudication / Hearing Underway' },
  { value: 'COMPENSATION_AWARDED', label: '5. Section 65 Compensation Awarded & Settled' },
  { value: 'CLOSED', label: '6. Closed / Resolved' },
];

export const FOOD_SAFETY_LEGAL_DISCLAIMER =
  'CITIZEN ADVISORY & STATUTORY NOTICE: This calculation and draft petition are prepared locally for citizen assistance under the Food Safety and Standards Act, 2006. Generating this document does not constitute formal legal advice or automated submission. The petition must be filed in person or through the official FoSCoS grievance portal before the District Designated Officer or Adjudicating Officer (ADM).';

/**
 * Audits Schedule 4 sanitary criteria and computes compliance score and rating badge.
 *
 * @param {Object.<string, boolean>} checks - Map of criteria ID to pass/fail boolean
 * @returns {Object} Audit outcome
 */
export function auditSchedule4Hygiene(checks = {}) {
  let earnedScore = 0;
  let totalPossible = 0;
  let criticalFailures = 0;
  const itemResults = [];

  SCHEDULE_4_CRITERIA.forEach((item) => {
    totalPossible += item.statutoryWeight;
    const isCompliant = Boolean(checks[item.id]);

    if (isCompliant) {
      earnedScore += item.statutoryWeight;
    } else if (item.critical) {
      criticalFailures += 1;
    }

    itemResults.push({
      ...item,
      compliant: isCompliant,
    });
  });

  const percentageScore = totalPossible > 0 ? Math.round((earnedScore / totalPossible) * 100) : 0;

  let ratingBadge = 'A+';
  let ratingLabel = 'Excellent / FSSAI Compliant';
  let badgeColor = 'emerald';

  if (criticalFailures > 0 || percentageScore < 60) {
    ratingBadge = 'CRITICAL_RISK';
    ratingLabel = 'Critical Non-Compliance (Imminent Health Hazard)';
    badgeColor = 'rose';
  } else if (percentageScore < 75) {
    ratingBadge = 'B';
    ratingLabel = 'Fair / Needs Improvement';
    badgeColor = 'amber';
  } else if (percentageScore < 90) {
    ratingBadge = 'A';
    ratingLabel = 'Good / Satisfactory';
    badgeColor = 'blue';
  }

  return {
    score: percentageScore,
    earnedPoints: earnedScore,
    totalPoints: totalPossible,
    criticalFailures,
    ratingBadge,
    ratingLabel,
    badgeColor,
    isCompliant: criticalFailures === 0 && percentageScore >= 75,
    items: itemResults,
  };
}

/**
 * Calculates adulteration statutory penalties and consumer injury compensation under FSSA 2006.
 *
 * @param {Object} data
 * @param {Array<string>} [data.selectedViolations=[]] - Array of violation IDs
 * @param {string} [data.injuryTier='NONE'] - 'NONE' | 'TEMPORARY_INJURY' | 'GRIEVOUS_INJURY' | 'FATALITY'
 * @param {number} [data.actualMedicalBills=0] - Medical and hospitalization expenditures in INR
 * @param {number} [data.daysHospitalized=0] - Days hospitalized
 * @param {number} [data.lostWages=0] - Estimated economic loss during convalescence
 * @returns {Object} Comprehensive calculation
 */
export function calculateAdulterationLiability(data = {}) {
  const {
    selectedViolations = [],
    injuryTier = 'NONE',
    actualMedicalBills = 0,
    daysHospitalized = 0,
    lostWages = 0,
  } = data;

  const tier = INJURY_TIERS[injuryTier] || INJURY_TIERS.NONE;
  const medicalExpenses = Math.max(0, Number(actualMedicalBills) || 0);
  const wageLoss = Math.max(0, Number(lostWages) || 0);
  const hospitalizationDays = Math.max(0, Number(daysHospitalized) || 0);

  let totalMaxPenaltyLiability = 0;
  let primaryForum = 'Adjudicating Officer (ADM) under Section 68';
  let hasCriminalCharge = false;

  const violationBreakdown = selectedViolations.map((vKey) => {
    const vUpper = String(vKey).toUpperCase();
    const violation =
      VIOLATION_CATEGORIES[vUpper] ||
      Object.values(VIOLATION_CATEGORIES).find((v) => v.id === vKey) ||
      VIOLATION_CATEGORIES.SUBSTANDARD;
    totalMaxPenaltyLiability += violation.maxPenalty;
    if (violation.id === 'unsafe_food') {
      primaryForum = 'Judicial Magistrate / Special Food Court under Section 59';
      hasCriminalCharge = true;
    }
    return violation;
  });

  // Section 65 Statutory Consumer Compensation:
  // Base compensation + actual medical bills + economic wage loss
  const statutoryBaseCompensation = tier.statutoryCompensation;
  let recommendedTotalCompensation;

  if (tier.id === 'FATALITY') {
    recommendedTotalCompensation = Math.max(500000, 500000 + medicalExpenses + wageLoss);
  } else if (tier.id === 'GRIEVOUS_INJURY') {
    recommendedTotalCompensation = Math.min(300000, statutoryBaseCompensation) + medicalExpenses + wageLoss;
  } else if (tier.id === 'TEMPORARY_INJURY') {
    recommendedTotalCompensation = Math.min(100000, statutoryBaseCompensation) + medicalExpenses + wageLoss;
  } else {
    // If no physical injury, consumer can claim refund of product + token damages for misbranding
    recommendedTotalCompensation = medicalExpenses + wageLoss;
  }

  // Section 65(2) Interim Relief within 30 days
  const interimReliefMandatory = tier.id !== 'NONE';
  const interimReliefAmount = interimReliefMandatory ? Math.min(50000, recommendedTotalCompensation * 0.25) : 0;

  return {
    injuryTier: tier,
    selectedViolations: violationBreakdown,
    totalMaxPenaltyLiability,
    statutoryBaseCompensation,
    medicalExpenses,
    wageLoss,
    hospitalizationDays,
    recommendedTotalCompensation,
    interimReliefMandatory,
    interimReliefAmount,
    primaryForum,
    hasCriminalCharge,
  };
}

/**
 * Drafts a formal complaint to the District Designated Officer & Adjudicating Officer (ADM).
 *
 * @param {Object} data
 * @returns {string} Formatted petition
 */
export function generateFssaiComplaintPetition(data = {}) {
  const {
    complainantName = '[Complainant Full Name]',
    complainantAddress = '[Complainant Address & City]',
    complainantContact = '[Phone & Email]',
    fboName = '[Food Business Operator / Restaurant / Manufacturer]',
    fboAddress = '[FBO Address / Location]',
    fboLicenseNumber = '[FSSAI 14-Digit License / Unregistered]',
    productName = '[Food Item / Dish / Packaged Commodity]',
    batchNumber = '[Batch / Lot Number or Bill Ref]',
    purchaseDate = '[YYYY-MM-DD]',
    purchaseInvoice = '[Invoice / Receipt Number]',
    labReportNumber = '[FSSAI Food Analyst Report Ref, if tested]',
    violationDetails = '',
    injuryDetails = '',
    calculations = {},
  } = data;

  const totalClaim = calculations.recommendedTotalCompensation || 0;
  const maxPenalty = calculations.totalMaxPenaltyLiability || 0;

  return `BEFORE THE ADJUDICATING OFFICER (ADDITIONAL DISTRICT MAGISTRATE) / 
DISTRICT DESIGNATED OFFICER (FOOD SAFETY)
DISTRICT: [District Name], STATE: [State Name]

COMPLAINT / APPLICATION UNDER SECTIONS 38, 40, 51-59, AND 65 OF THE FOOD SAFETY AND STANDARDS ACT, 2006 (FSSA 2006)
READ WITH RULE 3.1.1 OF THE FSS RULES, 2011

IN THE MATTER OF:
${complainantName}
Residing at: ${complainantAddress}
Contact: ${complainantContact}
... COMPLAINANT / AGGRIEVED CONSUMER

VERSUS

${fboName}
Premises: ${fboAddress}
FSSAI License / Registration No.: ${fboLicenseNumber}
... OPPOSITE PARTY / FOOD BUSINESS OPERATOR (FBO)

MOST RESPECTFULLY SHOWETH:

1. JURISDICTION & CAPACITY:
The Complainant is a bonafide consumer and citizen who purchased the subject food article within the territorial jurisdiction of this Hon'ble Authority. This application is preferred under Section 68 of the Food Safety and Standards Act, 2006, praying for inquiry, adjudication of penalties, and award of consumer injury compensation under Section 65.

2. DETAILS OF TRANSACTION & FOOD ARTICLE:
- Food Product / Item: ${productName}
- Batch / Lot / Order Reference: ${batchNumber}
- Date of Purchase: ${purchaseDate}
- Cash Memo / Invoice Reference: ${purchaseInvoice}
- Statutory Food Analyst Lab Report (Sec 40): ${labReportNumber || 'Pending Official Seizure & Laboratory Referral under Sec 38'}

3. SUMMARY OF STATUTORY VIOLATIONS:
The Opposite Party has violated mandatory provisions of the Food Safety and Standards Act, 2006 and Schedule 4 Regulations:
${violationDetails || '- Distribution of adulterated, unhygienic, or unsafe food causing risk to public health.'}
Statutory Penalty Exposure under Sections 51, 52, 54, 56, and 59: Up to ₹${maxPenalty.toLocaleString('en-IN')}/-.

4. CONSUMER HARM, MEDICAL EXPENDITURE & SECTION 65 ENTITLEMENT:
As a direct consequence of consuming the defective/contaminated food article:
${injuryDetails || '- The Complainant and family suffered acute gastrointestinal toxicity and required medical treatment.'}
- Medical & Hospitalization Out-of-Pocket Expenses: ₹${(calculations.medicalExpenses || 0).toLocaleString('en-IN')}/-
- Statutory Compensation Claimed under Section 65(1): ₹${totalClaim.toLocaleString('en-IN')}/-
- Mandatory Interim Relief Claimed under Section 65(2): ₹${(calculations.interimReliefAmount || 0).toLocaleString('en-IN')}/- (payable within 30 days)

5. CHAIN OF CUSTODY & EVIDENCE PRESERVATION:
The Complainant has preserved:
(i) Original retail bill / digital tax invoice.
(ii) Sealed counter-sample / photographic evidence of contaminated article with batch seal intact.
(iii) Attending Physician's Medical Discharge Summary and pharmacy cash receipts.

6. PRAYERS:
WHEREFORE, it is most respectfully prayed that this Hon'ble Authority may be pleased to:
a) Direct a Food Safety Officer (FSO) under Section 38 to immediately inspect the premises of the Opposite Party, seize counter-samples, and suspend the FSSAI license if critical hazards persist;
b) Direct statutory sample analysis by the Referral Food Laboratory under Section 40;
c) Initiate formal adjudication under Section 68 and impose maximum statutory penalties upon the Opposite Party;
d) Direct the Opposite Party to pay immediate interim relief under Section 65(2) and final compensation of ₹${totalClaim.toLocaleString('en-IN')}/- to the Complainant;
e) Pass such other order(s) as deemed fit in the interest of consumer protection and public health.

VERIFICATION:
I, ${complainantName}, the Complainant above-named, do hereby declare that the contents of paragraphs 1 to 6 are true to my personal knowledge and belief, and nothing material has been concealed therefrom.

Date: ${new Date().toISOString().split('T')[0]}
Place: [District / City]

________________________
(Signature of Complainant)

DISCLAIMER:
${FOOD_SAFETY_LEGAL_DISCLAIMER}
`;
}

/**
 * Generates a formal 15-day pre-litigation legal notice to the Food Business Operator.
 *
 * @param {Object} data
 * @returns {string} Formatted legal notice
 */
export function generateFboLegalNotice(data = {}) {
  const {
    complainantName = '[Consumer Name]',
    complainantAddress = '[Consumer Address]',
    complainantContact = '[Consumer Contact]',
    fboName = '[FBO Name / Restaurant / Brand]',
    fboAddress = '[FBO Address]',
    productName = '[Food Item Name]',
    purchaseDate = '[Purchase Date]',
    purchaseInvoice = '[Invoice No]',
    violationDetails = '',
    calculations = {},
  } = data;

  const totalClaim = calculations.recommendedTotalCompensation || 0;

  return `REGISTERED POST WITH A.D. / SPEED POST / LEGAL NOTICE

Date: ${new Date().toISOString().split('T')[0]}

TO:
${fboName}
${fboAddress}

FROM:
${complainantName}
${complainantAddress}
Contact: ${complainantContact}

SUBJECT: STATUTORY LEGAL NOTICE UNDER SECTIONS 51, 52, 59, AND 65 OF THE FOOD SAFETY AND STANDARDS ACT, 2006 READ WITH THE CONSUMER PROTECTION ACT, 2019

Dear Sir/Madam,

Under instructions and on behalf of my client / by myself as an aggrieved consumer, this notice is addressed to you:

1. That on ${purchaseDate}, I purchased "${productName}" from your establishment / platform vide Invoice No. ${purchaseInvoice}.

2. That the food article served/sold by you was grossly adulterated, substandard, and/or unsafe in flagrant violation of FSSAI Schedule 4 sanitary standards and Section 26 of the FSSA 2006.
Particulars of Defect / Adulteration:
${violationDetails || 'Severe contamination and unhygienic preparation violating statutory standards.'}

3. That consumption of the aforesaid contaminated product caused acute physical distress, medical emergency, and substantial financial and emotional shock.

4. That under Section 65 of the Food Safety and Standards Act, 2006 and the Consumer Protection Act, 2019, you are strictly liable to compensate the victim for bodily injury, medical expenditure, and trauma.

I HEREBY CALL UPON YOU to pay a sum of ₹${totalClaim.toLocaleString('en-IN')}/- (Rupees ${numberToWordsIndian(totalClaim)} Only) towards medical reimbursement, damages, and statutory compensation, within fifteen (15) days from the receipt of this notice, failing which:
(a) A formal complaint under Section 68 shall be filed before the Adjudicating Officer (ADM) and District Designated Officer for cancellation of your FSSAI License;
(b) Criminal proceedings under Section 59 shall be instituted before the competent court;
(c) A consumer complaint under Section 35 of the Consumer Protection Act, 2019 shall be filed before the District Consumer Disputes Redressal Commission at your sole cost and consequence.

Yours faithfully,

________________________
(${complainantName})

DISCLAIMER:
${FOOD_SAFETY_LEGAL_DISCLAIMER}
`;
}

/**
 * DPDP Act 2023 compliant sanitizer for food safety cases.
 *
 * @param {Object} caseData
 * @returns {Object} Redacted case
 */
export function sanitizeFoodSafetyCase(caseData = {}) {
  const sanitized = JSON.parse(JSON.stringify(caseData || {}));

  if (sanitized.complainantContact) {
    sanitized.complainantContact = sanitized.complainantContact.replace(
      /\b\d{10}\b/g,
      (match) => `${match.slice(0, 2)}XXXXXX${match.slice(8)}`
    );
    sanitized.complainantContact = sanitized.complainantContact.replace(
      /([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g,
      (match, user, domain) => `${user.slice(0, 1)}***@${domain}`
    );
  }

  if (sanitized.complainantAddress) {
    sanitized.complainantAddress = sanitized.complainantAddress.replace(/\b\d{6}\b/g, 'XXXXXX');
  }

  return sanitized;
}

/**
 * Utility: Converts positive integer to Indian currency words representation.
 *
 * @param {number} num
 * @returns {string} Words
 */
export function numberToWordsIndian(num) {
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(v) {
    if (v < 20) return units[v];
    return `${tens[Math.floor(v / 10)]}${v % 10 ? ' ' + units[v % 10] : ''}`.trim();
  }

  function convertThreeDigits(v) {
    const h = Math.floor(v / 100);
    const rem = v % 100;
    const hStr = h > 0 ? `${units[h]} Hundred` : '';
    const remStr = rem > 0 ? convertTwoDigits(rem) : '';
    return `${hStr}${hStr && remStr ? ' and ' : ''}${remStr}`.trim();
  }

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  const parts = [];
  if (crore > 0) parts.push(`${convertThreeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${convertThreeDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${convertThreeDigits(thousand)} Thousand`);
  if (remainder > 0) parts.push(convertThreeDigits(remainder));

  return parts.join(' ').trim();
}
