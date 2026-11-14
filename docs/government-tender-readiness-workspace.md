# Government Tender Participation Readiness Workspace (#722)

## 1. Problem Statement & MSME Vendor Context
Small suppliers, micro-enterprises (MSEs), and early-stage startups face massive informational hurdles when navigating Indian public procurement. Tender notices published across central portals (Government e-Marketplace / GeM, Central Public Procurement Portal / CPPP), State e-Procurement systems (e.g. Karnataka KPPP, Maharashtra MahaTenders), and Urban Local Bodies (Municipal Corporations, Development Authorities) frequently exceed 80–120 pages in length.

Small vendors routinely miss:
- Statutory EMD exemption eligibility under Rule 170 of General Financial Rules (GFR) 2017.
- Precise distinction between mandatory non-negotiable eligibility (e.g. active GSTIN, specific NIC codes on UDYAM certificates) versus evaluative purchase preferences (Class-I Local Supplier under PPP-MII 2017).
- Critical pre-bid meeting registration windows and clarification deadlines.
- Corrigenda and addenda issued after the original NIT publication.

Disqualification or forfeiture of bid security often occurs not due to lack of technical ability, but due to evidence document omissions.

---

## 2. Core Architectural Invariants & Ethical Constraints

### Invariant 1: Non-Transactional Workspace (No Bid Submissions)
Civic Help Setu **strictly does not submit bids, generate financial price quotations, or act as an intermediary for transactions**. Prominently displayed across all views:
> *"Civic Help Setu organizes public procurement notices and statutory eligibility conditions without submitting bids or collecting bidding fees. Generated readiness reports are for vendor self-preparation and compliance auditing only."*

### Invariant 2: Fail-Closed Grounding & Official Provenance
Every tender notice, date, charge, and requirement must link to a dated official government or municipal source:
- Central: `https://gem.gov.in`, `https://eprocure.gov.in` (CPPP).
- State: Official state e-procurement portals (e.g. `https://kppp.karnataka.gov.in`, `https://mahatenders.gov.in`).
- Municipal: Official Urban Local Body portals (e.g. `https://bbmp.karnataka.gov.in`).
- Insecure HTTP sources or unofficial commercial aggregator URLs are strictly rejected by both contract validation and serverless endpoints.

### Invariant 3: Strict Dates & Explicit Unavailable Data States
Dates (published date, closing date, opening date, pre-bid meeting date) are extracted **only when clearly and unambiguously stated in the official notice**.
- If an authority issues an advance procurement notice without a firm closing date, the closing schedule is recorded as:
  `{ date: null, isUnavailable: true, unavailableReason: 'Notice states date to be notified in forthcoming corrigendum.' }`
- Guessing, interpolating, or estimating deadlines is strictly forbidden by the contract schema.

### Invariant 4: Separation of Mandatory Eligibility from Evaluative Preferences
The workspace strictly isolates:
1. **Mandatory Statutory Eligibility**: Conditions that result in immediate technical disqualification if not satisfied (GSTIN, PAN, specific licenses, minimum turnover).
2. **Evaluative Purchase Preferences**: Competitive scoring or purchase margins (e.g. 20% margin for Class-I Local Suppliers, 25% annual MSME reservation).

### Invariant 5: Clear Distinction between Official Notice and Editorial Tips
Official notice excerpts are preserved verbatim from the procurement notice. Explanations, MSME tips, and advisory warnings authored by Civic Help Setu are rendered in distinct callout boxes with visual badges labeled `"Editorial Tip"`.

### Invariant 6: Vendor Privacy & Local Client-Side Isolation
- Checklists, file name references (e.g. `"Udyam_Registration_2026.pdf"`), and internal vendor notes remain strictly inside the client's `localStorage` (`civic_tender_readiness_checklists_v1`).
- No vendor business documents, proprietary pricing, or file payloads are uploaded to any server.
- Users have full autonomy to inspect, edit, and permanently delete their checklist data at any time via the `"Delete My Checklist Data"` action.

---

