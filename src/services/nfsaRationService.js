/**
 * National Food Security Act (NFSA 2013) & TPDS Service
 * Implements statutory calculation for ration entitlements, weighment deficits,
 * e-PoS biometric failure exception audits, Food Security Allowance (Section 8),
 * and DGRO (Section 15) / State Food Commission (Section 16) dossier drafting.
 */

export const NFSA_CARD_TYPES = {
  AAY: {
    code: 'AAY',
    label: 'Antyodaya Anna Yojana (AAY)',
    category: 'Poorest of Poor',
    fixedEntitlementKg: 35, // per household per month
    perPersonKg: 0,
    rationFormula: 'household_fixed',
    description: 'Statutory 35 kg foodgrains per family per month regardless of family size under Section 3(1).'
  },
  PHH: {
    code: 'PHH',
    label: 'Priority Household (PHH)',
    category: 'Eligible Household',
    fixedEntitlementKg: 0,
    perPersonKg: 5, // 5 kg per member per month
    rationFormula: 'per_capita',
    description: 'Statutory 5 kg foodgrains per person per month under Section 3(1).'
  },
  NON_NFSA: {
    code: 'NON_NFSA',
    label: 'State Discretionary / Non-NFSA',
    category: 'General / Above Poverty Line',
    fixedEntitlementKg: 10,
    perPersonKg: 2,
    rationFormula: 'state_discretionary',
    description: 'State-level subsidized or quota allotment subject to state food rules.'
  }
};

export const STATUTORY_COMMODITY_PRICES = {
  RICE: {
    name: 'Rice',
    nfsaCipPerKg: 3.00, // Central Issue Price under Schedule I
    pmgkayPricePerKg: 0.00, // Free under Pradhan Mantri Garib Kalyan Anna Yojana
    currentMspPerKg: 23.00, // For Food Security Allowance calculation
    defaultRatio: 0.60 // Typical 60% rice, 40% wheat split
  },
  WHEAT: {
    name: 'Wheat',
    nfsaCipPerKg: 2.00,
    pmgkayPricePerKg: 0.00,
    currentMspPerKg: 22.75,
    defaultRatio: 0.40
  },
  COARSE_GRAINS: {
    name: 'Coarse Grains / Millets (Nutri-Cereals)',
    nfsaCipPerKg: 1.00,
    pmgkayPricePerKg: 0.00,
    currentMspPerKg: 25.00,
    defaultRatio: 0.00
  }
};

export const BIOMETRIC_FAILURE_MODES = {
  FINGERPRINT_ATTRITION: {
    code: 'FINGERPRINT_ATTRITION',
    label: 'Fingerprint Sensor Failure / Fingerprint Attrition',
    description: 'Worn fingerprints due to manual labor, aging, leprosy, or dry skin leading to repeated e-PoS rejection.',
    statutoryMandate: 'Supreme Court & Ministry Guidelines prohibit denial of ration; mandatory manual register or OTP fallback.'
  },
  IRIS_SCANNER_DEFECT: {
    code: 'IRIS_SCANNER_DEFECT',
    label: 'Iris Scanner Unavailable / Eye Pathology',
    description: 'Fair Price Shop lacks functioning iris scanner or beneficiary has cataract/corneal opacity.',
    statutoryMandate: 'Dealer must deploy OTP or authorized nominee fallback.'
  },
  EPOS_NETWORK_OUTAGE: {
    code: 'EPOS_NETWORK_OUTAGE',
    label: 'e-PoS Connectivity / Server Timeout',
    description: 'e-PoS machine offline, no telecom tower signal, or UIDAI / State PDS server gateway timeout.',
    statutoryMandate: 'Offline mode distribution with manual register recording mandated by TPDS Control Order.'
  },
  SERVER_UIDAI_GATEWAY_FAIL: {
    code: 'SERVER_UIDAI_GATEWAY_FAIL',
    label: 'UIDAI CIDR Authentication Failure',
    description: 'Error code 300/998/999 from Central Identities Data Repository.',
    statutoryMandate: 'Dealer is legally barred from sending cardholder away empty-handed.'
  }
};

export const FALLBACK_MECHANISMS = {
  OTP_MOBILE: {
    code: 'OTP_MOBILE',
    label: 'Aadhaar Registered Mobile OTP',
    statutoryRef: 'Section 12, NFSA 2013'
  },
  NOMINEE_PROXY: {
    code: 'NOMINEE_PROXY',
    label: 'Designated Family Nominee / Proxy Biometric',
    statutoryRef: 'NFSA Nominee Rule for Senior Citizens & PwDs'
  },
  MANUAL_EXEMPTION_REGISTER: {
    code: 'MANUAL_EXEMPTION_REGISTER',
    label: 'Manual Exemption Register Entry + Signature / Thumbprint',
    statutoryRef: 'Clause 8, TPDS (Control) Order 2015 & State PDS Circular'
  }
};

