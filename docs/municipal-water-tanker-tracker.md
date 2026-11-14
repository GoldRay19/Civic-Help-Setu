# Municipal Water-Tanker Request and Delivery Information Tracker (#724)

## 1. Problem Statement & Citizen Context
During periods of seasonal water shortages, peak summer curtailments, borewell dry-outs, or municipal pipeline contamination, residents across Indian metropolitan cities struggle to access essential drinking water.
Citizens face several systemic hurdles:
1. **Jurisdictional Ambiguity**: Citizens frequently do not know which statutory board (e.g., Delhi Jal Board, Bangalore Water Supply and Sewerage Board, Chennai Metro Water, BMC Hydraulic Wing, HMWSSB) has jurisdiction over their ward, sub-division, or layout.
2. **Opaque Request Channels**: Many residents fall prey to unverified brokers or inflated private tanker rates because official municipal booking portals, emergency ward depot counters, and statutory helplines are fragmented or hard to discover.
3. **Information Asymmetry & Overcharging**: Without transparent knowledge of government price caps (statutory rates per kilolitre or capped ceiling per 6,000L / 12,000L trip), citizens in drought-stressed areas are frequently overbilled.
4. **Unacknowledged Request Distress & Lack of Escalation**: When official tanker requests remain unacknowledged or delayed beyond published SLAs (>24 hours), citizens lack a structured escalation matrix (Junior Engineer -> Executive Engineer -> State Grievance Redressal / Lokayukta) or formal representation documentation.

---

## 2. Ethical Invariants & System Guardrails

### Invariant 1: Strict Anti-Hallucination Guardrail
Civic Help Setu **strictly prohibits** predicting, estimating, or fabricating live tanker vehicle GPS locations, queue positions, or arrival wait times without an authenticated municipal telemetry feed.
- The UI displays an explicit non-speculative banner:
  > *"Live vehicle GPS tracking and speculative queue estimations are strictly prohibited without authenticated municipal telemetry. Citizens are provided official, dated government portals, helplines, and depot walk-in desks."*

### Invariant 2: Zero PII & Address Minimization
- **Exact Address Redaction**: In any shared view, public link, audit log, or exported summary, specific residential unit identifiers (flat number, door number, house number, private building name) are systematically redacted via `maskResidentialAddress()`, retaining only municipal ward, locality, and city.
- **Identity & Contact Protection**: Consumer Account Numbers (CAN / RR numbers), phone numbers, Aadhaar numbers, and PAN cards are stripped by both client-side and server-side validators.

### Invariant 3: Grounded Provenance & Fail-Closed Sourcing
- Every jurisdiction-specific claim (statutory tariff, emergency free quota conditions, escalation contacts, depot addresses) must link to a dated official government or municipal source URL (e.g., `delhijalboard.delhi.gov.in`, `bwssb.karnataka.gov.in`, `cmwssb.tn.gov.in`, `portal.mcgm.gov.in`, `hyderabadwater.gov.in`).
- **Explicit Unavailable State**: If specific ward timings or emergency quotas are not gazetted, they are rendered as `Unavailable from official circulars` rather than assumed.

### Invariant 4: Separation of Official Rules vs. Editorial Guidance
- Statutory municipal orders and gazetted price caps are visually and structurally segregated from editorial community advice (e.g., street clearance advice, hose connection checks).
- Generated escalation letters are explicitly labeled as *"Citizen-Generated Formal Representation"*.

### Invariant 5: Citizen Data Sovereignty
- Personal request logs and pre-delivery preparation checklists live in client-side `localStorage`.
- Citizens maintain complete autonomy to save, reopen, edit, update delivery status, or permanently wipe their records via the **"Delete All Saved Data"** control.

---

## 3. Data Schema & Contracts
Defined in `src/data/waterTankerContract.js`:
- `id`: Lowercase alphanumeric kebab-case slug (e.g., `bengaluru-bwssb-south`).
- `name`: Full authority name.
- `shortCode`: Acronym (e.g., `DJB`, `BWSSB`, `CMWSSB`, `BMC`, `HMWSSB`).
- `managingAuthority`: Full legal statutory authority name.
- `city` and `state`: Geographic territory.
- `jurisdiction`: Structured geographic hierarchy conforming to `jurisdictionService.js`.
- `zones`: Array of covered municipal zones.
- `wards`: Array of covered municipal wards.
- `officialChannels`: Array of `{ type, name, url, phone, hours, instructions }`.
- `eligibilityConditions`: `{ freeSupplyCriteria, paidTankerRules, consumerIdRequired, maxLitresPerOrder, quotaFrequencyDays }`.
- `pricingStructure`: `{ isFreeRationed, standardRateInr, capacityLitres, officialOrderUrl, perKilolitreRateInr, currency }`.
- `escalationMatrix`: Tiered array of `{ tier, role, authority, grievancePortalUrl, statutorySlaHours, phone }`.
- `auditMetadata`: `{ sourceUrl, effectiveDate, lastVerified, verifiedBy }`.

---

## 4. Verification Cadence & Freshness Tiers
Audit freshness is dynamically computed against `Date.now()` using `sourceVerificationService.js`:
- **Verified Fresh (`recent`)**: Last verified within 90 days. Displays green shield badge.
- **Govt. Verified (`standard`)**: Last verified between 91 and 365 days. Displays blue shield badge.
- **Audit Overdue (`overdue`)**: Last verified > 365 days ago. Prompts citizens to confirm rates locally.
- **Audit Pending (`unverified`)**: No verification record exists; marked unverified.

---

## 5. Server-side API & Moderation Queue
- **Endpoint**: `/api/water-tanker-reports` (POST & GET).
- **Abuse Prevention**: Rate-limited (10 requests/min/IP) with single-flight locks via `api/_lib/abuseGuard.js`.
- **Zero-PII Enforcement**: Rejects Aadhaar (`\b\d{4}\s?\d{4}\s?\d{4}\b`), PAN (`\b[A-Z]{5}[0-9]{4}[A-Z]\b`), phone numbers, and exact residential addresses.
- **Receipt Seals**: Generates deterministic cryptographic seals (e.g., `WT-REP-5F12-88B1`) upon receipt.
- **Admin Review Queue**: Managed through `src/components/admin/WaterTankerReviewQueue.jsx` in the Admin Portal.

