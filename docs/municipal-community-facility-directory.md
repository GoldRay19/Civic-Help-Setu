# Municipal Community Facility Booking & Permit Directory (#716)

## 1. Problem Statement & Civic Context
Residents, cultural organizations, resident welfare associations (RWAs), and event organizers often struggle to locate public halls, town halls, municipal auditoriums, open exhibition grounds, and sports facilities managed by Urban Local Bodies (Municipal Corporations, Municipal Councils, Gram Panchayats) and Urban Development Authorities. 

In Indian civic administration, booking rules, rental tariffs, advance application lead times, refundable security deposits, and mandatory statutory event permissions (such as Police Sound/Loudspeaker NOC, Fire Safety NOC, and FSSAI temporary food stall licensing) vary widely across jurisdictions. Citizens frequently encounter:
- Opaque tariff schedules and hidden deposit forfeiture clauses.
- Confusion regarding mandatory administrative lead times and booking windows.
- Unclear statutory clearance requirements before holding public gatherings.
- Fake third-party booking agents claiming guaranteed reservations.

---

## 2. Core Invariants & Ethical Constraints

### Invariant 1: No Live Slot Availability Speculation
Civic Help Setu **strictly prohibits** modeling, estimating, or implying real-time calendar slot availability or instant reservation booking. Prominently disclaim in all directory views and cards:
> *"Live slot availability is not tracked. Contact the managing municipal authority or facility counter directly."*
Any fields attempting to represent live queues, real-time availability, or instant booking (`liveSlots`, `availableDates`, `instantBooking`) are banned and rejected by the schema validator.

### Invariant 2: Fail-Closed Grounding & Provenance
Every claim regarding procedures, statutory fees, security deposits, cancellation rules, or permit requirements must link to a dated official government or municipal source (e.g. Municipal Corporation Gazettes, Urban Development bylaws, or official civic portals).
- **Explicit Unavailable State**: If fee schedules, security deposits, or cancellation policies are not published in official records, mark them explicitly as `Unavailable from official source` rather than assuming or filling gaps with guesswork.
- **Requirement Classification**: Categorize requirements and permits into `required`, `conditional`, `optional`, or `unverified`.

### Invariant 3: Citizen Privacy & Zero PII Guarantee
- No citizen names, phone numbers, or identity numbers (Aadhaar, PAN) are collected or exposed in public views, analytics, or shared links.
- Checklists are stored purely in client-side `localStorage`. No personal data is transmitted over the network or logged in telemetry.
- Users have full sovereignty to inspect, edit, and permanently delete their saved checklist data.

---

## 3. Data Schema & Contract
Defined in `src/data/communityFacilityContract.js`:
- `id`: Unique lowercase kebab-case slug (e.g. `delhi-mcd-civic-centre-auditorium`).
- `name`: Official facility name.
- `facilityType`: `'community_hall' | 'town_hall' | 'municipal_auditorium' | 'sports_complex' | 'public_park' | 'open_ground'`.
- `managingAuthority`: Municipal body (e.g. `Municipal Corporation of Delhi`, `BBMP`, `BMC`, `PMC`, `GCC`, `GDA`).
- `jurisdiction`: Structured jurisdiction conforming to Indian administrative boundaries (`level: 'local'`, `states`, `districts`, `localBody`).
- `address`, `state`, `district`, `pincode`, `coordinates`.
- `officialContact`: Verified phone numbers, portal URLs, and physical booking desk location.
- `capacity`: Seated capacity and total attendee capacity.
- `leadTimes`: Minimum prior application lead time (in days) and maximum reservation advance window.
- `operatingHours`: Daily operating hours and permitted shift blocks.
- `permittedActivities` & `prohibitedActivities`: Clear enumerated lists.
- `statutoryCharges`: Subsidized free status and itemized fee schedules by shift/category.
- `securityDeposit`: Refundable flag, statutory amount, refund timeline, and forfeiture conditions.
- `cancellationPolicy`: Published flag (`isAvailable`) and refund deduction percentages based on cancellation timeline.
- `accessibility`: Wheelchair ramps, accessible washrooms, parking availability, elevators, and tactile paving.
- `eventPermits`: Required and conditional clearances (Police Sound NOC, Fire Safety NOC, Electrical inspection).
- `requiredDocuments`: Classified required, conditional, and unverified documents.
- `auditMetadata`: `sourceUrl`, `effectiveDate`, `lastVerified`, `verifiedBy`.

---

## 4. Facility Booking Preparation Checklist
- Managed via `src/services/checklistStorage.js` and `FacilityBookingChecklistModal.jsx`.
- Automatically populates mandatory proofs (Applicant Photo ID, event layout plans, statutory permit applications, waste segregation undertakings).
- Multi-tab conflict resolution with revision counters (`expectedRev`).
- Full user data control: Users can toggle tasks, add custom reminders, and permanently wipe their local checklist data via the `deleteChecklistData()` method.

---

## 5. Community Corrections & Administrative Review
- **Endpoint**: `/api/community-facility-corrections.js`.
- **Abuse Guard**: Rate limiting (10 req/min/IP) and single-flight execution via `api/_lib/abuseGuard.js`.
- **Input Validation**: Strips HTML tags, enforces `https://` official URLs, and strictly rejects personal identity numbers (Aadhaar, PAN) and personal applicant names.
- **Verification Seal**: Emits deterministic cryptographic receipts (e.g. `CF-CORR-XXXX-XXXX`) for audit trails.
- **Admin Review Queue**: Integrated into `src/pages/Admin.jsx` (`CommunityFacilityCorrectionQueue.jsx`), enabling civic data moderators to review, click-test sources, and approve updates into the verified directory.

---

## 6. Refresh Cadence & Stale Data Thresholds
- **Audit Target**: Every facility record must be audited against official municipal records every 90 days.
- **Freshness Classification**:
  - `recent`: Last verified ≤ 60 days ago.
  - `standard`: Last verified between 61 and 180 days ago.
  - `overdue`: Last verified > 180 days ago (displays an explicit audit warning banner in UI).
  - `unverified`: No verified date or audit pending.

