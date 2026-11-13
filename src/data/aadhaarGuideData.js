/**
 * Aadhaar Enrolment & Demographic Update Acknowledgement Guide Dataset
 *
 * Grounded strictly in the Aadhaar (Targeted Delivery of Financial and Other Subsidies,
 * Benefits and Services) Act, 2016 (as amended 2019), UIDAI Official Circulars,
 * Citizens' Charter standards, and verified official government portals.
 *
 * Official Portals:
 * - UIDAI Main: https://uidai.gov.in/
 * - myAadhaar: https://myaadhaar.uidai.gov.in/
 * - Appointment Booking: https://appointments.uidai.gov.in/
 * - Grievance Portal: https://myaadhaar.uidai.gov.in/file-complaint
 */

import { INDIAN_STATES_AND_UTS } from './jurisdictions';

export { INDIAN_STATES_AND_UTS };

export const UIDAI_REGIONAL_OFFICES = [
  {
    id: 'ro-delhi',
    name: 'UIDAI Regional Office, New Delhi',
    jurisdictionStates: ['Delhi', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Ladakh', 'Punjab', 'Chandigarh'],
    address: 'Ground Floor, Pragati Maidan Metro Station, Pragati Maidan, New Delhi - 110001',
    email: 'ro.delhi@uidai.net.in',
    helpline: '1947',
    verified: true,
  },
  {
    id: 'ro-lucknow',
    name: 'UIDAI Regional Office, Lucknow',
    jurisdictionStates: ['Uttar Pradesh'],
    address: '3rd Floor, UP Samaj Kalyan Nirman Nigam Building, TC-46/V, Vibhuti Khand, Gomti Nagar, Lucknow - 226010',
    email: 'ro.lucknow@uidai.net.in',
    helpline: '1947',
    verified: true,
  },
  {
    id: 'ro-ranchi',
    name: 'UIDAI Regional Office, Ranchi',
    jurisdictionStates: ['Bihar', 'Jharkhand', 'West Bengal'],
    address: '1st Floor, RIADA Central Office Building, Namkum Industrial Area, Lowadih, Ranchi - 834010',
    email: 'ro.ranchi@uidai.net.in',
    helpline: '1947',
    verified: true,
  },
  {
    id: 'ro-guwahati',
    name: 'UIDAI Regional Office, Guwahati',
    jurisdictionStates: ['Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'],
    address: 'Block-V, 1st Floor, HOUSEFED Complex, Dispur, Guwahati - 781006',
    email: 'ro.guwahati@uidai.net.in',
    helpline: '1947',
    verified: true,
  },
  {
    id: 'ro-mumbai',
    name: 'UIDAI Regional Office, Mumbai',
    jurisdictionStates: ['Maharashtra', 'Gujarat', 'Goa', 'Dadra and Nagar Haveli and Daman and Diu'],
    address: '7th Floor, MTNL Telephone Exchange Building, GD Somani Marg, Cuffe Parade, Colaba, Mumbai - 400005',
    email: 'ro.mumbai@uidai.net.in',
    helpline: '1947',
    verified: true,
  },
  {
    id: 'ro-bengaluru',
    name: 'UIDAI Regional Office, Bengaluru',
    jurisdictionStates: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Puducherry', 'Lakshadweep'],
    address: 'Khanija Bhavan, No. 49, 3rd Floor, South Wing Race Course Road, Bengaluru - 560001',
    email: 'ro.bengaluru@uidai.net.in',
    helpline: '1947',
    verified: true,
  },
  {
    id: 'ro-hyderabad',
    name: 'UIDAI Regional Office, Hyderabad',
    jurisdictionStates: ['Andhra Pradesh', 'Telangana', 'Odisha', 'Chhattisgarh', 'Andaman and Nicobar Islands'],
    address: '6th Floor, East Wing, Swarna Jayanti Complex, Nampally, Hyderabad - 500001',
    email: 'ro.hyderabad@uidai.net.in',
    helpline: '1947',
    verified: true,
  },
];

/**
 * State and Union Territory Administrative Context
 * Note: UIDAI rules are centrally governed under Central Law (Aadhaar Act 2016).
 * State-level partner networks (e.g. e-Mitra, MahaOnline, Bangalore One, e-Seva, etc.)
 * act as authorised registrars. Where no separate state variation exists, the guide
 * displays: "Not specified by the linked official source. Centrally governed by UIDAI standards without state-level procedural variance."
 */
export const STATE_ADMIN_PROFILES = {
  'Delhi': {
    registrarPartner: 'Government of NCT of Delhi / Doorstep Delivery & Standalone ASKs',
    portalUrl: 'https://uidai.gov.in',
    portalName: 'UIDAI Central Portal & NCT Delhi Citizen Facilitation',
    districts: ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
    localBodies: ['Municipal Corporation of Delhi (MCD)', 'New Delhi Municipal Council (NDMC)', 'Delhi Cantonment Board'],
    notes: 'Standalone high-capacity model ASKs operate across New Delhi, Inderlok, Akshardham, and Janakpuri. Home enrolment kits available for bedridden elderly through Delhi Doorstep Delivery (1076).',
    verified: true,
  },
  'Maharashtra': {
    registrarPartner: 'MahaOnline / Directorate of Information Technology (DIT)',
    portalUrl: 'https://aaplesarkar.mahaonline.gov.in',
    portalName: 'Aaple Sarkar / MahaOnline Portal',
    districts: ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad (Chhatrapati Sambhajinagar)'],
    localBodies: ['Brihanmumbai Municipal Corporation (BMC)', 'Pune Municipal Corporation (PMC)', 'Nagpur Municipal Corporation (NMC)'],
    notes: 'Aadhaar services integrated via Aaple Sarkar Seva Kendras, designated post offices, and dedicated UIDAI ASKs in Mumbai, Pune, and Nagpur.',
    verified: true,
  },
  'Karnataka': {
    registrarPartner: 'Centre for e-Governance (CeG) / Bangalore One & Karnataka One',
    portalUrl: 'https://karnatakaone.gov.in',
    portalName: 'Bangalore One / Karnataka One Portal',
    districts: ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Dharwad', 'Belagavi', 'Dakshina Kannada'],
    localBodies: ['Bruhat Bengaluru Mahanagara Palike (BBMP)', 'Mysuru City Corporation', 'Hubballi-Dharwad Municipal Corporation'],
    notes: 'Aadhaar enrolment and update services are widely accessible through Bangalore One centres across BBMP wards and Karnataka One centres across district headquarters.',
    verified: true,
  },
  'Tamil Nadu': {
    registrarPartner: 'Tamil Nadu e-Governance Agency (TNeGA) / e-Seva',
    portalUrl: 'https://www.tnesevai.tn.gov.in',
    portalName: 'TNeGA e-Sevai Portal',
    districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli'],
    localBodies: ['Greater Chennai Corporation (GCC)', 'Coimbatore Corporation', 'Madurai Corporation'],
    notes: 'Permanent enrolment centres function inside Taluk Offices, Corporation Zonal Offices, and authorized Arasu e-Seva Kendras throughout the state.',
    verified: true,
  },
  'Uttar Pradesh': {
    registrarPartner: 'Centre for e-Governance UP / e-District UP & India Post',
    portalUrl: 'https://edistrict.up.gov.in',
    portalName: 'e-District Uttar Pradesh',
    districts: ['Lucknow', 'Kanpur Nagar', 'Varanasi', 'Prayagraj', 'Agra', 'Meerut', 'Noida (Gautam Buddha Nagar)', 'Ghaziabad'],
    localBodies: ['Lucknow Municipal Corporation', 'Kanpur Municipal Corporation', 'Varanasi Nagar Nigam'],
    notes: 'Operating across district collectorates, block development offices, head post offices, and model UIDAI ASKs in Lucknow, Agra, and Prayagraj.',
    verified: true,
  },
  'Rajasthan': {
    registrarPartner: 'DoIT&C / e-Mitra Network',
    portalUrl: 'https://emitra.rajasthan.gov.in',
    portalName: 'e-Mitra Rajasthan Portal',
    districts: ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Ajmer', 'Bikaner'],
    localBodies: ['Jaipur Greater Municipal Corporation', 'Jaipur Heritage Municipal Corporation', 'Jodhpur Nagar Nigam'],
    notes: 'Permanent Aadhaar centres functional across Atal Seva Kendras, Panchayat Samitis, and authorised e-Mitra Plus kiosks.',
    verified: true,
  },
  'West Bengal': {
    registrarPartner: 'Bangla Sahayata Kendra (BSK) / India Post & Banks',
    portalUrl: 'https://bsk.wb.gov.in',
    portalName: 'Bangla Sahayata Kendra Portal',
    districts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Darjeeling'],
    localBodies: ['Kolkata Municipal Corporation (KMC)', 'Howrah Municipal Corporation', 'Siliguri Municipal Corporation'],
    notes: 'Enrolment and demographic services available free of assistance charges through BSK counters, Post Offices, and UIDAI ASK Kolkata.',
    verified: true,
  },
};

/**
 * Fallback generator for jurisdictions where standard national UIDAI rules apply
 * without local procedural divergence.
 */
export function getJurisdictionDetails(stateName) {
  if (STATE_ADMIN_PROFILES[stateName]) {
    return {
      ...STATE_ADMIN_PROFILES[stateName],
      state: stateName,
      isNationalStandard: false,
      regionalOffice: UIDAI_REGIONAL_OFFICES.find((ro) => ro.jurisdictionStates.includes(stateName)) || UIDAI_REGIONAL_OFFICES[0],
    };
  }

  const ro = UIDAI_REGIONAL_OFFICES.find((ro) => ro.jurisdictionStates.includes(stateName)) || UIDAI_REGIONAL_OFFICES[0];

  return {
    state: stateName,
    registrarPartner: 'State IT / Revenue Department & Designated Registrar Network',
    portalUrl: 'https://uidai.gov.in',
    portalName: 'UIDAI Central Portal & Authorised Registrar Network',
    districts: ['All State / UT Administrative Districts'],
    localBodies: ['Jurisdictional Municipal Corporation / Municipality / District Collectorate'],
    notes: 'Not specified by the linked official source. Centrally governed by UIDAI standards without state-level procedural variance.',
    isNationalStandard: true,
    verified: true,
    regionalOffice: ro,
  };
}

/**
 * Primary Service Categories: Enrolment vs Demographic Update vs Biometric Update
 */
export const SERVICE_MODES = [
  {
    id: 'enrolment',
    title: 'New Aadhaar Enrolment',
    badge: 'First-Time Application',
    tagline: 'For resident individuals of all ages who have never been allotted an Aadhaar number.',
    fee: 'FREE (₹0)',
    feeDetails: 'UIDAI mandates 100% free enrolment at all official centres. No centre can charge any fee.',
    channel: 'In-person at an authorised centre (Cannot be done online).',
    biometricsRequired: true,
    trackingIdentifier: '28-digit Enrolment ID (EID)',
    statutoryTimeline: 'Up to 30 to 90 days from data capture',
    description: 'First-time registration for Indian residents, infants, children, and eligible NRIs. Involves capturing 10 fingerprints, 2 iris scans, photograph, demographic data, and original document verification.',
  },
  {
    id: 'demographic_update',
    title: 'Aadhaar Demographic Update',
    badge: 'Existing Aadhaar Holders',
    tagline: 'For updating address, name, date of birth, gender, mobile number, or email on an existing Aadhaar.',
    fee: '₹50 (at Centre) / Free online document upload',
    feeDetails: '₹50 inclusive of GST at any Aadhaar Seva Kendra. Online document re-validation is free during promotional windows.',
    channel: 'Online via myAadhaar (Address only) / In-person at ASK (Name, DoB, Gender, Mobile, Email).',
    biometricsRequired: false,
    trackingIdentifier: '14-digit Update Request Number (URN) or 28-digit EID',
    statutoryTimeline: 'Typically 5 to 30 days (Statutory standard up to 90 days)',
    description: 'Demographic correction or modification for existing 12-digit Aadhaar holders. Address updates can be completed online; name, date of birth, gender, mobile, and email changes require physical verification at an ASK.',
  },
  {
    id: 'biometric_update',
    title: 'Biometric & Mandatory Biometric Update (MBU)',
    badge: 'Children & Adult Biometrics',
    tagline: 'Mandatory biometric update for children at ages 5 and 15, and adult biometric refreshes.',
    fee: 'FREE for MBU (ages 5-7 & 15-17) / ₹100 for voluntary adult biometrics',
    feeDetails: 'MBU for children aged 5–7 and 15–17 is free of charge. Voluntary biometric update for adults is ₹100 inclusive of GST.',
    channel: 'In-person at an authorised Aadhaar Seva Kendra / Centre only.',
    biometricsRequired: true,
    trackingIdentifier: '28-digit Enrolment ID (EID)',
    statutoryTimeline: 'Up to 30 to 90 days from data capture',
    description: 'Children must mandatorily update facial photograph, 10 fingerprints, and 2 iris scans upon turning 5 and 15 years old. Adults whose biometrics change or fail authentication can refresh biometrics at any ASK.',
  },
];

/**
 * UIDAI Official Fee Schedule Caps
 */
export const OFFICIAL_FEE_SCHEDULE = [
  {
    id: 'fee-new-enrolment',
    service: 'New Aadhaar Enrolment',
    fee: '₹0 (Free)',
    applicableTo: 'All resident citizens, newborns, minors, and NRIs.',
    mode: 'Physical ASK / Authorised Centre',
    receiptPrescribed: true,
    officialRule: 'Section 3(1) of Aadhaar Act, 2016. No registrar or enrolment operator is permitted to charge any fee.',
  },
  {
    id: 'fee-mbu',
    service: 'Mandatory Biometric Update (MBU) for Minors',
    fee: '₹0 (Free)',
    applicableTo: 'Children between ages 5 to 7 years (1st MBU) and ages 15 to 17 years (2nd MBU).',
    mode: 'Physical ASK / Authorised Centre',
    receiptPrescribed: true,
    officialRule: 'UIDAI Circular F. No. 4(4)/57/259/2014-UIDAI/Pt. Free of charge if completed within the eligible age window.',
  },
  {
    id: 'fee-demo-centre',
    service: 'Demographic Update at ASK / Centre',
    fee: '₹50 (inclusive of 18% GST)',
    applicableTo: 'Name, Address, Gender, Date of Birth, Mobile number, or Email change.',
    mode: 'Physical ASK / Authorised Centre',
    receiptPrescribed: true,
    officialRule: 'UIDAI Circular No. 13 of 2020. Standard ceiling fee. Operator must issue computer-generated receipt.',
  },
  {
    id: 'fee-bio-centre',
    service: 'Biometric Update (with or without demographic)',
    fee: '₹100 (inclusive of 18% GST)',
    applicableTo: 'Photograph, Iris, and Fingerprint update for adults or late MBUs.',
    mode: 'Physical ASK / Authorised Centre',
    receiptPrescribed: true,
    officialRule: 'UIDAI Circular No. 13 of 2020. Fixed ceiling fee inclusive of GST.',
  },
  {
    id: 'fee-online-doc',
    service: 'Document Update on myAadhaar Portal',
    fee: 'FREE during UIDAI promotional periods / ₹50 at ASK',
    applicableTo: 'Aadhaar holders updating PoI and PoA for records older than 10 years.',
    mode: 'Online (myAadhaar Self-Service)',
    receiptPrescribed: true,
    officialRule: 'Regulation 16A of Aadhaar (Enrolment and Update) Regulations. Free on myAadhaar; ₹50 at centres.',
  },
  {
    id: 'fee-eaadhaar',
    service: 'e-Aadhaar Electronic PDF Download',
    fee: '₹0 (Free)',
    applicableTo: 'All Aadhaar holders using registered mobile number OTP.',
    mode: 'Online (myAadhaar Portal)',
    receiptPrescribed: false,
    officialRule: 'Section 4(3) of Aadhaar Act, 2016. Digitally signed e-Aadhaar is legally at par with physical printed card.',
  },
  {
    id: 'fee-pvc-card',
    service: 'Order Aadhaar PVC Card (Official Reprint)',
    fee: '₹50 (inclusive of GST and Speed Post delivery)',
    applicableTo: 'Any Aadhaar holder wanting an official durable card with hologram & ghost image.',
    mode: 'Online (myAadhaar Portal)',
    receiptPrescribed: true,
    officialRule: 'Delivered directly to registered postal address by India Post Speed Post with tracking SRN.',
  },
];

/**
 * Supporting Documents Categorized as Mandatory vs Conditional vs Optional
 */
export const SUPPORTING_DOCUMENTS = {
  poi: [
    {
      id: 'poi-passport',
      title: 'Indian or Valid Foreign Passport',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Name Update'],
      description: 'Contains full name and photograph. Unexpired original must be presented for physical scanning.',
      condition: null,
      officialBasis: 'UIDAI List of Acceptable Supporting Documents (Sl. No. 1)',
    },
    {
      id: 'poi-pan',
      title: 'PAN Card / e-PAN Card',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Name Update'],
      description: 'Permanent Account Number card issued by the Income Tax Department bearing name and photo.',
      condition: null,
      officialBasis: 'UIDAI List of Acceptable Supporting Documents (Sl. No. 2)',
    },
    {
      id: 'poi-voter',
      title: 'Voter Identity Card (EPIC) / e-EPIC',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Name Update'],
      description: 'Electoral Photo Identity Card issued by the Election Commission of India.',
      condition: null,
      officialBasis: 'UIDAI List of Acceptable Supporting Documents (Sl. No. 4)',
    },
    {
      id: 'poi-driving',
      title: 'Driving Licence',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Name Update'],
      description: 'Valid Driving Licence issued by State RTO/MoRTH within statutory validity period.',
      condition: null,
      officialBasis: 'UIDAI List of Acceptable Supporting Documents (Sl. No. 5)',
    },
    {
      id: 'poi-ration',
      title: 'Ration / PDS Card with Photograph',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Name Update'],
      description: 'Public Distribution System / Ration card carrying applicant photo and name.',
      condition: null,
      officialBasis: 'UIDAI List of Acceptable Supporting Documents (Sl. No. 3)',
    },
    {
      id: 'poi-gazetted',
      title: 'UIDAI Standard Certificate by Gazetted Officer / MP / MLA / Tehsildar',
      category: 'conditional',
      acceptedFor: ['New Enrolment', 'Name Update'],
      description: 'Standard Certificate on UIDAI-prescribed Annexure format with photograph cross-signed and stamped. Must be used within 3 months of issue.',
      condition: 'Applicable when citizen lacks standard photo ID cards (e.g. rural or homeless applicants).',
      officialBasis: 'UIDAI Regulation Schedule II Standard Certificate Form',
    },
  ],
  poa: [
    {
      id: 'poa-passport',
      title: 'Passport (with current residential address)',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Address Update'],
      description: 'Must reflect current residential address where Aadhaar physical communication will be sent.',
      condition: null,
      officialBasis: 'UIDAI List of Acceptable Supporting Documents',
    },
    {
      id: 'poa-bank',
      title: 'Bank Statement / Passbook with Photo & Bank Stamp',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Address Update'],
      description: 'Scheduled commercial bank or Post Office savings account passbook/statement not older than 3 months, with customer photograph attested by branch official.',
      condition: null,
      officialBasis: 'UIDAI List of Acceptable Supporting Documents',
    },
    {
      id: 'poa-utility',
      title: 'Utility Bills (Electricity / Water / Piped Gas / Landline)',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Address Update'],
      description: 'Official bill in applicant or immediate family head name, strictly issued within the preceding 3 months.',
      condition: null,
      officialBasis: 'UIDAI Acceptable Document Circular — 3-month recency clause',
    },
    {
      id: 'poa-rent',
      title: 'Registered Rent Agreement / Lease Deed',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Address Update'],
      description: 'Formally registered rent agreement executed with the Sub-Registrar / Stamp Authority. Unregistered notarized affidavits are not accepted.',
      condition: null,
      officialBasis: 'UIDAI Acceptable Document Circular',
    },
    {
      id: 'poa-hof',
      title: 'Head of Family (HoF) Based Address Verification',
      category: 'conditional',
      acceptedFor: ['Address Update (Online & Offline)'],
      description: 'Allows a resident without address proof in their own name to update address based on consent and PoA of the Head of Family (spouse, parent, guardian).',
      condition: 'Requires valid Proof of Relationship (PoR) document and OTP authentication by the HoF within 30 days.',
      officialBasis: 'UIDAI HoF Address Update Guidelines (2022 Circular)',
    },
  ],
  dob: [
    {
      id: 'dob-birth-cert',
      title: 'Birth Certificate issued by Registrar of Births and Deaths / Municipal Body',
      category: 'mandatory',
      acceptedFor: ['New Enrolment', 'Date of Birth Update'],
      description: 'Official birth certificate issued under the Registration of Births and Deaths Act, 1969. Compulsory for all persons born on or after 1 October 2023 under RBD Amendment Act 2023.',
      condition: 'Mandatory for applicants born on or after 1 October 2023.',
      officialBasis: 'Registration of Births and Deaths (Amendment) Act, 2023 & UIDAI Circular',
    },
    {
      id: 'dob-sslc',
      title: 'SSLC / 10th Standard Board Certificate or Marksheet',
      category: 'conditional',
      acceptedFor: ['New Enrolment', 'Date of Birth Update'],
      description: 'Recognized education board certificate or marksheet explicitly containing applicant full name and exact date of birth.',
      condition: 'Accepted for individuals born prior to 1 October 2023.',
      officialBasis: 'UIDAI List of Acceptable Supporting Documents',
    },
    {
      id: 'dob-passport',
      title: 'Passport with explicit Date of Birth',
      category: 'conditional',
      acceptedFor: ['New Enrolment', 'Date of Birth Update'],
      description: 'Valid passport displaying exact date, month, and year of birth.',
      condition: 'Accepted for individuals born prior to 1 October 2023.',
      officialBasis: 'UIDAI List of Acceptable Supporting Documents',
    },
  ],
  por: [
    {
      id: 'por-birth',
      title: 'Birth Certificate of Child (displaying parents’ names)',
      category: 'conditional',
      acceptedFor: ['Baal Aadhaar (<5 years)', 'Child Enrolment', 'HoF Address'],
      description: 'Links the minor to the mother/father’s Aadhaar. Biometrics not captured for children under 5.',
      condition: 'Mandatory when enrolling children under 5 years of age or using parent as HoF.',
      officialBasis: 'UIDAI Child Enrolment Guidelines',
    },
    {
      id: 'por-ration',
      title: 'PDS / Ration Card or Family Identity Card',
      category: 'conditional',
      acceptedFor: ['Family Linkage', 'HoF Address Update'],
      description: 'Government-issued family register showing relationship between family head and applicant.',
      condition: 'Required for HoF address verification.',
      officialBasis: 'UIDAI HoF Guidelines',
    },
    {
      id: 'por-marriage',
      title: 'Marriage Certificate issued by competent government Registrar',
      category: 'conditional',
      acceptedFor: ['Spouse Surname / Address Change', 'HoF Address Update'],
      description: 'Formal marriage registration certificate issued under Special Marriage Act or Hindu Marriage Act.',
      condition: 'Required when updating address or surname based on spouse.',
      officialBasis: 'UIDAI List of Acceptable Supporting Documents',
    },
  ],
  optional: [
    {
      id: 'opt-mobile',
      title: 'Active Personal Mobile Number',
      category: 'optional',
      acceptedFor: ['New Enrolment', 'Mobile Linkage at ASK'],
      description: 'Entering a mobile number is voluntary at initial enrolment, but strictly essential for receiving OTPs, tracking status, downloading e-Aadhaar, and accessing myAadhaar self-service.',
      condition: 'Voluntary at enrolment, but mandatory to use online myAadhaar services.',
      officialBasis: 'UIDAI Enrolment Guidelines (No document required; captured via biometric verification at ASK).',
    },
    {
      id: 'opt-email',
      title: 'Personal Email Address',
      category: 'optional',
      acceptedFor: ['New Enrolment', 'Email Linkage at ASK'],
      description: 'Receives electronic notifications regarding status updates, authentication logs, and e-Aadhaar password-protected files.',
      condition: 'Optional supporting communication attribute.',
      officialBasis: 'UIDAI Enrolment Guidelines (No document required).',
    },
  ],
};

/**
 * 7 Ordered Application Journey Stages
 */
export const ORDERED_JOURNEY_STAGES = [
  {
    stage: 1,
    title: 'Select Service Path & Review Prerequisites',
    description: 'Determine whether you require a New Enrolment (first-time applicant, free) or a Demographic Update (existing 12-digit Aadhaar holder). Review lifetime update limits: Name (max 2 times), Date of Birth (max 1 time), Gender (max 1 time).',
    channel: 'Self-Check / Civic Help Setu Guide',
    dateLabel: 'Application Date',
    milestone: 'Prerequisite Verification Completed',
    actionTip: 'Ensure names match exactly across all supporting documents to avoid instant backend rejection.',
  },
  {
    stage: 2,
    title: 'Assemble Original Supporting Proofs',
    description: 'Gather original Proof of Identity (PoI), Proof of Address (PoA), and Date of Birth (DoB) documents. UIDAI operators scan original documents in colour; photocopies and notarized papers without originals will be rejected.',
    channel: 'Citizen Document Preparation',
    dateLabel: 'Verification Date',
    milestone: 'Original Document Verification',
    actionTip: 'Ensure utility bills are not older than 3 months and bank passbooks carry branch rubber stamps with photo.',
  },
  {
    stage: 3,
    title: 'Choose Channel & Book Appointment',
    description: 'If updating address only, you may complete it online via myAadhaar using mobile OTP. For new enrolment, photo, mobile, or DoB updates, visit appointments.uidai.gov.in to book a designated time slot at an Aadhaar Seva Kendra, or visit as a walk-in.',
    channel: 'Online Portal / UIDAI Appointment Service',
    dateLabel: 'Appointment Date',
    milestone: 'Appointment Slot Reserved',
    actionTip: 'Carry your printed or digital appointment slip to the centre to bypass general walk-in queues.',
  },
  {
    stage: 4,
    title: 'In-Person Capture or Online Submission',
    description: 'At the centre, the certified operator enters your demographic particulars and captures 10 fingerprints, 2 iris scans, and a facial photo (for enrolment/biometrics). If online, upload self-attested colour scans of PoA/PoI.',
    channel: 'Aadhaar Seva Kendra / myAadhaar Portal',
    dateLabel: 'Enrolment / Update Date',
    milestone: 'Data & Biometric Capture Completed',
    actionTip: 'Watch the resident-facing secondary monitor carefully as the operator types your name, address, and PIN code.',
  },
  {
    stage: 5,
    title: 'Scrutinize Screen & Collect Acknowledgement Slip',
    description: 'Before biometric sign-off, verify every spelling on the operator’s preview screen. Collect the printed Acknowledgement Slip bearing your 28-digit Enrolment ID (EID) or 14-digit Update Request Number (URN).',
    channel: 'Counter Handover / Instant PDF Download',
    dateLabel: 'Acknowledgement Date',
    milestone: 'Acknowledgement Slip Issued',
    actionTip: 'Never leave the centre without checking that the mobile number printed on the slip matches your phone.',
  },
  {
    stage: 6,
    title: 'Track CIDR Validation & De-Duplication',
    description: 'Your request enters the UIDAI Central Identities Data Repository (CIDR). Automated biometric de-duplication checks for duplicate enrolments, and document verifiers validate your proofs. Track progress via myaadhaar.uidai.gov.in.',
    channel: 'UIDAI Central Identities Data Repository (CIDR)',
    dateLabel: 'Statutory Processing Timeline (30–90 days)',
    milestone: 'CIDR Verification & Quality Approval',
    actionTip: 'Status transitions from "Under Process" to "Validation Stage" and finally "Aadhaar Generated / Update Completed".',
  },
  {
    stage: 7,
    title: 'Download e-Aadhaar & Speed Post Card Delivery',
    description: 'Once status shows "Aadhaar Generated" or "Update Completed", immediately download your digitally signed e-Aadhaar PDF for free. For new enrolments, a printed Aadhaar letter is dispatched via India Post Speed Post to your registered address.',
    channel: 'Digital PDF Download / India Post Delivery',
    dateLabel: 'Issue Date / Delivery Date',
    milestone: 'e-Aadhaar Available & Physical Card Delivered',
    actionTip: 'The PDF password is the first 4 letters of your name in CAPITAL letters followed by your 4-digit Year of Birth (e.g. SURE1990).',
  },
];

/**
 * 10 Distinct Statutory Milestone Date Labels
 * Distinguishes each date field with explicit plain-language definitions and legal significance.
 */
export const MILESTONE_DATE_FIELDS = [
  {
    id: 'date-application',
    label: '1. Application Date',
    description: 'The date the resident electronically initiates an online update request or visits an authorised enrolment centre.',
    significance: 'Marks the commencement of the request in the administrative queue.',
  },
  {
    id: 'date-appointment',
    label: '2. Appointment Date',
    description: 'The reserved calendar date and time slot for presenting original documents and capturing biometrics at an Aadhaar Seva Kendra.',
    significance: 'Guarantees queue priority at UIDAI-operated ASKs; can be rescheduled up to 3 times before slot expiry.',
  },
  {
    id: 'date-enrolment',
    label: '3. Enrolment / Update Date',
    description: 'The exact calendar date and timestamp when the certified operator captures biometrics, photograph, and demographic details.',
    significance: 'Recorded directly inside the 28-digit Enrolment ID (EID) timestamp component.',
  },
  {
    id: 'date-verification',
    label: '4. Verification Date',
    description: 'The date backend UIDAI document scrutiny officers and automated quality algorithms review submitted proof documents.',
    significance: 'Determines whether documents meet prescribed standards or trigger rejection notices.',
  },
  {
    id: 'date-acknowledgement',
    label: '5. Acknowledgement Date',
    description: 'The timestamp printed on the formal Acknowledgement Slip handed to the citizen upon successful counter submission.',
    significance: 'Serves as citizen proof of submission; contains tracking EID or URN for grievance escalation.',
  },
  {
    id: 'date-issue',
    label: '6. Issue / Generation Date',
    description: 'The date UIDAI successfully generates the 12-digit Aadhaar number or commits the demographic update to the CIDR master record.',
    significance: 'The official milestone from which e-Aadhaar becomes instantly available for digital download.',
  },
  {
    id: 'date-dispatch',
    label: '7. Dispatch Date',
    description: 'The date the printed Aadhaar letter or official PVC card is handed over to the Department of Posts (India Post Speed Post).',
    significance: 'Generates the India Post Speed Post consignment tracking number.',
  },
  {
    id: 'date-delivery',
    label: '8. Delivery Date',
    description: 'The final date India Post delivers the sealed physical Aadhaar packet to the citizen’s residential address.',
    significance: 'Concludes the physical delivery lifecycle.',
  },
  {
    id: 'date-validity',
    label: '9. Validity Expiry Date',
    description: 'Adult Aadhaar holds lifelong validity. Blue / Baal Aadhaar (issued to children under 5 years) expires upon the child reaching 5 years of age.',
    significance: 'Mandatory biometric update (MBU) must be completed between ages 5–7 and 15–17 to keep the Aadhaar operational.',
  },
  {
    id: 'date-statutory-turnaround',
    label: '10. Statutory Turnaround Standard',
    description: 'Standard processing timeframe under UIDAI Citizens’ Charter standards: up to 30 to 90 days from data capture.',
    significance: 'Grievance escalation through 1947 or Regional Offices is officially accepted if processing exceeds this period without status updates.',
  },
];

/**
 * Flagged Conflicting & Misleading Online Myths (Integrity Disclosures)
 */
export const FLAGGED_MYTHS = [
  {
    id: 'myth-acknowledgement-id',
    myth: 'An Aadhaar Enrolment Acknowledgement Slip can be used as an Aadhaar Card or Proof of Identity.',
    fact: 'FALSE. The acknowledgement slip is merely a proof of application submission containing an Enrolment ID (EID). It is NOT an Aadhaar card, does NOT contain a 12-digit Aadhaar number, and cannot be used as identity proof for banking, flights, or government welfare verification.',
    source: 'Section 4 & Section 9 of the Aadhaar Act, 2016; UIDAI Public Advisory.',
  },
  {
    id: 'myth-citizenship',
    myth: 'Possessing an Aadhaar Card or Acknowledgement confers Indian Citizenship or Domicile.',
    fact: 'FALSE. Under Section 9 of the Aadhaar Act, 2016, an Aadhaar number or enrolment receipt does not confer any right of citizenship or domicile. Aadhaar is purely a proof of identity and residence for individuals residing in India for 182 days or more.',
    source: 'Section 9, Aadhaar (Targeted Delivery of Financial and Other Subsidies) Act, 2016.',
  },
  {
    id: 'myth-mobile-online',
    myth: 'You can link or update your Mobile Number or Biometrics online from home.',
    fact: 'FALSE. Mobile number updates, email linkages, and biometric refreshes CANNOT be done online. They strictly require in-person biometric authentication at an authorized Aadhaar Seva Kendra or post office/bank centre. Any website claiming to update mobile numbers online is fraudulent.',
    source: 'UIDAI Security Regulations & Circular on Biometric Authentication for Contact Updation.',
  },
  {
    id: 'myth-open-market-pvc',
    myth: 'Plastic / Smart PVC Aadhaar Cards printed at local cyber cafes or photocopy shops are official and valid.',
    fact: 'FALSE & CAUTION. UIDAI has repeatedly cautioned that open-market plastic/PVC cards printed by unauthorized cyber cafes are not recognized and violate security standards. The only official PVC card is ordered via myaadhaar.uidai.gov.in for ₹50, which includes digitally signed QR codes, holograms, microtext, and ghost images.',
    source: 'UIDAI Public Notice on Unauthorized PVC Card Printing; Regulation 14.',
  },
  {
    id: 'myth-excessive-fees',
    myth: 'Aadhaar enrolment and update centres can charge whatever they want (e.g. ₹200 to ₹500).',
    fact: 'FALSE. UIDAI strictly caps official fees: New Enrolment is 100% FREE; Mandatory Biometric Updates for children are 100% FREE; Demographic updates at centres cost exactly ₹50 (inclusive of GST); Biometric updates cost ₹100. Any centre demanding higher fees should be reported to 1947 or helpdesk@uidai.gov.in.',
    source: 'UIDAI Circular No. 13 of 2020 on Maximum Prescribed Customer Charges.',
  },
  {
    id: 'myth-unlimited-changes',
    myth: 'Citizens can update their Name and Date of Birth as many times as they want.',
    fact: 'FALSE. UIDAI imposes strict lifetime limits to prevent identity fraud: Name can be updated only TWICE in a lifetime; Date of Birth can be updated only ONCE in a lifetime (and requires documentary proof); Gender can be updated only ONCE. Any further exception requires formal written approval from the UIDAI Regional Office.',
    source: 'UIDAI Office Memorandum F. No. 28011/64/2017-UIDAI on Update Exceptions.',
  },
];

/**
 * Frequently Asked Questions Grounded in Official UIDAI Standards
 */
export const AADHAAR_FAQS = [
  {
    q: 'What is the 28-digit Enrolment ID (EID) and where is it on the receipt?',
    a: 'The Enrolment ID (EID) is a 28-digit number printed at the top of your Enrolment Acknowledgement Slip. It consists of a 14-digit Enrolment Number (formatted as 1234/12345/12345) followed by a 14-digit date and time stamp (YYYY/MM/DD HH:MM:SS). When tracking status on myAadhaar, enter all 28 digits (or 14 digits with date and time).',
  },
  {
    q: 'What is the difference between an EID and a URN?',
    a: 'An EID (Enrolment ID) is issued when you visit an Aadhaar Seva Kendra for a new enrolment or centre-based update. A URN (Update Request Number) is a 14-digit tracking number generated when you submit a demographic or address update request online through the myAadhaar self-service portal.',
  },
  {
    q: 'How long does UIDAI take to process an enrolment or update?',
    a: 'Under the UIDAI Citizens’ Charter, processing standard is up to 30 to 90 days from data capture. Many online demographic updates complete within 5 to 15 days, but statutory de-duplication and backend scrutiny can take up to 90 days. Approval is never instantaneous or guaranteed.',
  },
  {
    q: 'What should I do if I lost my Enrolment Acknowledgement Slip?',
    a: 'You can retrieve your lost EID or Aadhaar number online using the "Retrieve EID / Aadhaar Number" tool on myAadhaar (https://myaadhaar.uidai.gov.in/retrieve-eid-aadhaar). This requires your registered mobile number or registered email address to receive an authentication OTP.',
  },
  {
    q: 'What is the password to open my downloaded e-Aadhaar PDF?',
    a: 'The password to open an e-Aadhaar PDF is an 8-character combination: the first 4 letters of your name in CAPITAL LETTERS (as printed on your Aadhaar) followed by your 4-digit Year of Birth (YYYY). For example, if your name is ANISH KUMAR and your birth year is 1989, the password is ANIS1989.',
  },
  {
    q: 'What is Blue / Baal Aadhaar and when must biometrics be updated?',
    a: 'Baal Aadhaar is issued to children under 5 years of age and is blue in colour. No biometrics (fingerprints or iris) are captured for children under 5; only facial photograph is taken and linked to a parent’s Aadhaar. Biometric update is mandatory twice: first between ages 5 and 7, and second between ages 15 and 17. Both mandatory updates are completely free.',
  },
  {
    q: 'Can I update my address without address proof using Head of Family (HoF)?',
    a: 'Yes. UIDAI provides a Head of Family (HoF) based online address update on myAadhaar. If you lack address proof in your name, you can submit the Aadhaar number of your family head (spouse, parent, etc.), submit a valid Proof of Relationship (such as a ration card or birth certificate), and the HoF must approve the request via OTP within 30 days.',
  },
  {
    q: 'How do I lodge a complaint if an operator overcharges or behaves improperly?',
    a: 'You can immediately call the UIDAI toll-free helpline 1947 or email helpdesk@uidai.gov.in with your 28-digit EID and centre details. You can also file a formal complaint online at https://myaadhaar.uidai.gov.in/file-complaint and track its resolution status.',
  },
];