export const RATION_VIOLATION_TYPES = {
  BIOMETRIC_DENIAL_NO_FALLBACK: {
    label: 'Refusal of Ration Due to Biometric Failure without Fallback',
    severity: 'CRITICAL',
    clause: 'NFSA Section 12 & Ministry Circular No. 17-1/2017-Comp'
  },
  SHORT_WEIGHING: {
    label: 'Short-Weighing / Cut in Quantity (e.g. Bag Deduction)',
    severity: 'HIGH',
    clause: 'Legal Metrology Act, 2009 & Clause 10, TPDS Control Order'
  },
  PRICE_OVERCHARGING: {
    label: 'Overcharging Above Statutory / PMGKAY Price',
    severity: 'HIGH',
    clause: 'Schedule I, NFSA 2013 & EC Act 1955 Section 3/7'
  },
  NON_SUPPLY_DELAY: {
    label: 'Delayed or Denied Monthly Supply (Food Security Allowance Applicable)',
    severity: 'HIGH',
    clause: 'Section 8, NFSA 2013 & Food Security Allowance Rules 2015'
  },
  FORCED_TIED_PURCHASE: {
    label: 'Forced Purchase of Non-PDS Goods (Tea, Soap, etc.)',
    severity: 'MEDIUM',
    clause: 'Clause 9(6), TPDS Control Order 2015'
  },
  RECEIPT_REFUSAL: {
    label: 'Refusal to Issue Printed e-PoS Transaction Receipt',
    severity: 'MEDIUM',
    clause: 'Clause 11, TPDS Control Order 2015'
  }
};

/**
 * Mask sensitive PII identifiers (Aadhaar, Ration Card)
 */
export function maskIdentifier(value, prefix = 'ID') {
  if (!value || typeof value !== 'string') return `${prefix}-XXXX`;
  const clean = value.replace(/\s+/g, '');
  if (clean.length <= 4) return `${prefix}-****`;
  const last4 = clean.slice(-4);
  return `${clean.slice(0, 2)}${'*'.repeat(Math.max(2, clean.length - 6))}${last4}`;
}

/**
 * Calculates monthly statutory entitlement under Section 3
 */
export function calculateEntitlement({
  cardType = 'PHH',
  familyMembers = 4,
  scheme = 'PMGKAY_FREE',
  splitRatio = { rice: 0.6, wheat: 0.4 }
}) {
  const safeMembers = Math.max(1, parseInt(familyMembers, 10) || 1);
  const cardConfig = NFSA_CARD_TYPES[cardType] || NFSA_CARD_TYPES.PHH;

  let totalGrainKg;
  if (cardConfig.code === 'AAY') {
    totalGrainKg = 35; // 35 kg fixed per household
  } else if (cardConfig.code === 'PHH') {
    totalGrainKg = safeMembers * 5; // 5 kg per person
  } else {
    totalGrainKg = 10 + safeMembers * 2;
  }

  const riceRatio = typeof splitRatio?.rice === 'number' ? splitRatio.rice : 0.6;
  const wheatRatio = typeof splitRatio?.wheat === 'number' ? splitRatio.wheat : 0.4;
  const sumRatio = (riceRatio + wheatRatio) || 1;

  const riceKg = Math.round((totalGrainKg * (riceRatio / sumRatio)) * 10) / 10;
  const wheatKg = Math.round((totalGrainKg - riceKg) * 10) / 10;

  const isFree = scheme === 'PMGKAY_FREE';
  const riceRate = isFree ? 0 : STATUTORY_COMMODITY_PRICES.RICE.nfsaCipPerKg;
  const wheatRate = isFree ? 0 : STATUTORY_COMMODITY_PRICES.WHEAT.nfsaCipPerKg;

  const statutoryCost = Math.round((riceKg * riceRate + wheatKg * wheatRate) * 100) / 100;

  return {
    cardType: cardConfig.code,
    cardLabel: cardConfig.label,
    familyMembers: safeMembers,
    totalGrainKg,
    riceKg,
    wheatKg,
    riceRate,
    wheatRate,
    statutoryCost,
    isFreeScheme: isFree,
    statutoryBasis: cardConfig.code === 'AAY' 
      ? 'Section 3(1) NFSA - 35 kg/family fixed entitlement'
      : 'Section 3(1) NFSA - 5 kg/member per month entitlement'
  };
}

