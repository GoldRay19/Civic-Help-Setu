# Fire NOC and Fire-Safety Compliance Preparation Guide (#719)

## 1. Overview & Problem Definition
Building owners, architects, and commercial operators frequently struggle to identify:
1. Whether their premises require a statutory Fire NOC / Fire Safety Certificate.
2. Which jurisdictional authority exercises competent jurisdiction (State Fire Directorate vs. Municipal Fire Brigade).
3. The specific drawings and active/passive fire suppression equipment required for inspections across building lifecycle stages.

Civic-Help-Setu provides a **building-category and jurisdiction-aware preparation guide** grounded in published state byelaws and Part 4 of the National Building Code of India (NBC 2016).

---

## 2. Core Legal & Non-Engineering Boundary
> [!IMPORTANT]
> **Procedural Guidance Only**: Civic-Help-Setu provides administrative document preparation assistance and statutory rule discovery. It **DOES NOT** provide authoritative fire-engineering calculations (e.g. pump head pressure sizing, egress flow rates, structural fire ratings). Building owners must engage registered fire protection engineers and Directorate-licensed agencies for system execution and physical certification.

---

## 3. Data Provenance & Statutory Citations

| State / Territory | Jurisdictional Authority | Governing Statutory Act | Official Portal | Verification Date |
| :--- | :--- | :--- | :--- | :--- |
| **Delhi (NCT)** | Delhi Fire Service (DFS) | Delhi Fire Service Act, 2007 & Rules, 2010 | https://dfs.delhigovt.nic.in | 2026-03-01 |
| **Maharashtra (Mumbai)** | Mumbai Fire Brigade / BMC | Maharashtra Fire Prevention & Life Safety Measures Act, 2006 | https://mahafireservice.gov.in | 2026-02-15 |
| **Karnataka (Bengaluru)** | Karnataka State Fire & Emergency Services (KSFES) | Karnataka Fire Force Act, 1964 & Rules, 1971 | https://ksfes.karnataka.gov.in | 2026-02-20 |
| **Tamil Nadu (Chennai)** | Tamil Nadu Fire & Rescue Services (TNFRS) | Tamil Nadu Fire Service Act, 1985 & TNCDBR 2019 | https://tnfrs.tn.gov.in | 2026-01-10 |
| **Telangana (Hyderabad)** | TS Disaster Response & Fire Services Department | Telangana Fire Service Act, 1999 & TS-bPASS 2020 | https://fire.telangana.gov.in | 2026-02-25 |
| **Unlisted Territories** | Jurisdictional Fire Station | National Building Code 2016 Part 4 | *Uncatalogued* | *Marked Unverified* |

---

## 4. Staleness Horizon & Refresh Protocol
* **Max Stale Limit**: $180\text{ days}$.
* If `(Date.now() - verificationTimestamp) > 180 days`, the UI automatically displays an explicit **Stale Rulebook Advisory** warning citizens that local municipal notifications or inspection fees may have updated.
* Community members and administrators can submit verifiable gazette citations to refresh records via `/api/fire-compliance-feedback`.

---

## 5. Fallback Handling for Unlisted Jurisdictions
* When a user queries an unlisted state or territory, the system **never guesses or invents compliance rules**.
* Instead, it returns an explicit `UNAVAILABLE_OR_UNVERIFIED` state:
  * Official Portal: `null` (*"Not specified by the linked official source"*)
  * Mandatory status: `false`
  * UI Display: Prominent amber advisory instructing the citizen to approach their local District Headquarters Fire Station directly.

---

## 6. Three-Stage Lifecycle Model

1. **Stage 1: Provisional Fire NOC (Pre-Construction / Sanction)**
   * **Focus**: Architectural drawings, plot setback lines, minimum $6\text{m}$ peripheral driveway width for fire tender movement, staircase widths, and emergency escape travel distances.
   * **Deliverable**: Provisional Fire Scheme Recommendation.
2. **Stage 2: Final Fire Safety Certificate (Post-Construction / Occupancy)**
   * **Focus**: On-site verification of installed hardware: dual-source fire pumps (main electric + standby diesel + jockey), static water tanks, wet risers, yard hydrants, automatic sprinkler grid, addressable alarm system, and $1\text{ to }2\text{ hour}$ fire-rated doors.
   * **Deliverable**: Final Fire Safety Certificate (FSC).
3. **Stage 3: Periodic Fire NOC Renewal / Annual Compliance**
   * **Focus**: Operational readiness logbooks, quarterly pump automatic run tests, annual extinguisher servicing/refilling, bi-annual evacuation mock drills, and Form B maintenance certificates from licensed fire agencies.
   * **Deliverable**: Fire Safety Certificate Renewal Endorsement.

---

## 7. Data Privacy & Zero Personal Identifier Invariant
* All checklist progress, file tokens, and deficiency memos are saved **exclusively in the citizen's local device storage** (`localStorage`).
* Dossier exports scrub all personally identifiable information (PII):
  * `ownerId` $\to$ `REDACTED_CITIZEN_ID`
  * `buildingName` $\to$ `REDACTED_PREMISES`
  * `submissionToken` $\to$ `TOKEN_XXXX_REDACTED`
  * Architect / Fire Consultant credentials $\to$ `COA/XXXX/REDACTED`
  * Attachment references $\to$ `REDACTED_FILE_REF`
* No sensitive citizen data or plot coordinates are transmitted to remote analytics or third-party servers.

---

## 8. TypeScript / JSDoc Schema Definitions

```typescript
export interface FireJurisdictionRecord {
  id: string;
  jurisdictionKey: string;
  state: string;
  city: string;
  authorityName: string;
  competentOfficer: string;
  statutoryAct: string;
  portalName: string;
  portalUrl: string | null;
  scrutinyPortal: string | null;
  effectiveDate: string;
  verificationTimestamp: string | null;
  maxStaleDays: number;
  verified: boolean;
  inspectionMandatory: boolean;
  turnaroundDays: number | null;
  validityYears: {
    residential: number | null;
    commercial: number | null;
    hazardous: number | null;
  };
  guidanceNotes?: string;
}

export interface BuildingOccupancySpec {
  code: string;
  name: string;
  description: string;
  heightThresholdMeters: number;
  coveredAreaThresholdSqM: number | null;
  nocMandatoryTrigger: string;
  exemptCondition: string;
  inspectionFocus: string;
}

export interface FireChecklistItem {
  itemId: string;
  category: string;
  label: string;
  mandatory: boolean;
  officialRule: string;
  officialBasis: string;
  completed: boolean;
  verifiedDate: string | null;
  documentRef: string | null;
}

export interface DeficiencyNotice {
  deficiencyId: string;
  memoNumber: string;
  description: string;
  issuingOfficer: string;
  issuedDate: string;
  responseDeadlineDate: string;
  status: 'PENDING_RECTIFICATION' | 'RESOLVED';
  resolvedAt: string | null;
  rectificationDetails: string | null;
}
```

