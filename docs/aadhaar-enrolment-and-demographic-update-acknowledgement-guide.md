# Aadhaar Enrolment & Demographic Update Acknowledgement Guide — Research & Implementation Notes

- **Prepared:** 12 November 2026
- **Related issue:** [#530 — [feature][india-docs] Add an Aadhaar enrolment and demographic-update acknowledgement guide](https://github.com/GoldRay19/Civic-Help-Setu/issues/530)
- **Assigned Contributor:** sujitkr268
- **Scope:** Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016 (as amended 2019); Unique Identification Authority of India (UIDAI); Enrolment Acknowledgement Slip; Update Request Number (URN) & Service Request Number (SRN); 28-digit Enrolment ID (EID); Central Identities Data Repository (CIDR); Aadhaar Seva Kendra (ASK); myAadhaar Portal; Head of Family (HoF) based verification; standard UIDAI supporting document framework (PoI, PoA, PoR, DoB); official fee caps; processing timelines; and privacy preservation.
- **Status:** Citizen-facing research documentation, structured datasets, and UI guide implementation.

---

## 1. Statutory Context & Legal Scope

### Governing Legislation
- **The Aadhaar Act, 2016**: *The Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016* (Act No. 18 of 2016), as amended by the *Aadhaar and Other Laws (Amendment) Act, 2019*.
- **Administering Authority**: **Unique Identification Authority of India (UIDAI)**, a statutory authority established under the Ministry of Electronics and Information Technology (MeitY), Government of India.
- **Nature of Aadhaar**: A 12-digit unique random identification number issued to individual resident Indians and qualifying non-residents following biometric de-duplication (10 fingerprints, 2 iris scans, and facial photograph) and demographic verification.

### What an Aadhaar Enrolment / Update Acknowledgement Slip IS
1. **Receipt of Submission**: A physical or electronically generated acknowledgement issued immediately upon completion of data capture at an authorised Aadhaar Seva Kendra (ASK) or via the central myAadhaar online portal.
2. **Contains Tracking Identifiers**:
   - **Enrolment ID (EID)**: A 28-digit unique identifier composed of a 14-digit enrolment number (`xxxx/xxxxx/xxxxx`) and 14-digit timestamp (`yyyy/mm/dd hh:mm:ss`).
   - **Update Request Number (URN)**: A 14-digit tracking number issued for demographic or address change requests submitted through myAadhaar or an ASK.
   - **Service Request Number (SRN)**: A tracking token issued for online paid services (e.g., official PVC card order).
3. **Audit Record of Captured Details**: Displays the exact applicant name, address, date of birth, mobile number, and documents submitted as entered into the system. Residents are required to scrutinize this before signing or leaving the counter.

### What an Acknowledgement Slip is NOT (Crucial Legal Caveats)
1. **NOT an Aadhaar Card or Number**: An acknowledgement receipt does not contain a 12-digit Aadhaar number and does not confirm that an Aadhaar number will ultimately be generated.
2. **NOT Proof of Identity or Address**: Government departments, banks, and airlines do not accept an enrolment acknowledgement slip as a valid proof of identity or address.
3. **NOT Proof of Indian Citizenship or Domicile**: Under Section 9 of the Aadhaar Act, 2016, Aadhaar enrolment or receipt does not confer any right to, or proof of, citizenship or domicile.
4. **NO Guarantee of Enrolment/Update Approval**: Every submission undergoes multi-stage automated backend de-duplication, quality scrutiny, and manual document validation in the UIDAI CIDR pipeline. Applications may be rejected due to low biometric quality, duplicate enrolment, or invalid supporting documents.

---

## 2. Enrolment vs. Demographic Update: Key Distinctions

| Feature | New Aadhaar Enrolment | Aadhaar Demographic Update |
| :--- | :--- | :--- |
| **Target Applicant** | Individuals who have never been allotted an Aadhaar number (residents living in India $\ge$ 182 days in past 12 months, newborns, children, NRIs with Indian passport). | Existing 12-digit Aadhaar holders requiring corrections or changes in name, address, date of birth, gender, mobile, email, or language. |
| **Mandatory Biometrics** | Full capture: 10 fingerprints, both iris scans, and facial photograph (biometrics exempted for children under 5 years of age). | Not required for demographic-only updates. (Biometric update is separate, except mandatory biometric updates for children aged 5–7 and 15–17). |
| **Application Channel** | **In-Person Only** at an authorized Aadhaar Seva Kendra / Registrar Centre. Cannot be done online. | **Online** via `myaadhaar.uidai.gov.in` for Address (Document-based or HoF-based) and Document updates. **In-Person** at ASK for Name, Gender, DoB, Mobile, and Biometrics. |
| **Statutory Official Fee** | **FREE (₹0)** at all authorized centres. | **Online Document Update**: Free during promotional periods. **Demographic at ASK**: ₹50 (inclusive of GST). **Biometric at ASK**: ₹100 (inclusive of GST). |
| **Tracking Token** | 28-digit Enrolment ID (EID). | 14-digit URN (online) or 28-digit EID (centre visit). |
| **Lifetime Limits** | First-time registration only. Subsequent duplicate enrolments are automatically rejected by CIDR de-duplication. | **Name**: Max 2 updates in lifetime. **Date of Birth**: Max 1 update in lifetime. **Gender**: Max 1 update in lifetime. **Address**: Backed by valid PoA. |

---

## 3. Official Channels & Authorised Portals

Only authentic Indian government portals and authorised physical centres are legally empowered to accept Aadhaar applications:

1. **myAadhaar Portal (`https://myaadhaar.uidai.gov.in/`)**:
   - Central citizen self-service portal maintained by UIDAI.
   - Services available online (requires Aadhaar-linked registered mobile for OTP login):
     * Address Update (document-backed or Head of Family consent).
     * Document Upload (PoI/PoA re-verification for Aadhaar issued $>10$ years ago).
     * Check Enrolment & Update Status (using 28-digit EID or 14-digit URN).
     * Download password-protected e-Aadhaar PDF.
     * Order official UIDAI-printed secure PVC Card (₹50 inclusive of Speed Post delivery).
     * Lock/Unlock Biometrics & Generate Virtual ID (VID).
2. **UIDAI Appointment Booking Portal (`https://appointments.uidai.gov.in/`)**:
   - Advance online appointment booking for visiting UIDAI-run Aadhaar Seva Kendras and participating bank/post office centres.
   - Walk-in queue tokens are also available at physical centres.
3. **Authorised Physical Enrolment & Update Centres**:
   - **Aadhaar Seva Kendras (ASKs)**: UIDAI-operated, climate-controlled, air-conditioned model centres with token-based queues and dedicated senior citizen counters.
   - **Registrar Enrolment Centres**: Operated by Public Sector Banks (SBI, PNB, etc.), India Post (Post Offices & IPPB), State Government service agencies (e.g., e-Seva, e-Mitra, MahaOnline, Bangalore One, CSCs where authorised by UIDAI), and BSNL offices.
   - Centre Locator: `https://appointments.uidai.gov.in/easearch.aspx`.

---

## 4. Supporting Document Framework (UIDAI Standard List)

UIDAI enforces a standardized schedule of acceptable supporting documents. Every document submitted must be an **original** (scanned in colour at the centre and returned immediately) and must display the applicant's name clearly.

### A. Proof of Identity (PoI) — Containing Name & Photo
- **Mandatory for**: New Enrolment and Name Correction.
- **Acceptable Documents**:
  1. Passport (Indian or Foreign with valid visa).
  2. PAN Card / e-PAN.
  3. Ration Card / PDS Card with applicant photo.
  4. Voter Identity Card (EPIC) / e-EPIC.
  5. Driving Licence.
  6. Service Photo Identity Card issued by Central / State Govt / PSU / Statutory Body.
  7. Pensioner Photo Card / Freedom Fighter Photo Card.
  8. Unique Disability ID (UDID) Card / Disability Certificate with photo.
  9. Transgender Certificate / Identity Card issued under the Transgender Persons Act, 2019.
  10. Standard Certificate issued on UIDAI-prescribed format signed by Gazetted Officer Group 'A', MP, MLA, MLC, Tehsildar, or Village Panchayat Head (Mukhiya) for rural areas (valid for 3 months from date of issue).

### B. Proof of Address (PoA) — Containing Name & Current Residential Address
- **Mandatory for**: New Enrolment and Address Update.
- **Acceptable Documents**:
  1. Passport.
  2. Bank Account Statement / Passbook (with photo, rubber stamp, and signature of bank official; statement within last 3 months).
  3. Post Office Savings Account Passbook / Statement.
  4. Ration Card / PDS Card with address.
  5. Voter Identity Card (EPIC).
  6. Driving Licence.
  7. Electricity Bill (not older than 3 months).
  8. Water Bill (not older than 3 months).
  9. Landline / Piped Gas / Broadband Bill (not older than 3 months).
  10. Registered Sale Deed / Registered Lease or Rent Agreement.
  11. Property Tax Receipt (not older than 1 year).
  12. Domicile / Nativity Certificate issued by State Government.
  13. Head of Family (HoF) Self-Declaration Form along with valid Proof of Relationship (PoR).

### C. Proof of Date of Birth (DoB)
- **Mandatory for**: New Enrolment and Date of Birth Correction.
- **Acceptable Documents**:
  1. **Birth Certificate**: Issued by the Registrar of Births and Deaths or Municipal Corporation / Local Body. (*Statutory Note*: Under the Registration of Births and Deaths (Amendment) Act, 2023, Birth Certificate is mandatory for all applicants born on or after 1 October 2023).
  2. SSLC Book / Certificate / Matriculation Certificate issued by a recognized education board/university containing DoB.
  3. Passport.
  4. PAN Card.
  5. Government Service Book / Pension Payment Order (PPO).

### D. Proof of Relationship (PoR)
- **Mandatory for**: Children under 5 years (linked to parent) and HoF-based address update.
- **Acceptable Documents**:
  1. Birth Certificate of child showing parents' names.
  2. Ration Card listing all family members.
  3. Marriage Certificate.
  4. CGHS / ECHS / ESIC Medical Card.
  5. Passport of parent / spouse displaying applicant relationship.

---

## 5. Ordered Step-by-Step Citizen Journey (7 Stages)

```
[Stage 1: Service Path & Eligibility Determination]
       ↓
[Stage 2: Original Document Assembly & Name Alignment Check]
       ↓
[Stage 3: Channel Selection (myAadhaar Online vs. ASK Centre Appointment)]
       ↓
[Stage 4: In-Person Biometric / Demographic Capture or Online Submission]
       ↓
[Stage 5: Screen Review & Acknowledgement Slip (EID / URN) Scrutiny]
       ↓
[Stage 6: CIDR Pipeline Tracking & Multi-Stage Validation]
       ↓
[Stage 7: Digital e-Aadhaar Download & Speed Post Card Delivery]
```

### Statutory Milestone Dates with Distinct Legal Consequences
1. **Application / Submission Date**: The date the resident submits the online update form or visits the enrolment centre.
2. **Appointment Date**: The scheduled date and time slot reserved for the visit at an Aadhaar Seva Kendra.
3. **Enrolment / Update Date**: The exact date biometrics and demographic information were captured at the centre.
4. **Verification / Scrutiny Date**: The date UIDAI field verifiers or backend document examiners scrutinize submitted supporting proofs.
5. **Acknowledgement Date**: The date recorded on the official printed or digital acknowledgement slip containing the 28-digit EID or 14-digit URN.
6. **Issue / Generation Date**: The date the UIDAI CIDR successfully generates the 12-digit Aadhaar number or commits the demographic update.
7. **Dispatch Date**: The date the physical Aadhaar letter / PVC card is handed over to the Department of Posts (India Post Speed Post).
8. **Delivery Date**: The date India Post delivers the printed Aadhaar packet to the citizen's postal address.
9. **Validity / Expiry Date**:
   - Adult Aadhaar has **lifelong validity**.
   - Blue / Baal Aadhaar (children under 5 years) is **valid only up to age 5**; mandatory biometric update must be completed between ages 5 and 7, and again between ages 15 and 17.
10. **Statutory Processing Standard**: Up to 30 to 90 days from the date of submission as per UIDAI Citizens' Charter standards.

---

## 6. Official Fee Caps & Anti-Exploitation Safeguards

UIDAI strictly fixes maximum ceiling fees. Charging more than the prescribed amount is a statutory violation under the Aadhaar Regulations:

| Service Category | Prescribed Official Fee | Applicable Conditions |
| :--- | :--- | :--- |
| **New Aadhaar Enrolment** | **FREE (₹0)** | Available to all residents of India. Applicable at all official centres. |
| **Mandatory Biometric Update (MBU)** | **FREE (₹0)** | Free for children aged 5 to 7 years (1st MBU) and aged 15 to 17 years (2nd MBU). |
| **Demographic Update (at Centre)** | **₹50** (all-inclusive) | For Name, Address, Gender, DoB, Mobile, or Email change at ASK / centre. |
| **Biometric Update (at Centre)** | **₹100** (all-inclusive) | Iris, Fingerprints, and Photograph update (with or without demographic change). |
| **Online Document Update (myAadhaar)** | **FREE (₹0)** during promotion / ₹50 at ASK | For re-validating PoI/PoA documents for Aadhaar older than 10 years. |
| **e-Aadhaar PDF Download** | **FREE (₹0)** | Available 24x7 from `myaadhaar.uidai.gov.in`. Password is First 4 letters of name (UPPERCASE) + Year of Birth (YYYY). |
| **Aadhaar PVC Card Order** | **₹50** (all-inclusive) | Official UIDAI-printed pocket-sized card with hologram and ghost image, delivered by Speed Post. |

> **Anti-Fraud Warning**: Unauthorized cyber cafes, private vendors, or plastic card laminators charging ₹200–₹500 for "PVC smart cards" are strictly non-authorized. UIDAI cautions that open-market smart cards or laminated printouts may fail security checks and risk citizen data exposure.

---

## 7. Official UIDAI Support & Escalation Channels

- **Toll-Free Helpline**: `1947` (24x7 automated IVRS support; customer service executives available Mon–Sat 07:00 to 23:00, Sun 08:00 to 17:00).
- **Official Grievance Email**: `helpdesk@uidai.gov.in`.
- **Online Complaint Portal**: `https://myaadhaar.uidai.gov.in/file-complaint`.
- **Complaint Status Tracker**: `https://myaadhaar.uidai.gov.in/check-complaint-status`.
- **UIDAI Regional Offices (ROs)**:
  * RO New Delhi: Delhi, Haryana, Himachal Pradesh, Jammu & Kashmir, Ladakh, Punjab, Chandigarh.
  * RO Lucknow: Uttar Pradesh.
  * RO Ranchi: Bihar, Jharkhand, West Bengal.
  * RO Guwahati: Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura.
  * RO Mumbai: Maharashtra, Gujarat, Goa, Dadra & Nagar Haveli and Daman & Diu.
  * RO Bengaluru: Karnataka, Kerala, Tamil Nadu, Puducherry, Lakshadweep.
  * RO Hyderabad: Andhra Pradesh, Telangana, Odisha, Chhattisgarh, Andaman & Nicobar Islands.

---

## 8. Privacy & Data Handling Guarantee

- **Zero Aadhaar Storage**: This platform does not collect, log, store, or transmit full 12-digit Aadhaar numbers or biometric details.
- **Zero Portal Scraping or Automation**: All tracking explanations and calculations are purely client-side informational guides. No citizen credentials or government sessions are automated.
- **Client-Side Simulation**: Date calculations and status timeline trackers execute locally in the citizen's browser without telemetry or third-party cookies.
- **Security Guidance**: Citizens are reminded never to share Aadhaar OTPs, never to upload Aadhaar copies to unverified web portals, and to mask their Aadhaar number (Masked Aadhaar showing only last 4 digits `xxxx-xxxx-1234`) when sharing for general identity purposes.

---
**Last verified:** 12 November 2026. Official source: Unique Identification Authority of India (UIDAI), Government of India.