/**
 * Audits weighment deficit and overcharge
 */
export function auditWeighmentAndCost({
  entitlement,
  actualDeliveredKg = 0,
  actualChargedRupees = 0
}) {
  const entitledKg = entitlement.totalGrainKg || 0;
  const safeDeliveredKg = Math.max(0, parseFloat(actualDeliveredKg) || 0);
  const safeChargedRupees = Math.max(0, parseFloat(actualChargedRupees) || 0);

  const deficitKg = Math.max(0, Math.round((entitledKg - safeDeliveredKg) * 10) / 10);
  const deficitPercentage = entitledKg > 0 ? Math.round((deficitKg / entitledKg) * 1000) / 10 : 0;

  const expectedCost = entitlement.statutoryCost || 0;
  const overchargeRupees = Math.max(0, Math.round((safeChargedRupees - expectedCost) * 100) / 100);

  const hasWeighmentDeficit = deficitKg > 0.5; // allowance for > 500g cutoff
  const hasOvercharging = overchargeRupees > 0;

  return {
    entitledKg,
    actualDeliveredKg: safeDeliveredKg,
    deficitKg,
    deficitPercentage,
    expectedCost,
    actualChargedRupees: safeChargedRupees,
    overchargeRupees,
    hasWeighmentDeficit,
    hasOvercharging,
    isCompliant: !hasWeighmentDeficit && !hasOvercharging
  };
}

/**
 * Calculates Food Security Allowance (FSA) under Section 8
 * Formula: Deficit grain quantity * MSP (or statutory Central Issue Price multiple)
 */
export function calculateFoodSecurityAllowance({
  deficitKg = 0,
  delayedDays = 0,
  commoditySplit = { riceRatio: 0.6, wheatRatio: 0.4 }
}) {
  const safeDeficit = Math.max(0, parseFloat(deficitKg) || 0);
  const safeDays = Math.max(0, parseInt(delayedDays, 10) || 0);

  const riceDeficitKg = Math.round((safeDeficit * (commoditySplit.riceRatio || 0.6)) * 10) / 10;
  const wheatDeficitKg = Math.round((safeDeficit - riceDeficitKg) * 10) / 10;

  const riceMsp = STATUTORY_COMMODITY_PRICES.RICE.currentMspPerKg;
  const wheatMsp = STATUTORY_COMMODITY_PRICES.WHEAT.currentMspPerKg;

  const baseAllowance = Math.round((riceDeficitKg * riceMsp + wheatDeficitKg * wheatMsp) * 100) / 100;

  // Food Security Allowance Rules, 2015: If payment or grain is delayed past 3rd week of subsequent month:
  // Statutory interest/compensation multiplier for prolonged deprivation
  const isDelayedPastStatutoryDeadline = safeDays > 21;
  const delayPenaltyInterest = isDelayedPastStatutoryDeadline
    ? Math.round((baseAllowance * 0.12 * (safeDays / 365)) * 100) / 100
    : 0;

  const totalFoodSecurityAllowance = Math.round((baseAllowance + delayPenaltyInterest) * 100) / 100;

  return {
    safeDeficit,
    riceDeficitKg,
    wheatDeficitKg,
    baseAllowance,
    safeDays,
    isDelayedPastStatutoryDeadline,
    delayPenaltyInterest,
    totalFoodSecurityAllowance,
    statutorySection: 'Section 8, NFSA 2013 read with Food Security Allowance Rules, 2015',
    payableBy: 'Department of Food & Civil Supplies, State Government via DGRO order'
  };
}

/**
 * Evaluates Biometric Denial & Fallback Compliance
 */
export function auditBiometricFallbackCompliance({
  failureMode = 'FINGERPRINT_ATTRITION',
  fallbackOffered = 'NONE',
  refusalOfRation = true,
  offlineRegisterAvailable = false
}) {
  const mode = BIOMETRIC_FAILURE_MODES[failureMode] || BIOMETRIC_FAILURE_MODES.FINGERPRINT_ATTRITION;
  const isIllegalDenial = refusalOfRation && (fallbackOffered === 'NONE' || fallbackOffered === 'REFUSED');

  const fallbackMandated = [
    '1. Mobile OTP Authentication on Aadhaar-linked phone',
    '2. Authentication via Designated Nominee / Proxy (for elderly / disabled)',
    '3. Physical Exemption Register entry with local vigilance / ward counter-signature'
  ];

  return {
    failureMode: mode.label,
    failureDescription: mode.description,
    fallbackOffered,
    isIllegalDenial,
    statutoryInfraction: isIllegalDenial 
      ? 'DIRECT STATUTORY BREACH: Denial of foodgrains due to biometric sensor failure violates Supreme Court directives and Section 12 of NFSA 2013.'
      : 'COMPLIANT: Fallback mechanism was properly invoked.',
    fallbackMandated,
    offlineRegisterStatus: offlineRegisterAvailable ? 'Available' : 'Dealer refused / failed to maintain'
  };
}

