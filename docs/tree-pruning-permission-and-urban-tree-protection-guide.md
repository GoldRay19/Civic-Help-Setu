# Tree-Pruning Permission and Urban Tree Protection Guide

## Overview
Urban trees in India provide critical ecological benefits, canopy cooling, and biodiversity preservation. However, residential property owners, resident welfare associations (RWAs), and property managers frequently face procedural uncertainty regarding:
- When branch trimming is exempt versus when heavy branch lopping or pollarding legally constitutes tree felling.
- Which local authority possesses statutory jurisdiction (the municipal tree authority vs. district forest department).
- Strict evidence requirements, such as admissible geo-tagged defect photographs, ownership proofs, and compensatory afforestation undertakings (e.g., a mandatory 1:10 sapling ratio).
- How to handle emergency storm-damaged or leaning trees without delay, and how to safely and confidentially report suspected illegal tree felling.

The `TreePermissionGuide` and its underlying `treeProtectionService` (`src/services/treeProtectionService.js`) provide a structured, local-authority-aware citizen guidance workspace that enforces strict statutory provenance, transparent data freshness, and privacy-safe citizen record handling.

---

## Key Capabilities

### 1. Operation Classification & Girth Thresholds
The workspace clearly distinguishes between five distinct operational pathways:
1. **`PRUNING`**: Trimming lateral branches. Minor shoot cutting (<10–15.7 cm in trunk or branch girth depending on state rules) is often exempt for routine clearance, whereas lopping, topping, or crown reduction mandates prior statutory Tree Officer clearance.
2. **`TRANSPLANTATION`**: Excavation and mechanical relocation of trees using hydraulic cranes. Mandates root-ball conditioning, designated reception site soil testing, and a minimum 1 to 3 year post-transplantation survival monitoring schedule.
3. **`REMOVAL` / `FELLING`**: Complete removal or trunk felling of standing trees. Requires formal application, mandatory spot inspection, statutory public objection windows, security deposit, and compensatory afforestation.
4. **`EMERGENCY_HAZARD`**: Immediate 24/7 disaster mitigation route for split trunks, severe root heaves, or storm damage threatening life, buildings, or high-tension powerlines. Legally bypasses normal 15–30 day public objection windows.
5. **`ILLEGAL_FELLING_REPORT`**: Confidential citizen whistleblower route for unauthorized cutting, chemical poisoning, or trunk girdling. Directs evidence to Forest Vigilance, Municipal Quick Response Teams, and local police FIR registration under State Preservation of Trees Acts.

---

### 2. Competent Municipal & Forest Authority Directory
Tree authorities operate under distinct state legislation with verified single-window inspection portals:

