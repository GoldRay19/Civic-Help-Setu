# Building Plan Approval and Occupancy-Certificate Readiness Workspace

## Overview
Property owners, home builders, and small developers frequently navigate complex, multi-stage municipal procedures to obtain statutory building approvals. The journey transitions from pre-construction plan sanctions and mid-construction revisions to post-construction work completion certificates (CC) and final occupancy certificates (OC).

Citizens often face procedural uncertainty regarding:
- Which local body has jurisdiction (e.g. Municipal Corporation vs Urban Development Authority).
- Which specific documents constitute admissible evidence versus assumptions.
- How to track scrutiny milestones and rectify departmental deficiency notices under statutory deadlines.
- The critical legal difference between town planning building permission, land-title ownership, and structural safety certification.

The `buildingPlanApprovalWorkspaceService` (`src/services/buildingPlanApprovalWorkspaceService.js`) provides an end-to-end, local-authority-aware preparation workspace that guides citizens through these requirements while enforcing strict privacy, data provenance, and clear legal boundaries.

---

## Key Capabilities

### 1. Four-Stage Lifecycle Separation
The workspace strictly isolates four distinct municipal approval phases:
1. **`PLAN_SANCTION`**: Pre-construction review of proposed architectural drawings, Floor Area Ratio (FAR/FSI), ground coverage, setbacks, and road widening reservations. Concludes with the Sanction Order and Commencement Certificate.
2. **`PLAN_REVISION`**: Application for approving architectural amendments or deviations executed or proposed during construction, requiring comparative superimposed drawings and structural load reviews.
3. **`COMPLETION_CERTIFICATE` (CC)**: Formal declaration and municipal joint inspection verifying that the physical structure has been erected strictly conforming to sanctioned specifications.
4. **`OCCUPANCY_CERTIFICATE` (OC)**: Final administrative permission authorizing safe human habitation and permitting permanent utility connections (water, sewer, and permanent electricity meters).

---

### 2. Competent Municipal vs Development Authority Modeling
Statutory planning authorities in India operate across bifurcated jurisdictions. The workspace models competent authorities with direct links to official single-window scrutiny portals:
- **Bengaluru (Karnataka)**: Bruhat Bengaluru Mahanagara Palike (`BBMP`) & Bangalore Development Authority (`BDA`) via the BBMP BPAS portal.
- **Mumbai (Maharashtra)**: Brihanmumbai Municipal Corporation (`BMC`) & `MMRDA` via AutoDCR under DCPR 2034.
- **Pune (Maharashtra)**: Pune Municipal Corporation (`PMC`) & `PMRDA` under Unified Development Control and Promotion Regulations (UDCPR 2020).
- **Delhi NCT**: Municipal Corporation of Delhi (`MCD`) / `NDMC` & Delhi Development Authority (`DDA`) via MCD OBPS under Unified Building Bye-Laws for Delhi (UBBL 2016).
- **Chennai (Tamil Nadu)**: Greater Chennai Corporation (`GCC`) & Chennai Metropolitan Development Authority (`CMDA`) under TNCDBR 2019.
- **Hyderabad (Telangana)**: Greater Hyderabad Municipal Corporation (`GHMC`) & `HMDA` via TS-bPASS under TS-bPASS Act 2020.

#### Fallback for Unverified Jurisdictions
When a citizen selects an unverified or unlisted jurisdiction, the workspace returns an explicit `UNAVAILABLE_OR_UNVERIFIED` status with guidance toward the National Building Code of India (NBC 2016) and direct contact with the local District Town Planning Directorate (DTCP), preventing reliance on fabricated assumptions.

---

### 3. Structured Categorized Evidence Checklist
Requirements are categorized into four standardized tiers:
- **`OWNERSHIP_EVIDENCE`**: Registered Sale Deed, Encumbrance Certificate (minimum 13 to 30 years search), Municipal Khata/Patta extract, Property tax paid receipts, and Change of Land Use (CLU) orders.
- **`SITE_AND_DRAWINGS`**: Site plan showing plot dimensions and road access width, scaled floor plans with setback annotations, cross-sections, building elevations, parking circulation layouts, and rainwater harvesting designs.
- **`PROFESSIONAL_EVIDENCE`**: Council of Architecture (COA) Registered Architect endorsement, Structural Engineer Seismic and Stability Certificate (NBC 2016), Geotechnical Soil Investigation Report, and construction supervision undertakings.
- **`STATUTORY_NOCS`**: Provisional/Final Fire NOC, Airport Authority of India (AAI) aerodrome height clearance, Tree Officer felling/pruning permissions, and pollution board consents.

---

### 4. Statutory Scope & Legal Boundaries
The service displays a prominent legal disclaimer:
> **Statutory Notice**: Municipal building plan approval certifies compliance with local town planning zoning, FAR/FSI, and setback regulations. It **DOES NOT** confer, establish, or validate legal ownership title to the land. Structural stability must be certified by a registered structural engineer pursuant to the National Building Code of India (NBC 2016).

---

### 5. Scrutiny, Milestone & Deficiency Notice Tracking
- **Milestone Engine**: Tracks application progression across `DOCUMENT_INTAKE_AND_FEE_SCRUTINY`, `TECHNICAL_BYELAW_SCRUTINY`, `SITE_ENGINEER_INSPECTION`, `DEFICIENCY_NOTICE_WINDOW`, `DEMAND_NOTE_PAYMENT`, `SANCTION_RELEASE`, `PLINTH_INSPECTION`, and `OCCUPANCY_ISSUED`.
- **Deficiency Notices**: Records formal observation letters issued by scrutiny officers, tracks rectification descriptions, computes statutory response deadlines, and logs resolution history.

---

### 6. Privacy & Personal Identifier Redaction
To protect citizen privacy:
- User dossiers are strictly bound to authenticated `ownerId`s.
- `sanitizeBuildingPlanDataForExport()` redacts sensitive personal data (names, contact numbers, exact plot survey coordinates, architect license numbers, and file attachment tokens) before exports or community sharing.

---

### 7. Crowdsourced Corrections & Stale Data Governance
- Records feature verification timestamps and maximum freshness thresholds (default 180 days). Older records trigger a `STALE_DATA_WARNING`.
- Contributors can submit correction proposals referencing dated official gazettes or government portal URLs via `submitCorrectionProposal()`.
- Proposals undergo administrator evaluation (`reviewCorrectionProposal()`) before being merged into verified registries.

---

## Verification & Testing
Comprehensive automated tests in `src/services/buildingPlanApprovalWorkspaceService.test.js` verify:
1. Municipal and development authority resolution across supported and unsupported jurisdictions.
2. Stage checklist generation for `PLAN_SANCTION` and `OCCUPANCY_CERTIFICATE`.
3. Dossier instantiation, item completion updates, and milestone progression.
4. Ownership access control and rejection of unauthorized users.
5. Deficiency notice logging, response deadline calculation, and resolution.
6. Lifecycle stage transitions.
7. Privacy redaction and sanitization of export payloads.
8. Crowdsourced correction submission and administrative review.
9. Verification timestamp evaluation and stale data detection.
