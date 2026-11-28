/**
 * @file rbiOmbudsmanService.js
 * @description Statutory calculation and legal petition drafting engine for banking service deficiencies,
 * unauthorized digital debits (Zero Liability), and failed transaction TAT compensation under the
 * Reserve Bank of India (RBI) Integrated Ombudsman Scheme, 2021 (RB-IOS 2021).
 */

export const RBI_OMBUDSMAN_CLAUSES = {
  CLAUSE_11: 'Clause 11 - Grounds of Complaint before the Banking Ombudsman',
  CLAUSE_16: 'Clause 16 - Award and Compensation Powers (Up to ₹20,00,000 for loss + ₹1,00,000 for agony)',
  ZERO_LIABILITY_CIRCULAR: 'RBI/2017-18/15 DBR.No.Leg.BC.78/09.07.005/2017-18 - Customer Protection: Limiting Liability',
  HARMONISED_TAT_CIRCULAR: 'RBI/2019-20/67 DPSS.CO.PD No.629/02.01.014/2019-20 - Harmonisation of Turn Around Time (TAT)',
  PROPERTY_DOCS_CIRCULAR: 'RBI/2023-24/60 DoR.MCS.REC.38/01.01.001/2023-24 - Release of Property Documents within 30 Days (₹5,000/day penalty)',
  PREPAYMENT_PENALTY_CIRCULAR: 'RBI/2014-15/167 DBOD.No.Dir.BC.30/13.03.00/2014-15 - Prohibition of Prepayment Penalty on Floating Rate Loans',
};

export const TAT_CHANNELS = {
  ATM_CASH_FAILED: {
    id: 'ATM_CASH_FAILED',
    label: 'ATM Cash Withdrawal (Cash not dispensed, account debited)',
    tatDays: 5,
    penaltyPerDay: 100,
    tatRule: 'Pro-active auto-reversal within T+5 calendar days',
    circularRef: 'RBI Harmonised TAT Circular (Table 1, Item 1)',
  },
  UPI_FAILED: {
    id: 'UPI_FAILED',
    label: 'Failed UPI Payment (Account debited, beneficiary not credited, no reversal)',
    tatDays: 1,
    penaltyPerDay: 100,
    tatRule: 'Auto-reversal within T+1 calendar day',
    circularRef: 'RBI Harmonised TAT Circular (Table 1, Item 4)',
  },
  CARD_POS_FAILED: {
    id: 'CARD_POS_FAILED',
    label: 'Card Transaction at PoS / E-Commerce (Account debited, confirmation not received)',
    tatDays: 5,
    penaltyPerDay: 100,
    tatRule: 'Auto-reversal within T+5 calendar days',
    circularRef: 'RBI Harmonised TAT Circular (Table 1, Item 2)',
  },
  IMPS_NEFT_FAILED: {
    id: 'IMPS_NEFT_FAILED',
    label: 'IMPS / NEFT Failed Transfer (Beneficiary not credited, money withheld)',
    tatDays: 1,
    penaltyPerDay: 100,
    tatRule: 'Reversal within T+1 calendar day (T+2 for NEFT batch)',
    circularRef: 'RBI Harmonised TAT Circular (Table 1, Item 3)',
  },
  PROPERTY_DOCS_DELAYED: {
    id: 'PROPERTY_DOCS_DELAYED',
    label: 'Delayed Return of Original Property Deeds after Full Loan Closure',
    tatDays: 30,
    penaltyPerDay: 5000,
    tatRule: 'Mandatory return of original title deeds within 30 days of loan settlement',
    circularRef: 'RBI Release of Property Documents Directions, 2023',
  },
};