## 3. Data Schema & Typed Contract
Defined in `src/data/tenderContract.js`:
- `id`: Unique lowercase kebab-case slug (e.g. `gem-2026-b-581902`).
- `tenderRefNumber`: Official tender reference number (e.g. `GEM/2026/B/581902`).
- `title`: Complete official tender title.
- `category`: `'goods' | 'works' | 'services' | 'consultancy'`.
- `authority`: Procuring authority or department name.
- `jurisdiction`: Structured jurisdiction conforming to Indian administrative boundaries (`national`, `state`, `district`, `local`).
- `sourceUrl`: Strict HTTPS official government portal link.
- `publishedDate`: ISO date `YYYY-MM-DD`.
- `closingSchedule`: `{ closingDate, isUnavailable, unavailableReason, closingTime }`.
- `openingSchedule`: `{ openingDate, openingTime }` or `null`.
- `preBidMeeting`: `{ date, time, mode, venueOrLink, isUnavailable, instructions }`.
- `financials`:
  - `estimatedValue`: `{ amount, currency, isDisclosed, statedText }`.
  - `tenderFee`: `{ amount, isExemptForMsme, exemptionBasis, paymentMode }`.
  - `emd`: `{ amount, isExemptForMsme, exemptionBasis, exemptionRules, formsAccepted }`.
- `eligibilityCriteria`:
  - `mandatory`: Array of `{ id, label, description, evidenceRequired, statutoryBasis }`.
  - `preferences`: Array of `{ id, label, description, policyReference, benefitDescription }`.
  - `conditional`: Array of `{ id, condition, requirements }`.
  - `unverifiedGaps`: Array of `{ field, note }`.
- `corrigenda`: Array of `{ corrigendumNumber, publishedDate, title, sourceUrl, summary }`.
- `officialInstructions`: Verbatim notice clauses.
- `editorialNotes`: Civic Help Setu advisory tips.
- `auditMetadata`: `{ effectiveDate, lastVerified, verifiedBy, sourceUrl, status }`.

---

## 4. MSME & Small Vendor Statutory Exemption Basis
The workspace models Indian public procurement statutory exemptions:
1. **Rule 170 of General Financial Rules (GFR) 2017**:
   Micro and Small Enterprises (MSEs) registered with UDYAM or designated agencies are exempt from paying Earnest Money Deposit (EMD). Bidders submit a Bid Securing Declaration in lieu of cash/BG deposit.
2. **Public Procurement Policy for MSEs Order 2012**:
   Mandates 25% annual procurement from MSEs by Central Ministries and PSUs, with special sub-quotas for SC/ST and Women entrepreneurs.
3. **Public Procurement (Preference to Make in India) Order 2017**:
   Purchase preference for Class-I Local Suppliers (local content ≥ 50%) with a 20% margin of preference over non-local L1 bidders.
4. **Startup India Exemptions**:
   DPIIT-recognized startups are granted relaxations from prior turnover and prior experience criteria in public procurements, provided technical specifications are satisfied.

---

## 5. Community Submissions & Administrator Review
- **Endpoint**: `/api/tender-corrections`.
- **Abuse Guard**: Rate limiting (10 req/min/IP) and single-flight execution via `api/_lib/abuseGuard.js`.
- **Server Validation**: Strict HTTPS validation, HTML tag stripping, and PII inspection (rejects Aadhaar, PAN, phone numbers, and proprietary bid quotations).
- **Verification Seal**: Emits deterministic cryptographic receipts (e.g. `TR-CORR-XXXX-XXXX`).
- **Admin Review Queue**: Embedded in `src/pages/Admin.jsx` (`TenderCorrectionQueue.jsx`), allowing civic procurement moderators to click-test official source URLs before publishing updates.

---

## 6. Refresh Cadence & Stale Data Thresholds
- **Audit Target**: Active tenders must be audited against official portals every 15 days, or within 48 hours following a pre-bid conference.
- **Freshness Classification**:
  - `recent`: Last verified ≤ 15 days ago.
  - `standard`: Last verified between 16 and 45 days ago.
  - `stale`: Last verified > 45 days ago (triggers warning banner `TenderStaleDataNotice.jsx` advising vendors to check the official portal for recent corrigenda).
  - `unverified`: Missing audit timestamp or pending review.

