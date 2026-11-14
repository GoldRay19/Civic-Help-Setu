# Public Distribution System Fair Price Shop Service Information Board (#723)

## 1. Problem Statement & Citizen Context
Under the National Food Security Act (NFSA), 2013, over 80 crore citizens across India are entitled to subsidized or free foodgrains (rice, wheat, coarse grains) through a nationwide network of over 5.4 lakh Fair Price Shops (FPS).
However, ration card holders frequently encounter major operational hurdles:
1. **Lack of Locality-Aware Information**: Beneficiaries often do not know their assigned FPS, published operating hours, weekly offs, or monthly distribution window dates (which vary by state and circle).
2. **Portability Uncertainty (ONORC)**: Migrant workers and inter-district movers struggle to identify which nearby FPS has operational e-POS biometric devices supporting One Nation One Ration Card (ONORC).
3. **Information Asymmetry & Overcharging**: Absence of transparent, official entitlement quotas (AAY: 35 kg/family, PHH: 5 kg/person/month) leaves vulnerable citizens susceptible to under-weighment, arbitrary service denial, or refusal to issue printed e-POS transaction slips.
4. **Lack of Escalation Channels**: Cardholders often lack access to designated circle Food Supply Officers (FSO) or toll-free helplines (1967 / 14445).

---

## 2. Ethical Invariants & System Guardrails

### Invariant 1: Strict Anti-Hallucination Stock Invariant
Civic Help Setu **strictly prohibits** claiming, estimating, or predicting real-time grain stock inventory without an authorized, authenticated state/central telemetry API.
- The UI displays an explicit non-speculative banner:
  > *"Live grain stock levels are not tracked or implied on this board without direct government telemetry. Please visit during published distribution hours or consult the state Food & Civil Supplies portal."*

### Invariant 2: Zero PII & Data Minimization
- **No Ration Card Numbers**: The board strictly forbids requesting, storing, displaying, or logging cardholder 10–16 digit Ration Card numbers or Aadhaar numbers in search queries, URLs, public views, analytics, or citizen observation forms.
- Client and server-side validators actively strip and reject payloads containing strings matching Aadhaar (`\b\d{4}\s?\d{4}\s?\d{4}\b`) or Ration Card formats (`\b[A-Z0-9]{10,16}\b`).

### Invariant 3: Grounded Provenance & Fail-Closed Sourcing
- Every jurisdiction-specific claim (allocation quota, hours, dealer name, grievance officer) must link to a dated official government or municipal source (e.g., `nfs.delhi.gov.in`, `ahara.kar.nic.in`, `mahafood.gov.in`, `annavitran.nic.in`).
- **Explicit Unavailable State**: If timings or holiday policies are not published in official circulars, they are displayed as `Unavailable from official source` rather than assumed.

### Invariant 4: Separation of Official Rules vs. Community Observations
- Statutory NFSA entitlement norms and official operating circulars are kept visually and structurally distinct from citizen observations, crowd notices, and community feedback.

### Invariant 5: Citizen Data Sovereignty
- Checklists are stored purely in client-side `localStorage` via `checklistStorage.js`.
- Users have full control to toggle tasks, add custom reminders, and permanently purge their saved checklist data using the **"Delete Saved Data"** control.

---

## 3. Data Schema & Contract
Defined in `src/data/pdsContract.js`:
- `id`: Lowercase alphanumeric kebab-case slug (e.g., `delhi-fps-paharganj-101`).
- `name`: Official Fair Price Shop name.
- `fpsId`: Official government licence number / FPS ID.
- `dealerName`: Authorised dealer, licensee, or self-help group name.
- `managingAuthority`: State Department of Food, Civil Supplies & Consumer Affairs.
- `jurisdiction`: Structured geographic hierarchy conforming to `jurisdictionService.js` (`state`, `district`, `block`, `locality`, `pincode`).
- `operatingHours`: Published daily hours, designated weekly off day, monthly distribution window, and holiday policy.
- `entitlements`: Statutory AAY quota, PHH quota, and official pricing policy.
- `onorcPortability`: Status flag, biometric authentication mode, and portability instructions.
- `officialContact`: National helpline (1967), state toll-free number, and state grievance redressal portal link.
- `auditMetadata`: `sourceUrl`, `effectiveDate`, `lastVerified`, and `verifiedBy`.

---

## 4. Verification Cadence & Freshness Tiers
Audit freshness is calculated dynamically against `Date.now()` using `sourceVerificationService.js`:
- **Verified Fresh (`recent`)**: Last verified within 90 days. Displays green badge.
- **Govt. Verified (`standard`)**: Last verified between 91 and 365 days. Displays blue badge.
- **Audit Overdue (`overdue`)**: Last verified > 365 days ago. Displays an amber warning badge prompting citizens to confirm timings locally.
- **Audit Pending (`unverified`)**: No verification record exists; marked unverified.

---

## 5. Server-side API & Community Moderation
- **Endpoint**: `/api/pds-observations`.
- **Abuse Prevention**: Rate-limited (10 requests/min/IP) with single-flight locks via `api/_lib/abuseGuard.js`.
- **Zero-PII Enforcement**: Rejects Aadhaar, PAN, and Ration Card numbers.
- **Receipt Seals**: Issues deterministic cryptographic verification seals (e.g., `PDS-OBS-4F12-88B1`) upon submission.
- **Moderator Queue**: Managed through `src/components/admin/PdsObservationQueue.jsx` in the Admin Portal, enabling civic moderators to review, check official gazette sources, and approve or reject community submissions.