export const DEFICIENCY_CATEGORIES = {
  UNAUTHORIZED_DEBIT: {
    id: 'unauthorized_debit',
    label: 'Unauthorized Electronic Debit / Phishing without OTP sharing (Zero Liability)',
    clause: 'Clause 11(2)(a)',
    standardCompensation: 'Full refund + Shadow credit within 10 working days',
  },
  FAILED_TRANSACTION_DELAY: {
    id: 'failed_transaction_delay',
    label: 'Failure to Reverse Failed ATM/UPI/Card Debit within Harmonised TAT',
    clause: 'Clause 11(2)(b)',
    standardCompensation: 'Statutory ₹100/day compensation beyond TAT',
  },
  DELAYED_PROPERTY_DOCUMENTS: {
    id: 'delayed_property_documents',
    label: 'Delay in Returning Original Title Documents after Loan Repayment (>30 Days)',
    clause: 'Clause 11(2)(c)',
    standardCompensation: 'Statutory ₹5,000/day compensation beyond 30 days',
  },
  UNLAWFUL_PREPAYMENT_PENALTY: {
    id: 'unlawful_prepayment_penalty',
    label: 'Arbitrary Pre-payment / Foreclosure Penalty on Individual Floating Rate Loan',
    clause: 'Clause 11(2)(d)',
    standardCompensation: 'Immediate refund of entire penalty plus interest',
  },
  PENSION_CALCULATION_ERROR: {
    id: 'pension_calculation_error',
    label: 'Delayed Pension Disbursement or Erroneous Dearness Relief (DR) Arrears',
    clause: 'Clause 11(2)(e)',
    standardCompensation: 'Differential arrears plus penal interest at Bank Rate + 2%',
  },
  RECOVERY_AGENT_HARASSMENT: {
    id: 'recovery_agent_harassment',
    label: 'Harassment / Abusive Recovery Tactics / Calls Outside 8 AM - 7 PM Window',
    clause: 'Clause 11(2)(f)',
    standardCompensation: 'Damages for harassment up to ₹1,00,000 under Clause 16(2)',
  },
};

export const OMBUDSMAN_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '1. Internal Audit (Draft)' },
  { value: 'BRANCH_COMPLAINT_FILED', label: '2. Formal Branch Complaint Registered' },
  { value: 'PNO_ESCALATED', label: '3. Escalated to Principal Nodal Officer (PNO)' },
  { value: 'CMS_OMBUDSMAN_FILED', label: '4. RBI CMS Ombudsman Complaint Lodged' },
  { value: 'AWARD_PASSED_SETTLED', label: '5. Compensation Award Passed & Credited' },
  { value: 'CLOSED', label: '6. Closed / Resolved' },
];

export const RBI_LEGAL_DISCLAIMER =
  'CITIZEN ADVISORY & STATUTORY NOTICE: This calculation and draft representation are prepared locally under the RBI Integrated Ombudsman Scheme, 2021 and RBI Master Directions on Customer Protection. Generating this draft does not constitute automatic filing. The formal complaint must be lodged on the official RBI Complaint Management System (CMS) at cms.rbi.org.in or submitted directly to the bank\'s Principal Nodal Officer (PNO).';

/**
 * Calculates customer liability and bank shadow credit entitlement under RBI Zero Liability Circular.
 *
 * @param {Object} data
 * @param {number} data.reportingDays - Working days elapsed between notification and reporting
 * @param {number} data.transactionAmount - Fraudulent/unauthorized debit amount in INR
 * @param {string} [data.accountType='SAVINGS_CURRENT'] - 'BSBD' | 'SAVINGS_CURRENT' | 'CREDIT_CARD_ABOVE_5L'
 * @returns {Object} Comprehensive calculation
 */
