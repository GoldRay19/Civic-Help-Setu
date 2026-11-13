import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AadhaarGuide from './AadhaarGuide';
import {
  INDIAN_STATES_AND_UTS,
  UIDAI_REGIONAL_OFFICES,
  getJurisdictionDetails,
  SERVICE_MODES,
  OFFICIAL_FEE_SCHEDULE,
  SUPPORTING_DOCUMENTS,
  ORDERED_JOURNEY_STAGES,
  MILESTONE_DATE_FIELDS,
  FLAGGED_MYTHS,
  AADHAAR_FAQS
} from '../../data/aadhaarGuideData';

describe('AadhaarGuide Component (#530)', () => {
  it('renders the scannable guide header, page title, and official UIDAI statutory basis', () => {
    const html = renderToStaticMarkup(<AadhaarGuide />);

    expect(html).toContain('Aadhaar Enrolment &amp; Demographic Update Acknowledgement Guide');
    expect(html).toContain('Unique Identification Authority of India (UIDAI)');
    expect(html).toContain('Central Statutory Standard');
    expect(html).toContain('myAadhaar Portal');
    expect(html).toContain('Book ASK Appointment');
  });

  it('renders accessible navigation tabs and tab panels with correct ARIA roles', () => {
    const html = renderToStaticMarkup(<AadhaarGuide />);

    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-controls="panel-overview"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('id="panel-overview"');
  });

  it('renders all 3 service mode options in the header section', () => {
    const html = renderToStaticMarkup(<AadhaarGuide />);

    expect(html).toContain('New Aadhaar Enrolment');
    expect(html).toContain('Aadhaar Demographic Update');
    expect(html).toContain('Biometric &amp; Mandatory Biometric Update (MBU)');
    expect(html).toContain('First-Time Application');
    expect(html).toContain('Existing Aadhaar Holders');
    expect(html).toContain('Children &amp; Adult Biometrics');
  });

  it('renders purpose definitions: what acknowledgement establishes vs what it does NOT establish', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="overview" />);

    // What it establishes
    expect(html).toContain('What the Acknowledgement Slip Establishes');
    expect(html).toContain('Official Submission Record');
    expect(html).toContain('Unique 28-digit EID or 14-digit URN');
    expect(html).toContain('Audit Trail of Submitted Data');

    // What it does NOT establish
    expect(html).toContain('What the Acknowledgement Slip Does NOT Establish');
    expect(html).toContain('NOT an Aadhaar Card or Number');
    expect(html).toContain('NOT Proof of Identity or Address');
    expect(html).toContain('NOT Proof of Citizenship or Domicile');
    expect(html).toContain('Section 9 of the Aadhaar Act, 2016');
  });

  it('renders comparisons for Acknowledgement Slip, e-Aadhaar, and official PVC card', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="overview" />);

    expect(html).toContain('1. Acknowledgement Slip');
    expect(html).toContain('Temporary Status Token');
    expect(html).toContain('2. e-Aadhaar (Digital PDF)');
    expect(html).toContain('Full Legal Document (Free)');
    expect(html).toContain('3. Official Aadhaar PVC Card');
    expect(html).toContain('Physical Durable Card (₹50)');
  });

  it('renders jurisdiction details for Delhi in jurisdictions tab', () => {
    const html = renderToStaticMarkup(
      <AadhaarGuide initialTab="jurisdictions" initialState="Delhi" />
    );

    expect(html).toContain('Jurisdiction Profile');
    expect(html).toContain('Delhi');
    expect(html).toContain('Government of NCT of Delhi');
    expect(html).toContain('Municipal Corporation of Delhi (MCD)');
    expect(html).toContain('UIDAI Regional Office, New Delhi');
  });

  it('displays the national standard fallback notice when jurisdiction has no separate state-level variation', () => {
    const html = renderToStaticMarkup(
      <AadhaarGuide initialTab="jurisdictions" initialState="Goa" />
    );

    expect(html).toContain('Not specified by the linked official source.');
    expect(html).toContain('Centrally governed by UIDAI standards without state-level procedural variance.');
    expect(html).toContain('Pan-India Statutory Equality');
  });

  it('renders the 7 UIDAI Regional Offices in the directory', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="jurisdictions" />);

    expect(html).toContain('UIDAI Regional Offices Directory');
    expect(html).toContain('UIDAI Regional Office, New Delhi');
    expect(html).toContain('UIDAI Regional Office, Lucknow');
    expect(html).toContain('UIDAI Regional Office, Ranchi');
    expect(html).toContain('UIDAI Regional Office, Guwahati');
    expect(html).toContain('UIDAI Regional Office, Mumbai');
    expect(html).toContain('UIDAI Regional Office, Bengaluru');
    expect(html).toContain('UIDAI Regional Office, Hyderabad');
    expect(html).toContain('1947');
  });

  it('renders the ordered 7-stage application journey in journey tab', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="journey" />);

    expect(html).toContain('Ordered 7-Stage Citizen Journey');
    expect(html).toContain('1');
    expect(html).toContain('Select Service Path &amp; Review Prerequisites');
    expect(html).toContain('Assemble Original Supporting Proofs');
    expect(html).toContain('Choose Channel &amp; Book Appointment');
    expect(html).toContain('In-Person Capture or Online Submission');
    expect(html).toContain('Scrutinize Screen &amp; Collect Acknowledgement Slip');
    expect(html).toContain('Track CIDR Validation &amp; De-Duplication');
    expect(html).toContain('Download e-Aadhaar &amp; Speed Post Card Delivery');
  });

  it('segregates mandatory vs conditional vs optional documents in documents tab', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="documents" />);

    // Proof of Identity
    expect(html).toContain('Proof of Identity (PoI)');
    expect(html).toContain('Indian or Valid Foreign Passport');
    expect(html).toContain('PAN Card / e-PAN Card');
    expect(html).toContain('Voter Identity Card (EPIC) / e-EPIC');
    expect(html).toContain('Driving Licence');

    // Proof of Address
    expect(html).toContain('Proof of Address (PoA)');
    expect(html).toContain('Bank Statement / Passbook with Photo &amp; Bank Stamp');
    expect(html).toContain('Utility Bills (Electricity / Water / Piped Gas / Landline)');
    expect(html).toContain('Head of Family (HoF) Based Address Verification');

    // Date of Birth
    expect(html).toContain('Proof of Date of Birth (DoB)');
    expect(html).toContain('Birth Certificate issued by Registrar of Births and Deaths / Municipal Body');
    expect(html).toContain('SSLC / 10th Standard Board Certificate or Marksheet');

    // Relationship
    expect(html).toContain('Proof of Relationship (PoR)');

    // Optional
    expect(html).toContain('Optional Supporting Attributes (Contact Details)');
    expect(html).toContain('Active Personal Mobile Number');
    expect(html).toContain('Personal Email Address');
  });

  it('renders official fee caps and anti-exploitation grievance channels in fees tab', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="fees" />);

    expect(html).toContain('Official UIDAI Prescribed Customer Fee Caps');
    expect(html).toContain('New Aadhaar Enrolment');
    expect(html).toContain('₹0 (Free)');
    expect(html).toContain('Mandatory Biometric Update (MBU) for Minors');
    expect(html).toContain('Demographic Update at ASK / Centre');
    expect(html).toContain('₹50 (inclusive of 18% GST)');
    expect(html).toContain('Biometric Update (with or without demographic)');
    expect(html).toContain('₹100 (inclusive of 18% GST)');
    expect(html).toContain('Order Aadhaar PVC Card (Official Reprint)');
    expect(html).toContain('₹50 (inclusive of GST and Speed Post delivery)');

    // Grievance channels
    expect(html).toContain('Anti-Exploitation Rule &amp; Overcharging Redressal');
    expect(html).toContain('1947');
    expect(html).toContain('helpdesk@uidai.gov.in');
    expect(html).toContain('https://myaadhaar.uidai.gov.in/file-complaint');
  });

  it('renders EID vs URN breakdown and the 10 distinct milestone date labels in tracking tab', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="tracking" />);

    expect(html).toContain('The 28-Digit Enrolment ID (EID)');
    expect(html).toContain('The 14-Digit Update Request Number (URN)');
    expect(html).toContain('Client-Side Application Milestone Estimator');
    expect(html).toContain('Privacy Guarantee: No PII Collected');

    // 10 distinct date labels
    expect(html).toContain('The 10 Distinct Milestone Date Labels (Never Merged)');
    expect(html).toContain('1. Application Date');
    expect(html).toContain('2. Appointment Date');
    expect(html).toContain('3. Enrolment / Update Date');
    expect(html).toContain('4. Verification Date');
    expect(html).toContain('5. Acknowledgement Date');
    expect(html).toContain('6. Issue / Generation Date');
    expect(html).toContain('7. Dispatch Date');
    expect(html).toContain('8. Delivery Date');
    expect(html).toContain('9. Validity Expiry Date');
    expect(html).toContain('10. Statutory Turnaround Standard');
  });

  it('renders flagged conflicting online myths and integrity disclosures in caveats tab', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="caveats" />);

    expect(html).toContain('Flagged Misleading Claims &amp; Online Myths');
    expect(html).toContain('An Aadhaar Enrolment Acknowledgement Slip can be used as an Aadhaar Card');
    expect(html).toContain('Possessing an Aadhaar Card or Acknowledgement confers Indian Citizenship');
    expect(html).toContain('You can link or update your Mobile Number or Biometrics online from home');
    expect(html).toContain('Plastic / Smart PVC Aadhaar Cards printed at local cyber cafes');
    expect(html).toContain('Citizens can update their Name and Date of Birth as many times as they want');
  });

  it('renders FAQs and source transparency verification notice in faqs tab', () => {
    const html = renderToStaticMarkup(<AadhaarGuide initialTab="faqs" />);

    expect(html).toContain('Frequently Asked Questions (UIDAI Standard Answers)');
    expect(html).toContain('What is the 28-digit Enrolment ID (EID) and where is it on the receipt?');
    expect(html).toContain('What is the difference between an EID and a URN?');
    expect(html).toContain('What is the password to open my downloaded e-Aadhaar PDF?');
    expect(html).toContain('Source Transparency &amp; Verification Notice:');
    expect(html).toContain('Unique Identification Authority of India (UIDAI)');
  });

  it('verifies dataset integrity for states, regional offices, fees, and journey stages', () => {
    expect(INDIAN_STATES_AND_UTS.length).toBe(36); // 28 states + 8 UTs
    expect(UIDAI_REGIONAL_OFFICES.length).toBe(7);

    // Test jurisdiction fallback function
    const delhi = getJurisdictionDetails('Delhi');
    expect(delhi.state).toBe('Delhi');
    expect(delhi.verified).toBe(true);

    const goa = getJurisdictionDetails('Goa');
    expect(goa.isNationalStandard).toBe(true);
    expect(goa.notes).toContain('Not specified by the linked official source.');

    // Service modes
    expect(SERVICE_MODES.length).toBe(3);
    SERVICE_MODES.forEach((mode) => {
      expect(mode.id).toBeDefined();
      expect(mode.title).toBeTruthy();
      expect(mode.fee).toBeTruthy();
      expect(mode.trackingIdentifier).toBeTruthy();
    });

    // Fee schedule
    expect(OFFICIAL_FEE_SCHEDULE.length).toBe(7);
    OFFICIAL_FEE_SCHEDULE.forEach((feeItem) => {
      expect(feeItem.id).toBeDefined();
      expect(feeItem.service).toBeTruthy();
      expect(feeItem.fee).toBeTruthy();
      expect(feeItem.officialRule).toBeTruthy();
    });

    // Supporting documents
    expect(SUPPORTING_DOCUMENTS.poi.length).toBeGreaterThanOrEqual(5);
    expect(SUPPORTING_DOCUMENTS.poa.length).toBeGreaterThanOrEqual(4);
    expect(SUPPORTING_DOCUMENTS.dob.length).toBeGreaterThanOrEqual(3);
    expect(SUPPORTING_DOCUMENTS.por.length).toBeGreaterThanOrEqual(3);
    expect(SUPPORTING_DOCUMENTS.optional.length).toBeGreaterThanOrEqual(2);

    // Journey stages
    expect(ORDERED_JOURNEY_STAGES.length).toBe(7);
    ORDERED_JOURNEY_STAGES.forEach((stg, idx) => {
      expect(stg.stage).toBe(idx + 1);
      expect(stg.title).toBeTruthy();
      expect(stg.description).toBeTruthy();
      expect(stg.dateLabel).toBeTruthy();
    });

    // Milestone date fields
    expect(MILESTONE_DATE_FIELDS.length).toBe(10);

    // Flagged myths
    expect(FLAGGED_MYTHS.length).toBe(6);

    // FAQs
    expect(AADHAAR_FAQS.length).toBe(8);
  });
});
