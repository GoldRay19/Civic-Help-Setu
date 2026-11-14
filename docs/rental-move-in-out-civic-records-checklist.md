# Rental Move-In and Move-Out Civic Records Checklist (#726)

## 1. Problem Statement & Citizen Transition Context
Tenants and landlords across Indian cities undergo significant friction during occupancy changes due to uncoordinated public-service records, unrecorded baseline utility meters, and statutory compliance gaps.

During occupancy transitions, citizens routinely encounter:
- **Disputed Utility Meter Handover**: Electricity (kWh), municipal water (kL/units), and piped natural gas (PNG SCM) meters are rarely documented with dated, joint acknowledgments on move-in day, causing retroactive disputes over prior arrears upon move-out.
- **Consumer ID & Property Mapping**: Inability to identify consumer account IDs (e.g. BESCOM Account ID, BSES Contract Account / CA number, BWSSB RR number, IGL BP number) or verify that previous consumption cycles are zero-arrears.
- **Statutory Address Evidence**: Incomplete knowledge regarding how to leverage registered rent agreements with the sub-registrar department as valid proof of address for central identity updates (UIDAI Aadhaar, Election Commission of India / ECI Form 8 constituency shifting, LPG distributor transfer).
- **Mandatory Police Intimation**: Overlooking statutory tenant verification or intimation filings mandated by local police commissionerates (e.g. Delhi Police, Mumbai Police, Karnataka State Police).

---

## 2. Core Architectural Invariants & Ethical Constraints

### Invariant 1: Neutral Civic Guidance (Strictly Non-Arbitration)
Civic Help Setu **strictly does not arbitrate contractual security deposit disputes, private damages deductions, or rental pricing claims**. Prominently displayed across all views:
> *"Civic Help Setu provides neutral guidance for public-service accounts, utility meter readings, and government address evidence. We do not arbitrate contractual security deposit disputes or private landlord-tenant monetary claims."*

### Invariant 2: Fail-Closed Official Provenance
Every transition rule, procedure, and SLA must link to a dated official government, utility distribution company (DISCOM), water board, or police portal:
- Central: `https://myaadhaar.uidai.gov.in`, `https://voters.eci.gov.in`
- State/DISCOM: `https://bescom.karnataka.gov.in`, `https://www.bsesdelhi.com`, `https://bwssb.karnataka.gov.in`, `https://www.iglonline.net`
- Police: `https://delhipolice.gov.in`, `https://citizen.mahapolice.gov.in`
- Unverified commercial aggregators or insecure `http://` URLs are strictly rejected by both contract validation and serverless endpoints.

### Invariant 3: Explicit Unavailable-Data States
When an Urban Local Body (ULB) or utility board lacks an automated tenant sub-meter re-registration portal or does not publish a statutory turnaround SLA, the record must explicitly record:
`{ turnaroundSchedule: { workingDays: null, isUnavailable: true, unavailableReason: '...' } }`
Guessing or assuming turnaround times is strictly prohibited by the contract schema.

### Invariant 4: Separation of Verbatim Official Instructions from Editorial Tips
Official instructions sourced from authority manuals are preserved verbatim. Recommendations, transition tips, and cautionary warnings authored by Civic Help Setu are rendered in distinct callout blocks labeled `"Editorial Tip"`.

### Invariant 5: Citizen Privacy & Local Client-Side Isolation
- Meter readings, checklist check-states, handover inventory checks, and private photo references remain strictly inside the client's `localStorage` (`civic_rental_transition_checklists_v1`).
- No citizen identifiers, photo payloads, or lease agreements are uploaded to any server.
- Users have full autonomy to review, edit, export, and permanently delete their checklist data at any time via the `"Delete My Checklist Data"` action.

---

## 3. Data Schema & Typed Contract
Defined in `src/data/rentalTransitionContract.js`:
- `id`: Lowercase kebab-case slug (e.g. `bescom-move-in-meter-recording`).
- `title`: Complete transition title.
- `stage`: `'move_in' | 'move_out'`.
- `category`: `'electricity' | 'water' | 'piped_gas' | 'municipal_tax' | 'police_intimation' | 'address_evidence'`.
- `authority`: Managing statutory entity.
- `jurisdiction`: Structured jurisdiction conforming to Indian administrative boundaries (`national`, `state`, `district`, `local`).
- `sourceUrl`: Strict HTTPS official government or utility board link.
- `publishedDate`: ISO date `YYYY-MM-DD`.
- `turnaroundSchedule`: `{ workingDays, isUnavailable, unavailableReason }`.
- `meterReadingConfig`: `{ isApplicable, meterType, unit, requiresJointConfirmation }`.
- `handoverInventory`: Array of `{ id, label, requiredForMoveOut }`.
- `officialInstructions`: Array of verbatim instructions.
- `editorialNotes`: Array of advisory guidance notes.
- `auditMetadata`: `{ effectiveDate, lastVerified, verifiedBy, sourceUrl, status }`.

---

## 4. Community Submissions & Administrator Review
- **Endpoint**: `/api/rental-checklist-corrections`.
- **Abuse Guard**: Rate limiting (10 req/min/IP) and single-flight execution via `api/_lib/abuseGuard.js`.
- **Server Validation**: Strict HTTPS validation, HTML tag stripping, and PII inspection (rejects Aadhaar, PAN, phone numbers, and lease financial amounts).
- **Verification Seal**: Emits deterministic cryptographic receipts (e.g. `RC-CORR-XXXX-XXXX`).
- **Admin Review Queue**: Embedded in `src/pages/Admin.jsx` (`RentalCorrectionQueue.jsx`), allowing civic moderators to click-test official source URLs before publishing updates.

---

## 5. Verification & Testing Strategy
- Contract validation tests: `src/data/rentalTransitionContract.test.js`
- Storage & concurrency tests: `src/services/rentalChecklistStorage.test.js`
- Service & filtering tests: `src/services/rentalTransitionService.test.js`
- Serverless API tests: `api/rental-checklist-corrections.test.js`
- Admin review tests: `src/components/admin/RentalCorrectionQueue.test.jsx`
- Workspace page tests: `src/pages/RentalTransitionWorkspace.test.jsx`