export function calculateZeroLiability(data = {}) {
  const {
    reportingDays = 0,
    transactionAmount = 0,
    accountType = 'SAVINGS_CURRENT',
  } = data;

  const days = Math.max(0, Number(reportingDays) || 0);
  const amount = Math.max(0, Number(transactionAmount) || 0);

  let customerLiability;
  let bankLiability;
  let liabilityTier;
  let tierLabel;
  let shadowCreditMandatory;
  let shadowCreditDays = 10; // Within 10 working days under RBI circular

  if (days <= 3) {
    customerLiability = 0;
    bankLiability = amount;
    liabilityTier = 'ZERO_CUSTOMER_LIABILITY';
    tierLabel = 'Zero Customer Liability (Reported within 3 working days)';
    shadowCreditMandatory = true;
  } else if (days <= 7) {
    liabilityTier = 'LIMITED_CUSTOMER_LIABILITY';
    let cap = 10000;
    if (accountType === 'BSBD') {
      cap = 5000;
    } else if (accountType === 'CREDIT_CARD_ABOVE_5L') {
      cap = 25000;
    }
    customerLiability = Math.min(amount, cap);
    bankLiability = Math.max(0, amount - customerLiability);
    tierLabel = `Limited Liability Capped at ₹${cap.toLocaleString('en-IN')} (Reported in 4-7 days)`;
    shadowCreditMandatory = true;
  } else {
    liabilityTier = 'BOARD_POLICY_LIABILITY';
    tierLabel = 'Subject to Bank Board Policy (Reported after 7 working days)';
    customerLiability = amount; // Subject to Ombudsman determination
    bankLiability = 0;
    shadowCreditMandatory = false;
    shadowCreditDays = 0;
  }

  return {
    reportingDays: days,
    transactionAmount: amount,
    accountType,
    customerLiability,
    bankLiability,
    liabilityTier,
    tierLabel,
    shadowCreditMandatory,
    shadowCreditDays,
    claimableRefund: bankLiability,
  };
}

/**
 * Calculates statutory delay compensation for failed transactions or property document delays.
 *
 * @param {Object} data
 * @param {string} data.channelId - Key in TAT_CHANNELS
 * @param {string} data.transactionDate - YYYY-MM-DD
 * @param {string} [data.resolutionDate] - YYYY-MM-DD (or defaults to today)
 * @param {number} [data.transactionAmount=0] - Transaction amount in INR
 * @returns {Object} Compensation breakdown
 */
