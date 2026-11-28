/**
 * @file trafficChallanService.js
 * @description Statutory calculation and legal petition drafting engine for traffic e-challans under
 * the Motor Vehicles Act, 1988 (as amended in 2019) and Central Motor Vehicles Rules (CMVR) Rule 167A.
 */

export const MV_SECTIONS = {
  SECTION_136A: 'Section 136A - Electronic Monitoring and Enforcement of Road Safety',
  SECTION_183: 'Section 183 - Driving at Excessive Speed (Speed Limits & Camera Enforcement)',
  SECTION_184: 'Section 184 - Driving Dangerously (Jumping Red Light, Stop Line Violations)',
  SECTION_194B: 'Section 194B - Use of Safety Belts and Seating of Children',
  SECTION_194D: 'Section 194D - Penalty for Not Wearing Protective Headgear (Helmets)',
  SECTION_194E: 'Section 194E - Failure to Allow Free Passage to Emergency Vehicles (Immunity Rule)',
  SECTION_208: 'Section 208 - Summary Disposal of Cases & Contest of Challan in Court',
  RULE_167A: 'Rule 167A CMVR - Standards for Electronic Monitoring, Camera Calibration & 15-Day Notice',
};

export const RULE_167A_CRITERIA = [
  {
    id: 'clear_number_plate',
    category: 'Visual Evidence',
    title: 'High-Resolution Legible Registration Plate',
    description: 'The photographic or video capture must clearly depict the exact alphanumeric license plate without ambiguity or occlusion.',
    statutoryWeight: 20,
    critical: true,
  },
  {
    id: 'vehicle_characteristics',
    category: 'Visual Evidence',
    title: 'Identifiable Vehicle Make, Model & Color',
    description: 'The visual recording must show the overall vehicle body, distinguishing make, model, and vehicle class (two-wheeler vs four-wheeler).',
    statutoryWeight: 15,
    critical: true,
  },
  {
    id: 'lane_demarcation',
    category: 'Spatial Precision',
    title: 'Visible Lane Markings & Stop Line Demarcation',
    description: 'Clearly demarcated lane lines, stop line, or zebra crossing proving that the vehicle actually transgressed the designated boundary.',
    statutoryWeight: 15,
    critical: false,
  },
  {
    id: 'exact_gps_location',
    category: 'Spatial Precision',
    title: 'Precise GPS Coordinates & Geo-Tagged Road Stretch',
    description: 'The electronic record must embed exact latitude/longitude or statutory milestone marker of the alleged infraction.',
    statutoryWeight: 15,
    critical: true,
  },
  {
    id: 'precise_timestamp',
    category: 'Temporal Accuracy',
    title: 'Synchronized Timestamp with Second-Level Precision',
    description: 'Timestamp synchronized to National Physical Laboratory (NPL) standard time showing date, hour, minute, and second.',
    statutoryWeight: 15,
    critical: false,
  },
  {
    id: 'annual_calibration',
    category: 'Legal Metrology',
    title: 'Valid Annual Calibration Certificate for Speed Camera / Radar',
    description: 'Mandatory annual certificate under the Legal Metrology Act, 2009 verifying accuracy of speed sensing apparatus.',
    statutoryWeight: 20,
    critical: true,
  },
];

