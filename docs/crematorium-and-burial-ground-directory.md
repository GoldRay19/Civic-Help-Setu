# Public Crematorium and Burial-Ground Service Information Directory (#728)

## 1. Problem Statement & Compassionate Context
Families arranging last rites are under acute emotional distress, grief, and severe time pressure. In Indian civic administration, crematoriums and burial grounds fall under Urban Local Bodies (Municipal Corporations, Municipal Councils) and Gram Panchayats. Rules, charges, furnace types (Electric, CNG, Traditional Wood), documentation requirements, and out-of-hours night intake vary widely across municipal jurisdictions.

Citizens frequently face predatory middlemen, unofficial charge inflation, and confusion over statutory proofs (e.g., Medical Death Certificate Form 4/4A vs Police Post-Mortem NOC).

---

## 2. Core Invariants & Ethical Constraints

### Invariant 1: No Live Slot Availability Speculation
Civic Help Setu **strictly prohibits** modeling or implying real-time furnace or grave availability unless direct statutory real-time municipal APIs are integrated. Prominently disclaim:
> *"Live slot availability is not tracked or implied. Contact the managing municipal office or facility gate directly."*

### Invariant 2: Fail-Closed Grounding & Provenance
Every claim regarding procedures, statutory fees, or document requirements must link to a dated official government or municipal source (e.g., Municipal Corporation Gazettes, Public Health Department circulars).
- **Explicit Unavailable State**: If fee schedules or booking rules are not published by the municipal body, mark them as `Unavailable from official source` rather than assuming or guessing.
- **Requirement Classification**: Categorize requirements into `required`, `conditional`, `optional`, or `unverified`.

### Invariant 3: Bereaved Family Privacy
- No citizen or deceased names, Aadhaar numbers, or contact details are required or collected to view the directory.
- Checklists are stored purely in client-side `localStorage`. No personal data is transmitted over the network or logged in telemetry.
- Users have the right to inspect, edit, and completely delete their saved checklist data.

---

## 3. Data Schema & Contract
Defined in `src/data/crematoriumContract.js`:
- `id`: Unique lowercase slug (e.g. `delhi-nigambodh-ghat`).
- `name`: Official facility name.
- `facilityType`: `'electric_crematorium' | 'cng_crematorium' | 'traditional_wood_crematorium' | 'burial_ground' | 'cemetery' | 'composite_facility'`.
- `managingAuthority`: Municipal body (e.g. `Municipal Corporation of Delhi`, `BBMP`, `BMC`, `PMC`).
- `jurisdiction`: Structured jurisdiction conforming to Indian administrative boundaries.
- `address`, `state`, `district`, `pincode`, `coordinates`.
- `officialContact`: Verified phone numbers, portal URLs, and emergency helplines.
- `operatingHours`: Operating hours and out-of-hours / night admission policy.
- `bookingProcedures`: Official admission steps or `null` if unconfirmed.
- `statutoryCharges`: Subsidized/free status and itemized fees.
- `requiredDocuments`: Classified required, conditional, and unverified documents.
- `accessibility`: Ramps, mortuary cold storage, hearse bay access.
- `auditMetadata`: `sourceUrl`, `effectiveDate`, `lastVerified`, `verifiedBy`.

---

## 4. Bereavement Preparation Checklist
- Managed via `src/services/checklistStorage.js` and `BereavementChecklistModal.jsx`.
- Automatically populates mandatory documents (Form 4/4A, photo ID, municipal pass).
- Multi-tab conflict resolution with revision counters (`expectedRev`).
- Full user data control: Users can toggle tasks, add custom reminders, and permanently wipe their local checklist data via the `deleteChecklistData()` method.

---

## 5. Community Corrections & Administrative Review
- **Endpoint**: `/api/crematorium-corrections`.
- **Abuse Guard**: Rate limiting (10 req/min/IP) and single-flight execution via `api/_lib/abuseGuard.js`.
- **Input Validation**: Strips HTML tags, enforces `https` official URLs, and strictly rejects personal identity numbers (Aadhaar, PAN) and personal names.
- **Verification Seal**: Emits deterministic cryptographic receipts (e.g. `CB-CORR-XXXX-XXXX`) for audit trails.
- **Admin Review Queue**: Integrated into `src/pages/Admin.jsx` (`CrematoriumCorrectionQueue.jsx`), enabling civic data moderators to review, click-test sources, and approve updates into the verified directory.

---

## 6. Refresh Cadence & Stale Data Thresholds
- **Audit Target**: Every facility record must be audited against official municipal records every 90 days.
- **Freshness Classification**:
  - `recent`: Last verified ≤ 60 days ago.
  - `standard`: Last verified between 61 and 180 days ago.
  - `overdue`: Last verified > 180 days ago (displays an explicit audit warning banner in UI).
  - `unverified`: No verified date or audit pending.