/**
 * Drafts Formal Petition to the District Grievance Redressal Officer (DGRO) under Section 15
 */
export function generateDgroComplaintDossier({
  complainantName,
  maskedRationCard,
  maskedAadhaar,
  cardType,
  familyMembers,
  fairPriceShopNo,
  dealerName,
  shopLocation,
  district,
  state,
  monthYear,
  auditResult,
  fsaResult,
  biometricAudit,
  selectedViolations = []
}) {
  const violationsList = selectedViolations.length > 0 
    ? selectedViolations.map((v, i) => `  ${i + 1}. ${v}`).join('\n')
    : '  1. Arbitrary denial / short-supply of statutory foodgrains.';

  return `BEFORE THE DISTRICT GRIEVANCE REDRESSAL OFFICER (DGRO) / ADDITIONAL DISTRICT MAGISTRATE (ADM)
DISTRICT: ${district || '[DISTRICT]'}, STATE: ${state || '[STATE]'}
PETITION UNDER SECTION 15 OF THE NATIONAL FOOD SECURITY ACT, 2013 (NFSA)
READ WITH TARGETED PUBLIC DISTRIBUTION SYSTEM (CONTROL) ORDER, 2015

IN THE MATTER OF:
Complainant:
  Name: ${complainantName || '[NAME]'}
  Ration Card No: ${maskedRationCard || 'RC-XXXXXX'} (${cardType || 'PHH'})
  Aadhaar Card: ${maskedAadhaar || 'XXXX-XXXX-XXXX'}
  Family Members: ${familyMembers || 4}
  Resident of: District ${district || '[DISTRICT]'}, ${state || '[STATE]'}

VERSUS

Respondent:
  Fair Price Shop (FPS) Licensee: ${dealerName || '[DEALER NAME]'}
  FPS Shop Code / ID: ${fairPriceShopNo || '[FPS NO]'}
  Location: ${shopLocation || '[SHOP ADDRESS]'}

SUBJECT: COMPLAINT UNDER SECTION 15 OF NFSA 2013 FOR UNLAWFUL DENIAL / SHORT-WEIGHING / BIOMETRIC EXCLUSION OF STATUTORY FOODGRAIN QUOTA FOR THE MONTH OF ${monthYear || '[MONTH/YEAR]'} AND CLAIM FOR FOOD SECURITY ALLOWANCE UNDER SECTION 8.

MOST RESPECTFULLY SHOWETH:

1. STATUTORY ENTITLEMENT:
The Complainant holds a valid ${cardType || 'PHH'} Ration Card under the National Food Security Act, 2013. Under Section 3(1) and Schedule I of the Act, the Complainant's household is statutorily entitled to ${auditResult?.entitledKg || 0} kg of foodgrains (Rice: ${auditResult?.riceKg || 0} kg, Wheat: ${auditResult?.wheatKg || 0} kg) for the distribution period of ${monthYear || '[MONTH/YEAR]'}.

2. DETAILS OF GRIEVANCE & STATUTORY INFRACTIONS:
${violationsList}

3. BIOMETRIC FAILURE & DENIAL OF STATUTORY FALLBACK:
${biometricAudit?.isIllegalDenial ? `The Complainant attempted authentication at the e-PoS terminal, which failed due to "${biometricAudit?.failureMode}". Despite explicit Supreme Court directives and Central Ministry guidelines prohibiting denial of ration on biometric grounds, the Respondent Fair Price Shop dealer unlawfully refused to provide statutory fallback (OTP / Nominee / Manual Exemption Register) and sent the Complainant away empty-handed.` : 'Ration distribution discrepancy audited.'}

4. QUANTITY SHORTFALL & OVERCHARGING AUDIT:
- Entitled Quantity: ${auditResult?.entitledKg || 0} kg
- Actual Quantity Delivered: ${auditResult?.actualDeliveredKg || 0} kg
- Unlawful Deficit / Short-weighing: ${auditResult?.deficitKg || 0} kg (${auditResult?.deficitPercentage || 0}% shortfall)
- Statutory / PMGKAY Price: ₹${auditResult?.expectedCost || 0}
- Amount Illegally Charged by Dealer: ₹${auditResult?.actualChargedRupees || 0} (Illegal Extortion: ₹${auditResult?.overchargeRupees || 0})

5. STATUTORY FOOD SECURITY ALLOWANCE (SECTION 8):
Under Section 8 of the NFSA 2013 read with the Food Security Allowance Rules, 2015, the Complainant is entitled to receive Food Security Allowance calculated at Minimum Support Price for non-supplied foodgrains:
- Statutory Food Security Allowance Due: ₹${fsaResult?.totalFoodSecurityAllowance || 0}
- Statutory Delay Multiplier / Penalty: ₹${fsaResult?.delayPenaltyInterest || 0}

PRAYER:
WHEREFORE, it is respectfully prayed that this Learned Authority may graciously be pleased to:
a) Direct the Respondent Fair Price Shop dealer to forthwith release the deficit quota of ${auditResult?.deficitKg || 0} kg foodgrains to the Complainant;
b) Award statutory Food Security Allowance of ₹${fsaResult?.totalFoodSecurityAllowance || 0} under Section 8 of the NFSA 2013;
c) Order inspection of the e-PoS electronic weighing scale and physical stock ledger under Clause 10 of the TPDS (Control) Order, 2015;
d) Initiate punitive disciplinary proceedings, including suspension/cancellation of FPS license and forfeiture of security deposit under Section 15(2).

Verification:
I, the Complainant above-named, do hereby verify that the facts stated above are true and correct to my personal knowledge and belief.

Date: ${new Date().toLocaleDateString('en-IN')}
Place: ${district || '[DISTRICT]'}
Signature / Thumb Impression of Complainant
`;
}