export const CHALLAN_DEFECT_TYPES = {
  UNCALIBRATED_CAMERA: {
    id: 'uncalibrated_camera',
    label: 'Speed Camera Lacks Annual Legal Metrology Calibration Certificate',
    severity: 'FATAL',
    statutoryGround: 'Rule 167A(2) & Legal Metrology Act, 2009',
    description: 'Speed radar/lidar uncertified or certificate expired at the time of violation capture.',
  },
  VEHICLE_CLASS_MISMATCH: {
    id: 'vehicle_class_mismatch',
    label: 'Vehicle Class or Offence Incongruity (e.g. Helmet Fine on Car / Seatbelt on Bike)',
    severity: 'FATAL',
    statutoryGround: 'Section 194B / Section 194D of MV Act',
    description: 'Violation assigned to an inapplicable vehicle class due to optical character recognition (OCR) mismatch.',
  },
  DUPLICATE_CHALLAN: {
    id: 'duplicate_challan',
    label: 'Duplicate / Multiple Challans for Single Continuous Transgression',
    severity: 'HIGH',
    statutoryGround: 'Article 20(2) Constitution of India & General Clauses Act',
    description: 'Multiple automated cameras triggered within minutes on the same traffic corridor for the same continuous journey.',
  },
  CLONED_PLATE_ALIBI: {
    id: 'cloned_plate_alibi',
    label: 'Cloned Plate / Vehicle at Different Location (Fastag / GPS Alibi)',
    severity: 'FATAL',
    statutoryGround: 'Section 11 of Indian Evidence Act (Plea of Alibi)',
    description: 'Conclusive electronic proof (Fastag toll transaction, parking receipt, or dashcam) establishing vehicle was elsewhere.',
  },
  EMERGENCY_OBSTRUCTION: {
    id: 'emergency_obstruction',
    label: 'Vehicle Crossed Line to Yield Free Passage to Emergency Vehicle',
    severity: 'FATAL',
    statutoryGround: 'Section 194E of MV Act, 1988',
    description: 'Driver crossed stop line or altered lane specifically to yield right-of-way to an ambulance or fire brigade.',
  },
  OBSCURED_SIGNAGE: {
    id: 'obscured_signage',
    label: 'Missing, Obscured, or Contradictory Traffic / Speed Limit Signage',
    severity: 'HIGH',
    statutoryGround: 'Section 116 of MV Act & IRC:67 Code of Practice',
    description: 'Statutory speed limit signs overgrown by foliage, vandalized, or absent within the mandatory statutory notification distance.',
  },
  DELAYED_NOTICE: {
    id: 'delayed_notice',
    label: 'Electronic Notice Dispatched Beyond Statutory 15-Day Limit',
    severity: 'HIGH',
    statutoryGround: 'Rule 167A(4) of Central Motor Vehicles Rules',
    description: 'Notice of violation must be sent electronically within 15 days of the occurrence to allow timely preservation of dashcam evidence.',
  },
};

export const CHALLAN_STATUS_OPTIONS = [
  { value: 'DRAFT', label: '1. Internal Audit (Draft)' },
  { value: 'POLICE_GRIEVANCE_FILED', label: '2. Nodal Traffic Police Grievance Submitted' },
  { value: 'VIRTUAL_COURT_CONTESTED', label: '3. Contested in Virtual Court (Sec 208)' },
  { value: 'MAGISTRATE_SUMMONS', label: '4. Referred to Regular Metropolitan Magistrate' },
  { value: 'DISMISSED_CANCELLED', label: '5. Challan Withdrawn / Cancelled (Resolved)' },
  { value: 'COMPOUNDED_PAID', label: '6. Compounded & Paid' },
];

export const TRAFFIC_DISPUTE_LEGAL_DISCLAIMER =
  'CITIZEN ADVISORY & STATUTORY NOTICE: This calculation and draft representation are prepared locally for citizen advocacy under Rule 167A of CMVR and Section 208 of the Motor Vehicles Act, 1988. Generating this draft does not constitute automatic contestation or cancellation on the official Parivahan or Virtual Court portals. The representation must be submitted through the official Traffic Police Grievance Portal or selected for court trial on vcourts.gov.in.';

/**
 * Audits whether an e-challan satisfies mandatory statutory criteria under Rule 167A.
 *
 * @param {Object.<string, boolean>} checks - Map of criteria ID to pass/fail boolean
 * @param {number} [daysToService=0] - Number of days between violation and receipt of notice
 * @returns {Object} Comprehensive audit breakdown
 */