export function calculateTatCompensation(data = {}) {
  const {
    channelId = 'ATM_CASH_FAILED',
    transactionDate = '',
    resolutionDate = '',
    transactionAmount = 0,
  } = data;

  const channel = TAT_CHANNELS[channelId] || TAT_CHANNELS.ATM_CASH_FAILED;
  const principal = Math.max(0, Number(transactionAmount) || 0);

  let elapsedDays = 0;
  if (transactionDate) {
    const start = new Date(transactionDate).getTime();
    const end = resolutionDate ? new Date(resolutionDate).getTime() : Date.now();
    const diffMs = end - start;
    elapsedDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const allowableTatDays = channel.tatDays;
  const delayDays = Math.max(0, elapsedDays - allowableTatDays);
  const statutoryCompensation = delayDays * channel.penaltyPerDay;
  const totalAmountPayable = principal + statutoryCompensation;

  return {
    channel,
    elapsedDays,
    allowableTatDays,
    delayDays,
    penaltyRatePerDay: channel.penaltyPerDay,
    statutoryCompensation,
    principalAmount: principal,
    totalAmountPayable,
    isDelayed: delayDays > 0,
  };
}

/**
 * Drafts formal representation to the Bank's Principal Nodal Officer (PNO).
 *
 * @param {Object} data
 * @returns {string} Formatted letter text
 */
export function generatePnoComplaintLetter(data = {}) {
  const {
    complainantName = '[Customer Full Name]',
    complainantContact = '[Phone & Email]',
    complainantAddress = '[Customer Address]',
    bankName = '[Bank Name, e.g. State Bank of India / HDFC Bank]',
    branchName = '[Branch Name / IFSC Code]',
    accountNumber = '[Account / Credit Card No.]',
    disputeType = 'UNAUTHORIZED_DEBIT',
    transactionDate = '[YYYY-MM-DD]',
    transactionAmount = 0,
    ticketNumber = '[Initial Branch Ticket / Reference No., if any]',
    calculations = {},
    incidentDetails = '',
  } = data;

  const claimable = calculations.claimableRefund ?? transactionAmount;
  const compensation = calculations.statutoryCompensation || 0;
  const totalDemand = claimable + compensation;

  return `TO:
THE PRINCIPAL NODAL OFFICER (PNO) / CHIEF GRIEVANCE REDRESSAL OFFICER
${bankName}
HEAD OFFICE / ZONAL GRIEVANCE DIVISION

SUBJECT: FORMAL STATUTORY COMPLAINT UNDER RBI INTEGRATED OMBUDSMAN SCHEME, 2021 & MASTER DIRECTIONS ON CUSTOMER PROTECTION
REGARDING: ACCOUNT NO.: ${accountNumber} | BRANCH: ${branchName}
PREVIOUS TICKET REF: ${ticketNumber || 'Direct Escalation to PNO upon Branch Non-Resolution'}

Respected Sir/Madam,

I am writing to register a formal grievance regarding a severe service deficiency and failure to adhere to mandatory Reserve Bank of India (RBI) customer protection circulars:

1. PARTICULARS OF DISPUTED TRANSACTION:
- Account / Card / CIF Number: ${accountNumber}
- Date of Occurrence: ${transactionDate}
- Nature of Deficiency: ${disputeType}
- Transaction Amount Withheld / Debited: ₹${Number(transactionAmount).toLocaleString('en-IN')}/-
- Date of Reporting to Bank: Within statutory zero-liability window

2. SUMMARY OF SERVICE DEFICIENCY & REGULATORY VIOLATIONS:
${incidentDetails || 'The customer suffered an unauthorized debit or failed transaction that the bank failed to reverse within statutory timelines.'}

Under RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18 and the Harmonisation of TAT Circular:
(a) The customer reported the breach promptly, entitling the customer to Zero Liability / Statutory Reversal.
(b) The bank is mandated to provide shadow credit within 10 working days and pay statutory delay compensation of ₹${calculations.penaltyRatePerDay || 100}/- per day for delays beyond allowable TAT.

3. STATUTORY MONETARY DEMAND:
- Refund / Reversal of Principal Amount: ₹${Number(claimable).toLocaleString('en-IN')}/-
- Statutory Delay Compensation under RBI TAT Circular: ₹${Number(compensation).toLocaleString('en-IN')}/- (${calculations.delayDays || 0} days delay)
- Total Amount Payable to Customer: ₹${Number(totalDemand).toLocaleString('en-IN')}/-

4. 30-DAY NOTICE BEFORE APPROACHING RBI OMBUDSMAN:
Please take note that if the aforesaid sum is not credited to my account within thirty (30) days from the date of this letter, or if an unsatisfactory response is received, I shall forthwith lodge a formal complaint before the Reserve Bank of India Integrated Ombudsman via the Complaint Management System (CMS) under Clause 11 of the Scheme, seeking full reimbursement plus ₹1,00,000/- for mental agony and harassment under Clause 16(2).

Yours faithfully,

________________________
${complainantName}
Contact: ${complainantContact}
Address: ${complainantAddress}

DISCLAIMER:
${RBI_LEGAL_DISCLAIMER}
`;
}

/**
 * Drafts formal petition to the RBI Integrated Ombudsman under Clause 11 of RB-IOS 2021.
 *
 * @param {Object} data
 * @returns {string} Formatted petition text
 */
export function generateRbiOmbudsmanPetition(data = {}) {
  const {
    complainantName = '[Customer Full Name]',
    complainantContact = '[Phone & Email]',
    complainantAddress = '[Customer Address]',
    bankName = '[Regulated Entity / Bank Name]',
    branchName = '[Branch / Digital Banking Unit]',
    accountNumber = '[Account / Card No.]',
    pnoComplaintDate = '[Date PNO Letter Sent]',
    pnoRefNumber = '[PNO Grievance Ticket No.]',
    transactionAmount = 0,
    disputeDetails = '',
    calculations = {},
  } = data;

  const claimable = calculations.claimableRefund ?? transactionAmount;
  const compensation = calculations.statutoryCompensation || 0;
  const totalClaim = claimable + compensation;

  return `BEFORE THE RESERVE BANK - INTEGRATED OMBUDSMAN (CENTRAL RECEPTION & CMS CELL)
UNDER CLAUSES 10, 11, AND 16 OF THE RESERVE BANK - INTEGRATED OMBUDSMAN SCHEME, 2021 (RB-IOS 2021)

IN THE MATTER OF:
${complainantName}
Residing at: ${complainantAddress}
Contact: ${complainantContact}
... COMPLAINANT / BANK CONSUMER

VERSUS

${bankName}
Branch / Office: ${branchName}
... OPPOSITE PARTY / REGULATED ENTITY (RE)

MOST RESPECTFULLY SHOWETH:

1. JURISDICTION & EXHAUSTION OF INTERNAL REDRESSAL:
The Complainant is an aggrieved customer of the Opposite Party bank. A formal representation was submitted to the Bank's Principal Nodal Officer on ${pnoComplaintDate} (Ref: ${pnoRefNumber || 'Receipt Acknowledged'}). Over 30 days have elapsed without full resolution, conferring lawful jurisdiction upon this Hon'ble Ombudsman under Clause 10(2) of the Scheme.

2. SUBJECT MATTER OF COMPLAINT:
- Account / Instrument Identifier: ${accountNumber}
- Total Disputed Amount: ₹${Number(transactionAmount).toLocaleString('en-IN')}/-
- Nature of Violation: Statutory deficiency in banking service under Clause 11(2) of RB-IOS 2021.

3. GROUNDS OF COMPLAINT & CIRCULAR NON-COMPLIANCE:
${disputeDetails || 'The Opposite Party has arbitrarily withheld customer funds and refused to comply with RBI Customer Protection (Zero Liability) directions and Harmonised TAT penalties.'}

4. QUANTUM OF CLAIMS UNDER CLAUSE 16:
(a) Reimbursement of disputed transaction amount: ₹${Number(claimable).toLocaleString('en-IN')}/-
(b) Statutory delay compensation under RBI Harmonised TAT: ₹${Number(compensation).toLocaleString('en-IN')}/-
(c) Compensation for mental agony, harassment, and legal expenses under Clause 16(2): ₹50,000/-
TOTAL CLAIM BEFORE THE OMBUDSMAN: ₹${(totalClaim + 50000).toLocaleString('en-IN')}/-

5. PRAYER:
It is most respectfully prayed that this Hon'ble Ombudsman may be pleased to:
a) Pass an Award directing the Opposite Party bank to immediately credit ₹${Number(totalClaim).toLocaleString('en-IN')}/- to the Complainant's account;
b) Award compensation of ₹50,000/- for harassment and wrongful deprivation of funds;
c) Initiate supervisory censure against the Opposite Party for persistent violation of RBI Master Directions.

VERIFICATION:
I, ${complainantName}, do hereby verify that the facts stated above are true to my personal knowledge and backed by transaction records.

Date: ${new Date().toISOString().split('T')[0]}
Place: [City / State]

________________________
(Signature of Complainant)

DISCLAIMER:
${RBI_LEGAL_DISCLAIMER}
`;
}

/**
 * DPDP Act 2023 compliant sanitizer for banking dispute cases.
 *
 * @param {Object} caseData
 * @returns {Object} Sanitized copy
 */
export function sanitizeBankingCase(caseData = {}) {
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

  if (sanitized.accountNumber) {
    // Mask all but last 4 digits of account / card number
    sanitized.accountNumber = sanitized.accountNumber.replace(
      /\b(?:\d[ -]?){10,16}\b/g,
      (match) => {
        const clean = match.replace(/[\s-]/g, '');
        return `XXXX-XXXX-${clean.slice(-4)}`;
      }
    );
  }

  return sanitized;
}