| Jurisdiction | Local Competent Authority | Statutory Act | Official Sourced Portal | Verification Timestamp |
|---|---|---|---|---|
| **Delhi NCT** | Dept of Forests and Wildlife, GNCTD / Tree Officer | Delhi Preservation of Trees Act, 1994 (DPTA) | [Delhi e-Forest](https://forest.delhigovt.nic.in/tree-felling-permission) | 2026-10-15 |
| **Bengaluru (Karnataka)** | BBMP Forest Cell / Karnataka Forest Dept | Karnataka Preservation of Trees Act, 1976 (KPTA) | [BBMP Single Window](https://bbmp.gov.in/forest.html) | 2026-10-18 |
| **Mumbai (Maharashtra)** | Brihanmumbai Municipal Corporation (BMC) Tree Authority | Maharashtra (Urban Areas) Protection & Preservation of Trees Act, 1975 | [BMC Garden & Trees](https://www.mcgm.gov.in/irj/portal/anonymous/qlgarden) | 2026-10-20 |
| **Pune (Maharashtra)** | Pune Municipal Corporation (PMC) Tree Authority | Maharashtra (Urban Areas) Protection & Preservation of Trees Act, 1975 | [PMC Tree Permission](https://pmc.gov.in/en/tree-cutting-permission) | 2026-10-10 |
| **Chennai (Tamil Nadu)** | Greater Chennai Corporation (GCC) & District Green Committee | Chennai City Municipal Corporation Act, 1919 & Green Guidelines | [GCC Citizen Services](https://chennaicorporation.gov.in/gcc/online-services) | 2026-10-05 |
| **Hyderabad (Telangana)** | GHMC Urban Biodiversity Wing / TS Forest Dept | Telangana Water, Land and Trees Act, 2002 (WALTA) | [TS-bPASS / Forest Portal](https://forests.telangana.gov.in) | 2026-10-25 |

#### Fallback Policy for Unverified Jurisdictions
When a citizen selects an unlisted or unverified regional body:
- The system returns an explicit `UNAVAILABLE_OR_UNVERIFIED` state.
- **Zero Hallucination Guarantee**: The application never fabricates fees, timelines, or procedures.
- Citizens receive an explicit statutory advisory instructing them to consult their District Forest Officer (DFO) or Municipal Commissioner directly before undertaking any tree work.

---

### 3. Data Freshness & Staleness Detection
- Every authority record incorporates a dated `verificationTimestamp` and a maximum freshness threshold (`maxStaleDays`, default 180 days).
- When a record's age exceeds 180 days from the current date, the interface prominently raises a `STALE_DATA_WARNING` banner, advising citizens to confirm active rules with the linked official portal.

---

### 4. Structured Evidence & Dossier Management
Checklist items are organized into three structured categories:
- **`LAND_AND_APPLICANT_PROOF`**: Property tax receipt, registered sale deed / mutation extract, RWA managing committee NOC (for common grounds), and adjacent neighbor consent letters.
- **`PHOTOGRAPHIC_AND_SITE_EVIDENCE`**: Wide-angle contextual shots, close-up defect photos (trunk decay, root heave, cavities), and scaled dimensioned site sketches.
- **`TECHNICAL_AND_COMPENSATION_PROOF`**: Certified Arborist or structural engineer stability reports, signed compensatory planting undertakings (minimum 1:10 ratio), and crane transit reception plans for transplantations.

#### User Checklist Lifecycle (CRUD)
- Users can create, reopen, update, and permanently delete their own checklist records.
- Records are bound to the citizen's authenticated `ownerId`; unauthorized inspections from different users are strictly blocked with an `Access Denied` security error.

---

### 5. Privacy & Personal Identifier Redaction (Zero PII Leaks)
To safeguard citizen privacy:
- The `sanitizeTreeChecklistForExport()` function strips all personal identifiers prior to external exports, shared links, or analytics ingestion.
- `ownerId` is replaced with `REDACTED_CITIZEN_ID`.
- Specific plot numbers and GPS survey coordinates are replaced with `REDACTED_PLOT_SURVEY_LOCATION`.
- Document attachment tokens and personal citizen notes are scrubbed.

---

### 6. Public Objections, Inspections & Statutory Penalties
- **Mandatory Public Objections**: For non-hazardous mature tree removals, statutes mandate a 15 to 30 day public notice window in local newspapers and municipal websites to allow environmental objections.
- **Statutory Penalties**: Unauthorized felling or severe unpermitted branch pruning is a cognizable criminal offense punishable by up to 1 year imprisonment, fines ranging from ₹10,000 to ₹1,00,000+ per tree, and seizure/forfeiture of timber and woodcutting machinery.

---

### 7. Crowdsourced Corrections & Administrator Review
- Citizens can submit sourced correction proposals for outdated circulars, new helpline numbers, or changed municipal URLs.
- Every submission must link to a dated official government gazette or `.gov.in` source.
- All proposals enter an administrative review queue (`PENDING_ADMIN_REVIEW`) and are merged into production data only upon administrator approval.

---

## Verification & Testing
Comprehensive automated tests in:
1. `src/services/treeProtectionService.test.js`:
   - Jurisdiction resolution across verified cities and unverified fallbacks.
   - Requirement differentiation between pruning, transplantation, and removal.
   - 24/7 emergency hazardous tree protocol and whistleblower illegal felling routing.
   - Checklist dossier CRUD lifecycle and owner authorization guards.
   - PII export redaction and data sanitization.
   - Server-side validation of inputs and community correction admin workflows.
2. `src/components/services/TreePermissionGuide.test.jsx`:
   - Full markup rendering and WCAG 2.1 AA accessibility attributes (`role="tablist"`, `role="tab"`, `role="tabpanel"`).
   - Dynamic view state rendering (fresh verified source badge, stale warning, and explicit unverified alert state).
   - Action switcher and statutory notice vs. editorial advice distinction.
3. `src/pages/TreePermissionGuidePage.test.jsx`:
   - Dedicated route view and navigation breadcrumb testing.