export function auditRule167ACompliance(checks = {}, daysToService = 0) {
  let earnedPoints = 0;
  let totalPossible = 0;
  let criticalFailures = 0;
  const items = [];

  RULE_167A_CRITERIA.forEach((criterion) => {
    totalPossible += criterion.statutoryWeight;
    const isCompliant = Boolean(checks[criterion.id]);

    if (isCompliant) {
      earnedPoints += criterion.statutoryWeight;
    } else if (criterion.critical) {
      criticalFailures += 1;
    }

    items.push({
      ...criterion,
      compliant: isCompliant,
    });
  });

  // Statutory 15-day service rule check under Rule 167A(4)
  const isDelayedService = Number(daysToService) > 15;
  if (isDelayedService) {
    criticalFailures += 1;
  }

  const score = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
  const isAdmissible = criticalFailures === 0 && score >= 80;

  let complianceStatus = 'COMPLIANT';
  let statusLabel = 'Statutorily Compliant Evidence';
  let badgeColor = 'emerald';

  if (criticalFailures > 0) {
    complianceStatus = 'FATALLY_DEFECTIVE';
    statusLabel = 'Evidentiary Defect (Voidable under Rule 167A)';
    badgeColor = 'rose';
  } else if (score < 80) {
    complianceStatus = 'VULNERABLE';
    statusLabel = 'Weak Electronic Evidence';
    badgeColor = 'amber';
  }

  return {
    score,
    earnedPoints,
    totalPossible,
    criticalFailures,
    isDelayedService,
    isAdmissible,
    complianceStatus,
    statusLabel,
    badgeColor,
    items,
  };
}

/**
 * Analyzes selected challan defects and formulates legal grounds of contest.
 *
 * @param {Array<string>} selectedDefects
 * @param {Object} challanData
 * @returns {Object} Legal contest analysis
 */
export function analyzeChallanDefects(selectedDefects = [], challanData = {}) {
  let fatalDefectsCount = 0;
  const groundsList = [];

  selectedDefects.forEach((dKey) => {
    const defect =
      CHALLAN_DEFECT_TYPES[dKey.toUpperCase()] ||
      Object.values(CHALLAN_DEFECT_TYPES).find((d) => d.id === dKey);

    if (defect) {
      if (defect.severity === 'FATAL') {
        fatalDefectsCount += 1;
      }
      groundsList.push(defect);
    }
  });

  let recommendedAction = 'File Administrative Representation to Traffic Police Nodal Cell';
  let forum = 'Traffic Police Nodal Grievance Portal';
  let contestStrength = 'MODERATE';

  if (fatalDefectsCount >= 2 || selectedDefects.includes('cloned_plate_alibi') || selectedDefects.includes('uncalibrated_camera')) {
    recommendedAction = 'Elect Trial / Contest in Virtual Court under Section 208';
    forum = 'Virtual Court / Metropolitan Judicial Magistrate';
    contestStrength = 'STRONG';
  } else if (selectedDefects.length === 0) {
    recommendedAction = 'Verify Photo Proof on Parivahan Portal before Action';
    contestStrength = 'NONE';
  }

  const compoundingAmount = Math.max(0, Number(challanData.fineAmount) || 0);

  return {
    groundsList,
    fatalDefectsCount,
    contestStrength,
    recommendedAction,
    forum,
    compoundingAmount,
  };
}

/**
 * Drafts formal contest petition under Section 208 for Virtual Court / Magistrate.
 *
 * @param {Object} data
 * @returns {string} Formatted petition text
 */
