# Food Business Registration and FSSAI Licence Readiness Navigator

## Overview
Small food business operators (FBOs), cloud kitchens, restaurateurs, food processors, and petty hawkers often struggle to determine whether their food business requires a **Basic Registration**, a **State Licence**, or a **Central Licence** under the Food Safety and Standards Authority of India (FSSAI). Furthermore, confusion frequently arises between food safety authorization on the Food Safety Compliance System (FoSCoS) portal and statutory municipal trade / health licences issued by local municipal corporations.

The `fssaiReadinessNavigatorService` (`src/services/fssaiReadinessNavigatorService.js`) provides an end-to-end, statutory guidance and preparation workspace. It classifies food business categories based on annual turnover, daily production volume, and operational models, structures evidence dossiers, calculates renewal windows with late-penalty warnings, and enforces strict personal identifier redaction.

---

## Key Capabilities

### 1. Three-Tier Licensing & Statutory Criteria
The navigator models the three distinct statutory tiers under the Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011:

1. **`BASIC_REGISTRATION` (Form A)**:
   - **Target**: Petty food manufacturers, hawkers, itinerant vendors, temporary stalls, and cottage industries.
   - **Turnover Threshold**: Annual turnover not exceeding ₹12 Lakhs per annum.
   - **Production Threshold**: Handling/production capacity (other than milk/meat) up to 100 kg/ltr per day; procurement/handling of milk up to 500 LPD; slaughtering capacity up to 2 large animals, 10 small animals, or 50 poultry birds/day.
   - **Fee**: Flat ₹100 per annum (selectable for 1 to 5 years).
   - **Authority**: Registering Authority (Sub-Divisional / Municipal Food Safety Officer).

2. **`STATE_LICENCE` (Form B)**:
   - **Target**: Medium food manufacturers, mid-tier restaurants, 3-star/4-star hotels, caterers, wholesalers, and state distributors.
   - **Turnover Threshold**: Annual turnover between ₹12 Lakhs and ₹20 Crores per annum.
   - **Production Threshold**: Food production capacity between 101 kg/day and 2 Metric Tonnes (MT)/day; milk processing 501 to 50,000 LPD.
   - **Fee**: ₹2,000 to ₹5,000 per annum depending on business scale and classification.
   - **Authority**: Designated Officer / State Food Safety Commissionerate.

3. **`CENTRAL_LICENCE` (Form B)**:
   - **Target**: Large industrial food manufacturers, 100% Export Oriented Units (EOU), direct importers, e-commerce food platforms (online delivery/marketplaces), and entities operating in more than 1 State.
   - **Central Enclaves**: Food premises located within Central Government enclaves (Airports, Seaports, Defense Establishments, Indian Railways).
   - **Turnover Threshold**: Annual turnover exceeding ₹20 Crores per annum.
   - **Production Threshold**: Food production exceeding 2 MT/day; milk processing > 50,000 LPD.
   - **Fee**: Flat ₹7,500 per annum.
   - **Authority**: Central Licensing Authority (FSSAI HQ / Regional Offices).

---

### 2. Automated Eligibility Determination Engine
`determineLicenceCategory(input)` automatically evaluates:
- `annualTurnoverInLakhs`
- `dailyProductionKgOrLtr`
- `isImporter`, `isEcommerce`, `hasMultiStateOperations`, `isCentralPremises`
- `kindOfBusiness`

It generates an authoritative determination verdict complete with:
- Target tier and form type (`Form A` vs `Form B`).
- Direct official portal application endpoints (`https://foscos.fssai.gov.in/apply-for-licence-registration`).
- Relevant fee schedule and statutory reasons explaining the determination.

---

### 3. Categorized Evidence Matrices
Checklist requirements are organized into four standardized tiers (`getFssaiEvidenceMatrix(tier)`):
- **`IDENTITY_AND_REPRESENTATIVE`**: Passport size photo of FBO, Government Photo ID (Aadhaar, PAN, Voter ID, Passport), and Form IX nomination of authorized person (mandatory for State/Central).
- **`PREMISES_AND_OCCUPANCY`**: Latest electricity/utility bill, registered rent agreement with landlord NOC, or ownership sale deed, and property tax receipt.
- **`BUSINESS_CONSTITUTION`**: Partnership Deed, MCA Certificate of Incorporation & MoA/AoA, or Udhyam Registration, and list of directors/partners with official contacts.
- **`TECHNICAL_AND_FOOD_SAFETY`**: Scaled processing unit layout blueprint, machinery list with HP and installed capacity, water potability test report (IS 10500 standard from NABL accredited laboratory), and Food Safety Management System (FSMS) plan/certificate.

---

### 4. Decoupling from Municipal Trade Licensing
The navigator explicitly presents a prominent statutory notice:
> **Statutory Notice**: FSSAI food safety registration/licence under the Food Safety and Standards Act, 2006 certifies food hygiene, standards, and safety compliance. It **DOES NOT** replace, waive, or substitute municipal trade licences (such as health trade licences issued by local Municipal Corporations) or Fire NOCs required for commercial premises.

---

### 5. Lifecycle Operations: Renewal, Penalty & Verification
- **Renewal Window**: Standard renewal opens **180 days** prior to licence expiry.
- **Penalty Calculation**: Within **30 days** of expiry, a late fee penalty of **₹100 per day** is accrued (`calculateRenewalTimeline()`).
- **Post-Expiry Invalidation**: Once expired, FoSCoS rules mandate a fresh application; renewal is permanently barred.
- **14-Digit Format Validation**: `validateFssaiLicenceNumber()` validates official 14-digit numbers, detects tier prefixes (1 = Registration, 2 = State, 3 = Central), and routes directly to the official FoSCoS verification engine.

---

### 6. Privacy & Personal Identifier Redaction
`sanitizeFssaiDossierForExport(dossier)` redacts all sensitive citizen and enterprise identifiers (citizen owner ID, business trade name, filing numbers, and document attachment tokens) before exports or community sharing.

---

### 7. Crowdsourced Corrections & Stale Data Governance
- Detects stale authority records older than 180 days with `STALE_DATA_WARNING`.
- Contributors can submit correction proposals via `submitFssaiCorrectionProposal()`.
- Proposals undergo administrator review (`reviewFssaiCorrectionProposal()`) before incorporation into verified registries.

---

## Verification & Testing
Comprehensive Vitest unit tests in `src/services/fssaiReadinessNavigatorService.test.js` verify:
1. Category determination across petty vendors, mid-scale restaurants, 3-star hotels, importers, e-commerce, and high-turnover entities.
2. Authority resolution across Central and State Food Safety Commissionerates (Maharashtra, Karnataka, Delhi, Tamil Nadu, Telangana).
3. Explicit `UNAVAILABLE_OR_UNVERIFIED` fallback for unlisted jurisdictions.
4. Categorized evidence matrices for Basic vs State/Central tiers.
5. 14-digit FSSAI licence number validation.
6. Renewal timelines, 30-day penalty calculation, and post-expiry invalidation.
7. User dossier creation, item updates, unauthorized access denial, and clean deletion.
8. Privacy-preserving PII redaction for exports.
9. Community correction submission and administrative review pipeline.