/**
 * Drafts Formal Appeal to the State Food Commission under Section 16
 */
export function generateFoodCommissionAppealDossier({
  complainantName,
  maskedRationCard,
  dgroOrderNo,
  dgroOrderDate,
  district,
  state,
  appealGrounds,
  fsaAmount
}) {
  return `BEFORE THE HON'BLE STATE FOOD COMMISSION
CONSTITUTED UNDER SECTION 16 OF THE NATIONAL FOOD SECURITY ACT, 2013
STATE OF ${state || '[STATE]'}

STATUTORY APPEAL NO: [TO BE ASSIGNED] / ${new Date().getFullYear()}
(AGAINST THE ORDER / INACTION OF THE DISTRICT GRIEVANCE REDRESSAL OFFICER, DISTRICT ${district || '[DISTRICT]'})

IN THE MATTER OF:
Appellant:
  Name: ${complainantName || '[APPELLANT NAME]'}
  Ration Card: ${maskedRationCard || 'RC-XXXXXX'}
  District: ${district || '[DISTRICT]'}, State: ${state || '[STATE]'}

VERSUS

Respondents:
  1. District Grievance Redressal Officer (DGRO), District ${district || '[DISTRICT]'}
  2. District Supply Officer / Food & Civil Supplies Department
  3. Fair Price Shop Licensee

SUBJECT: STATUTORY APPEAL UNDER SECTION 16(5) OF THE NATIONAL FOOD SECURITY ACT, 2013 AGAINST INACTION / ARBITRARY DISMISSAL OF RATION DENIAL COMPLAINT BY DGRO.

1. IMPUGNED ACTION / ORDER:
This appeal is filed against Order / Grievance Token No. ${dgroOrderNo || '[DGRO TOKEN/ORDER]'} dated ${dgroOrderDate || '[DATE]'}, wherein the DGRO failed to ensure supply of entitled foodgrains and failed to disburse Food Security Allowance under Section 8.

2. GROUNDS OF APPEAL:
${appealGrounds || 'a) The DGRO failed to enforce the mandatory fallback mechanism under Section 12 of NFSA.\nb) The DGRO failed to direct payment of Food Security Allowance despite undisputed non-supply of monthly grain.\nc) Biometric exclusion continues unabated at Fair Price Shop, causing hunger and acute deprivation.'}

3. POWERS OF STATE FOOD COMMISSION:
Under Section 20 of the NFSA 2013, this Hon'ble Commission possesses all the powers of a Civil Court trying a suit under the Code of Civil Procedure, 1908, including summoning witnesses, discovery and production of e-PoS audit trail, and receiving evidence on affidavits.

4. RELIEFS SOUGHT:
a) Set aside the arbitrary inaction / order of the DGRO;
b) Direct immediate payment of Food Security Allowance of ₹${fsaAmount || 0} to the Appellant;
c) Impose statutory penalty under Section 33 of NFSA (up to ₹5,000) on the defaulting public servants responsible for denying foodgrains.

Date: ${new Date().toLocaleDateString('en-IN')}
Place: ${state || '[STATE]'}
Signature / Thumb Impression of Appellant
`;
}