export function generateSection208ContestPetition(data = {}) {
  const {
    ownerName = '[Registered Vehicle Owner Name]',
    ownerContact = '[Contact Number & Email]',
    ownerAddress = '[Residential Address]',
    vehicleNumber = '[Vehicle Registration No., e.g. MH-12-AB-1234]',
    vehicleClass = '[e.g. Motor Car / Two-Wheeler / HGV]',
    challanNumber = '[E-Challan Reference No.]',
    challanDate = '[YYYY-MM-DD]',
    challanTime = '[HH:MM:SS]',
    fineAmount = 0,
    allegedOffence = '[Alleged Violation, e.g. Over-speeding / Red Light Jumping]',
    location = '[Location / Junction / Highway Stretch]',
    defectNotes = '',
    selectedDefects = [],
    alibiDetails = '',
  } = data;

  const defectSummaries = selectedDefects
    .map((dKey) => {
      const d =
        CHALLAN_DEFECT_TYPES[dKey.toUpperCase()] ||
        Object.values(CHALLAN_DEFECT_TYPES).find((item) => item.id === dKey);
      return d ? `- ${d.label} (Statutory Ground: ${d.statutoryGround})` : '';
    })
    .filter(Boolean)
    .join('\n');

  return `BEFORE THE HON'BLE VIRTUAL COURT / SPECIAL METROPOLITAN MAGISTRATE (TRAFFIC)
DISTRICT: [District Name], STATE: [State Name]

APPLICATION FOR REJECTION / UNCONDITIONAL DISMISSAL OF ELECTRONIC CHALLAN NO. ${challanNumber}
UNDER SECTION 208 OF THE MOTOR VEHICLES ACT, 1988 (AS AMENDED BY MV ACT, 2019)
READ WITH RULE 167A OF THE CENTRAL MOTOR VEHICLES RULES, 1989

IN THE MATTER OF:
${ownerName}
S/o / D/o / W/o: [Parent/Spouse Name]
Residing at: ${ownerAddress}
Contact: ${ownerContact}
Registered Owner of Vehicle: ${vehicleNumber} (${vehicleClass})
... APPLICANT / REGISTERED OWNER

VERSUS

STATE / TRAFFIC POLICE ENFORCEMENT BRANCH
... RESPONDENT / PROSECUTION

MOST RESPECTFULLY SHOWETH:

1. PARTICULARS OF DISPUTED E-CHALLAN:
- Challan Reference Number: ${challanNumber}
- Alleged Violation Date & Time: ${challanDate} at ${challanTime}
- Alleged Transgression: ${allegedOffence}
- Alleged Site of Offence: ${location}
- Compounding Fine Demanded: ₹${Number(fineAmount).toLocaleString('en-IN')}/-

2. JURISDICTION & CONTESTATION UNDER SECTION 208:
The Applicant does not admit guilt or compound the alleged offence. The Applicant exercises the statutory right under Section 208 of the Motor Vehicles Act, 1988 to contest this prosecution on grounds of patent lack of legal evidence and violation of Central Government mandatory statutory norms.

3. STATUTORY INFIRMITIES UNDER RULE 167A CMVR:
Under Rule 167A(2) of the Central Motor Vehicles (Seventeenth Amendment) Rules, 2021, an electronic challan is legally invalid unless generated through an electronic monitoring device complying with strict calibration and visual clarity standards. The subject challan is vitiated by the following fatal evidentiary defects:
${defectSummaries || '- Automated camera malfunction and defective optical character recognition.'}

4. GROUNDS OF CONTEST & EXCULPATORY EVIDENCE:
${defectNotes ? `Particulars of Irregularity:\n${defectNotes}\n` : ''}
${alibiDetails ? `Alibi / Exculpatory Evidence:\n${alibiDetails}\n` : ''}
The electronic evidence relied upon by the Respondent fails the benchmark of Section 65B of the Indian Evidence Act, 1872 and Rule 167A, rendering the prosecution unsustainable.

5. PRAYER:
In light of the statutory facts and absence of legally admissible electronic evidence, it is most respectfully prayed that this Hon'ble Court may be pleased to:
a) Refuse to take cognizance of the impugned electronic notice and dismiss Challan No. ${challanNumber} as null, void, and unenforceable;
b) Direct the Respondent Traffic Police to expunge the violation entry from the central VAHAN/SARATHI repository without demanding compounding fee;
c) Direct the production of the statutory Legal Metrology Annual Calibration Certificate for the camera unit stationed at ${location};
d) Pass such other order(s) as deemed fit and proper in the interest of justice.

VERIFICATION:
I, ${ownerName}, the Applicant above-named, do hereby verify that the contents of this application are true to my knowledge and based on contemporaneous electronic records, and no material fact has been concealed.

Date: ${new Date().toISOString().split('T')[0]}
Place: [City / District]

________________________
(Signature of Applicant)

DISCLAIMER:
${TRAFFIC_DISPUTE_LEGAL_DISCLAIMER}
`;
}

/**
 * Drafts an administrative contest representation to the Traffic Police Nodal Grievance Cell.
 *
 * @param {Object} data
 * @returns {string} Formatted representation
 */
export function generateTrafficPoliceGrievance(data = {}) {
  const {
    ownerName = '[Owner Name]',
    ownerContact = '[Phone & Email]',
    vehicleNumber = '[Vehicle No.]',
    challanNumber = '[Challan No.]',
    challanDate = '[Date]',
    fineAmount = 0,
    allegedOffence = '[Alleged Violation]',
    location = '[Location]',
    defectNotes = '',
    selectedDefects = [],
  } = data;

  const defectList = selectedDefects
    .map((dKey) => {
      const d =
        CHALLAN_DEFECT_TYPES[dKey.toUpperCase()] ||
        Object.values(CHALLAN_DEFECT_TYPES).find((item) => item.id === dKey);
      return d ? `- ${d.label}` : '';
    })
    .filter(Boolean)
    .join('\n');

  return `TO:
THE NODAL GRIEVANCE OFFICER / DEPUTY COMMISSIONER OF POLICE (TRAFFIC)
TRAFFIC POLICE HEADQUARTERS, [District/City Name]

SUBJECT: STATUTORY GRIEVANCE FOR CANCELLATION OF ERRONEOUS E-CHALLAN NO. ${challanNumber} ISSUED AGAINST VEHICLE NO. ${vehicleNumber}

Sir/Madam,

I am the registered owner of motor vehicle ${vehicleNumber}. I have received an automated electronic notice demanding a compounding penalty of ₹${Number(fineAmount).toLocaleString('en-IN')}/- for alleged "${allegedOffence}" at ${location} on ${challanDate}.

Upon careful examination of the photographic evidence uploaded on the Parivahan portal, it is evident that the challan is patently erroneous and statutorily voidable for the following reasons:
${defectList || '- Electronic monitoring criteria under Rule 167A CMVR not fulfilled.'}

${defectNotes ? `Specific Grievance Details:\n${defectNotes}\n` : ''}

In terms of Rule 167A of the Central Motor Vehicles Rules, 1989 and advisory guidelines issued by the Ministry of Road Transport and Highways (MoRTH), I request your good office to:
1. Examine the raw camera footage and camera calibration records;
2. Verify vehicle classification and license plate characters;
3. Cancel the erroneous challan administratively from the ITMS database, obviating the necessity of taking this matter to the Virtual Court.

Yours faithfully,

________________________
${ownerName}
Contact: ${ownerContact}

DISCLAIMER:
${TRAFFIC_DISPUTE_LEGAL_DISCLAIMER}
`;
}

/**
 * DPDP Act 2023 compliant sanitizer for traffic challan case records.
 *
 * @param {Object} caseData
 * @returns {Object} Sanitized copy
 */
export function sanitizeChallanCase(caseData = {}) {
  const sanitized = JSON.parse(JSON.stringify(caseData || {}));

  if (sanitized.ownerContact) {
    sanitized.ownerContact = sanitized.ownerContact.replace(
      /\b\d{10}\b/g,
      (match) => `${match.slice(0, 2)}XXXXXX${match.slice(8)}`
    );
    sanitized.ownerContact = sanitized.ownerContact.replace(
      /([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/g,
      (match, user, domain) => `${user.slice(0, 1)}***@${domain}`
    );
  }

  if (sanitized.vehicleNumber) {
    // Mask middle digits of plate, e.g. DL-01-XX-1234
    sanitized.vehicleNumber = sanitized.vehicleNumber.replace(
      /([A-Z]{2}[ -]?\d{1,2}[ -]?)[A-Z0-9]{1,3}([ -]?\d{4})/i,
      '$1XX$2'
    );
  }

  return sanitized;
}
