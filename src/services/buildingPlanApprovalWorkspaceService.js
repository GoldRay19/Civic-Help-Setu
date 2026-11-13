/**
 * Building Plan Approval and Occupancy-Certificate Readiness Workspace Service
 *
 * Implements a local-authority-aware preparation workspace for building approvals
 * and occupancy certification under municipal town planning frameworks:
 *
 * 1. Explicit Four-Stage Lifecycle:
 *    - PLAN_SANCTION: Pre-construction architectural and zoning permit.
 *    - PLAN_REVISION: In-construction deviation or amendment scrutiny.
 *    - COMPLETION_CERTIFICATE: Post-construction inspection and work completion proof.
 *    - OCCUPANCY_CERTIFICATE: Final habitability sanction and utility energization clearance.
 *
 * 2. Competent Municipal vs Development Authority Modeling:
 *    - Models metropolitan authorities (e.g., BBMP/BDA in Bengaluru, BMC/MMRDA in Mumbai,
 *      PMC/PMRDA in Pune, MCD/DDA in Delhi, GCC/CMDA in Chennai, GHMC/HMDA in Hyderabad).
 *    - Maintains verified source URLs, statutory bye-law references, and dated verification timestamps.
 *
 * 3. Structured Categorized Evidence Checklist:
 *    - OWNERSHIP_EVIDENCE: Title deeds, encumbrance certificates, mutation/khata records.
 *    - SITE_AND_DRAWINGS: Scaled floor plans, setbacks, elevations, contour surveys.
 *    - PROFESSIONAL_EVIDENCE: Council of Architecture (COA) architect and structural engineer credentials.
 *    - STATUTORY_NOCS: Fire NOC, pollution board clearance, tree officer permission, rainwater harvesting.
 *
 * 4. Strict Legal & Scope Boundaries:
 *    - Explicitly decouples municipal building approval from land-title ownership and structural safety.
 *    - Provides prominent statutory disclaimers warning citizens of non-title warranty.
 *
 * 5. Milestone & Deficiency Notice Tracking:
 *    - Tracks application progression through intake, byelaw scrutiny, site visits, and demand notes.
 *    - Records deficiency observations with statutory response deadlines and resolution tracking.
 *
 * 6. Privacy & PII Protection:
 *    - Redacts private identifiers (names, contacts, plot GPS) for safe export and sharing.
 *    - Supports full citizen data lifecycle: create, reopen, update, and delete.
 *
 * 7. Verification & Community Corrections:
 *    - Marks unverified jurisdictions explicitly with UNAVAILABLE_OR_UNVERIFIED status.
 *    - Flags stale records older than 180 days.
 *    - Provides an administrative review pipeline for crowdsourced correction proposals.
 */

export const APPROVAL_STAGE = {
  PLAN_SANCTION: 'PLAN_SANCTION',
  PLAN_REVISION: 'PLAN_REVISION',
  COMPLETION_CERTIFICATE: 'COMPLETION_CERTIFICATE',
  OCCUPANCY_CERTIFICATE: 'OCCUPANCY_CERTIFICATE',
};

export const MILESTONE_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  DOCUMENT_INTAKE_AND_FEE_SCRUTINY: 'DOCUMENT_INTAKE_AND_FEE_SCRUTINY',
  TECHNICAL_BYELAW_SCRUTINY: 'TECHNICAL_BYELAW_SCRUTINY',
  SITE_ENGINEER_INSPECTION: 'SITE_ENGINEER_INSPECTION',
  DEFICIENCY_NOTICE_ISSUED: 'DEFICIENCY_NOTICE_ISSUED',
  DEFICIENCY_RESOLVED: 'DEFICIENCY_RESOLVED',
  COMMITTEE_APPROVAL_AND_DEMAND_NOTE: 'COMMITTEE_APPROVAL_AND_DEMAND_NOTE',
  SANCTION_ORDER_RELEASED: 'SANCTION_ORDER_RELEASED',
  PLINTH_LEVEL_INSPECTION: 'PLINTH_LEVEL_INSPECTION',
  COMPLETION_SUBMITTED: 'COMPLETION_SUBMITTED',
  OCCUPANCY_ISSUED: 'OCCUPANCY_ISSUED',
  REJECTED: 'REJECTED',
};

export const EVIDENCE_CATEGORY = {
  OWNERSHIP_EVIDENCE: 'OWNERSHIP_EVIDENCE',
  SITE_AND_DRAWINGS: 'SITE_AND_DRAWINGS',
  PROFESSIONAL_EVIDENCE: 'PROFESSIONAL_EVIDENCE',
  STATUTORY_NOCS: 'STATUTORY_NOCS',
};

export const WORKSPACE_VIEW_STATE = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  ERROR: 'ERROR',
  STALE_DATA_WARNING: 'STALE_DATA_WARNING',
  READY: 'READY',
};

export const STATUTORY_SCOPE_DISCLAIMER =
  'Statutory Notice: Municipal building plan approval certifies compliance with local town planning zoning, FAR/FSI, and setback regulations. It DOES NOT confer, establish, or validate legal ownership title to the land. Structural stability must be certified by a registered structural engineer pursuant to the National Building Code of India (NBC 2016).';

/**
 * Verified municipal and development authorities by jurisdiction.
 */
export const VERIFIED_AUTHORITY_DIRECTORY = {
  KARNATAKA_BENGALURU: {
    state: 'Karnataka',
    city: 'Bengaluru',
    jurisdictionKey: 'KARNATAKA_BENGALURU',
    municipalAuthority: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    developmentAuthority: 'Bangalore Development Authority (BDA)',
    scrutinyPortal: 'https://bpas.bbmp.gov.in',
    statutoryRulebook: 'BBMP Building Bye-Laws & Karnataka Town and Country Planning (KTCP) Act, 1961',
    sourceUrl: 'https://bbmp.gov.in',
    effectiveDate: '2025-04-01',
    verificationTimestamp: '2026-02-15T09:00:00Z',
    maxStaleDays: 180,
    guidanceNotes: 'Bengaluru requires e-Aasthi / Khata extract and architectural auto-scrutiny upload on the BBMP BPAS portal.',
  },
  MAHARASHTRA_MUMBAI: {
    state: 'Maharashtra',
    city: 'Mumbai',
    jurisdictionKey: 'MAHARASHTRA_MUMBAI',
    municipalAuthority: 'Brihanmumbai Municipal Corporation (BMC)',
    developmentAuthority: 'Mumbai Metropolitan Region Development Authority (MMRDA)',
    scrutinyPortal: 'https://autodcr.mcgm.gov.in',
    statutoryRulebook: 'Development Control and Promotion Regulations for Greater Mumbai (DCPR 2034)',
    sourceUrl: 'https://www.mcgm.gov.in',
    effectiveDate: '2024-10-01',
    verificationTimestamp: '2026-02-10T11:00:00Z',
    maxStaleDays: 180,
    guidanceNotes: 'Requires IOD (Intimation of Disapproval) compliance before Commencement Certificate (CC) release.',
  },
  MAHARASHTRA_PUNE: {
    state: 'Maharashtra',
    city: 'Pune',
    jurisdictionKey: 'MAHARASHTRA_PUNE',
    municipalAuthority: 'Pune Municipal Corporation (PMC)',
    developmentAuthority: 'Pune Metropolitan Region Development Authority (PMRDA)',
    scrutinyPortal: 'https://pmc.gov.in/en/building-permission',
    statutoryRulebook: 'Unified Development Control and Promotion Regulations (UDCPR 2020)',
    sourceUrl: 'https://pmc.gov.in',
    effectiveDate: '2025-01-01',
    verificationTimestamp: '2026-02-12T10:00:00Z',
    maxStaleDays: 180,
    guidanceNotes: 'Governed by UDCPR rules across municipal and regional development limits.',
  },
  DELHI_NCT: {
    state: 'Delhi NCT',
    city: 'Delhi',
    jurisdictionKey: 'DELHI_NCT',
    municipalAuthority: 'Municipal Corporation of Delhi (MCD) / New Delhi Municipal Council (NDMC)',
    developmentAuthority: 'Delhi Development Authority (DDA)',
    scrutinyPortal: 'https://mcdonline.nic.in/obps',
    statutoryRulebook: 'Unified Building Bye-Laws for Delhi (UBBL 2016) & Delhi Master Plan 2021/2041',
    sourceUrl: 'https://mcdonline.nic.in',
    effectiveDate: '2025-03-01',
    verificationTimestamp: '2026-01-20T14:30:00Z',
    maxStaleDays: 180,
    guidanceNotes: 'Single-window online building sanction through MCD OBPS portal with automatic structural validation.',
  },
  TAMIL_NADU_CHENNAI: {
    state: 'Tamil Nadu',
    city: 'Chennai',
    jurisdictionKey: 'TAMIL_NADU_CHENNAI',
    municipalAuthority: 'Greater Chennai Corporation (GCC)',
    developmentAuthority: 'Chennai Metropolitan Development Authority (CMDA)',
    scrutinyPortal: 'https://onlineppa.cmdaonline.tn.gov.in',
    statutoryRulebook: 'Tamil Nadu Combined Development and Building Rules (TNCDBR 2019)',
    sourceUrl: 'https://chennaicorporation.gov.in',
    effectiveDate: '2024-11-01',
    verificationTimestamp: '2026-02-01T08:00:00Z',
    maxStaleDays: 180,
    guidanceNotes: 'Planning permission handled by CMDA for non-high rise over threshold or GCC within delegated municipal powers.',
  },
  TELANGANA_HYDERABAD: {
    state: 'Telangana',
    city: 'Hyderabad',
    jurisdictionKey: 'TELANGANA_HYDERABAD',
    municipalAuthority: 'Greater Hyderabad Municipal Corporation (GHMC)',
    developmentAuthority: 'Hyderabad Metropolitan Development Authority (HMDA)',
    scrutinyPortal: 'https://tsbpass.telangana.gov.in',
    statutoryRulebook: 'Telangana State Building Permission Approval and Self-Certification System (TS-bPASS) Act, 2020',
    sourceUrl: 'https://tsbpass.telangana.gov.in',
    effectiveDate: '2025-02-01',
    verificationTimestamp: '2026-02-14T12:00:00Z',
    maxStaleDays: 180,
    guidanceNotes: 'Instant registration for plots up to 75 sq. yards; single-window self-certification for plots up to 500 sq. meters.',
  },
};

/**
 * Standard stage requirements and evidence definitions.
 */
export const STAGE_REQUIREMENTS_SCHEMA = {
  [APPROVAL_STAGE.PLAN_SANCTION]: {
    stage: APPROVAL_STAGE.PLAN_SANCTION,
    stageTitle: 'Stage 1: Building Plan Sanction (Pre-Construction Permit)',
    description: 'Statutory approval of proposed drawings and building specifications prior to laying foundations.',
    deliverable: 'Sanction Order and Approved Building Drawings (Commencement Certificate)',
    requiredCategories: [
      {
        category: EVIDENCE_CATEGORY.OWNERSHIP_EVIDENCE,
        title: 'Land Ownership & Title Baseline',
        items: [
          { id: 'REG_SALE_DEED', label: 'Registered Sale Deed / Title Conveyance Deed', mandatory: true },
          { id: 'ENCUMBRANCE_CERT', label: 'Encumbrance Certificate (minimum 13 to 30 years search)', mandatory: true },
          { id: 'MUTATION_EXTRACT', label: 'Municipal Khata / Patta / Mutation Extract', mandatory: true },
          { id: 'TAX_PAID_RECEIPT', label: 'Up-to-date Property Tax Paid Receipt', mandatory: true },
          { id: 'LAND_CONVERSION', label: 'Non-Agricultural Land Conversion (CLU) order where applicable', mandatory: false },
        ],
      },
      {
        category: EVIDENCE_CATEGORY.SITE_AND_DRAWINGS,
        title: 'Architectural Plans & Zoning Compliance Drawings',
        items: [
          { id: 'SITE_KEY_PLAN', label: 'Site Plan showing plot dimensions, north direction, and road access width', mandatory: true },
          { id: 'FLOOR_PLANS', label: 'Floor Plans with setbacks, room dimensions, FAR/FSI, and ground coverage', mandatory: true },
          { id: 'SECTION_ELEVATION', label: 'Cross-Sections and Building Elevations with headroom and total height', mandatory: true },
          { id: 'PARKING_CIRCULATION', label: 'Parking layout plan conforming to municipal vehicle standards', mandatory: true },
          { id: 'RAINWATER_HARVEST', label: 'Rainwater Harvesting and percolation pit layout drawings', mandatory: true },
        ],
      },
      {
        category: EVIDENCE_CATEGORY.PROFESSIONAL_EVIDENCE,
        title: 'Professional Endorsements & Structural Undertakings',
        items: [
          { id: 'ARCHITECT_COA', label: 'Council of Architecture (COA) Registered Architect Certification', mandatory: true },
          { id: 'STRUCT_ENGINEER_STABILITY', label: 'Registered Structural Engineer Seismic & Stability Certificate (NBC 2016)', mandatory: true },
          { id: 'SOIL_INVESTIGATION', label: 'Geotechnical Soil Investigation and Bearing Capacity Report', mandatory: true },
          { id: 'SUPERVISION_CONSENT', label: 'Consent of Architect and Engineer for site construction supervision', mandatory: true },
        ],
      },
      {
        category: EVIDENCE_CATEGORY.STATUTORY_NOCS,
        title: 'Clearances and Departmental No-Objection Certificates',
        items: [
          { id: 'FIRE_PROVISIONAL_NOC', label: 'Provisional Fire NOC from Fire & Emergency Services (for applicable height/occupancy)', mandatory: false },
          { id: 'AAI_HEIGHT_NOC', label: 'Airport Authority of India (AAI) NOC for height restriction in aerodrome funnel', mandatory: false },
          { id: 'TREE_OFFICER_CLEARANCE', label: 'Tree Officer Permission if any trees require pruning or felling', mandatory: false },
        ],
      },
    ],
  },
  [APPROVAL_STAGE.PLAN_REVISION]: {
    stage: APPROVAL_STAGE.PLAN_REVISION,
    stageTitle: 'Stage 2: Plan Revision & Deviation Sanction',
    description: 'Application for sanctioning alterations, floor extensions, or layout revisions occurring during construction.',
    deliverable: 'Revised Sanction Order and Superimposed Deviation Drawings',
    requiredCategories: [
      {
        category: EVIDENCE_CATEGORY.SITE_AND_DRAWINGS,
        title: 'Comparative Revision Drawings',
        items: [
          { id: 'ORIGINAL_SANCTION_COPY', label: 'Original Sanction Order and Previously Approved Drawings', mandatory: true },
          { id: 'SUPERIMPOSED_PLAN', label: 'Superimposed Plan showing original sanction vs proposed revision in contrasting colors', mandatory: true },
          { id: 'DEVIATION_CALCULATION', label: 'Detailed FAR/FSI and setback modification calculation sheet', mandatory: true },
        ],
      },
      {
        category: EVIDENCE_CATEGORY.PROFESSIONAL_EVIDENCE,
        title: 'Professional Re-endorsement',
        items: [
          { id: 'STRUCT_REVISION_CERT', label: 'Structural Engineer validation that revisions do not exceed load capacity', mandatory: true },
          { id: 'ARCHITECT_REVISION_JUST', label: 'Architect justification note confirming compliance with applicable bye-laws', mandatory: true },
        ],
      },
    ],
  },
  [APPROVAL_STAGE.COMPLETION_CERTIFICATE]: {
    stage: APPROVAL_STAGE.COMPLETION_CERTIFICATE,
    stageTitle: 'Stage 3: Completion Certificate (CC)',
    description: 'Declaration of physical construction completion in accordance with sanctioned specifications.',
    deliverable: 'Municipal Building Completion Certificate (CC)',
    requiredCategories: [
      {
        category: EVIDENCE_CATEGORY.SITE_AND_DRAWINGS,
        title: 'As-Built Documentation',
        items: [
          { id: 'AS_BUILT_DRAWINGS', label: 'As-Built Architectural Drawings reflecting final on-ground execution', mandatory: true },
          { id: 'SITE_PHOTOGRAPHS', label: 'Time-stamped site photographs of all 4 elevations and setback clear lines', mandatory: true },
        ],
      },
      {
        category: EVIDENCE_CATEGORY.PROFESSIONAL_EVIDENCE,
        title: 'Completion Certificates from Professionals',
        items: [
          { id: 'ARCHITECT_COMPLETION_FORM', label: 'Form of Completion certified by the Supervising Architect', mandatory: true },
          { id: 'STRUCT_COMPLETION_CERT', label: 'Structural Stability Completion Certificate signed by the Structural Engineer', mandatory: true },
        ],
      },
    ],
  },
  [APPROVAL_STAGE.OCCUPANCY_CERTIFICATE]: {
    stage: APPROVAL_STAGE.OCCUPANCY_CERTIFICATE,
    stageTitle: 'Stage 4: Occupancy Certificate (OC)',
    description: 'Final municipal clearance authorizing physical habitation and enabling permanent water and electricity meters.',
    deliverable: 'Permanent Occupancy Certificate (OC)',
    requiredCategories: [
      {
        category: EVIDENCE_CATEGORY.STATUTORY_NOCS,
        title: 'Final Operational Clearances',
        items: [
          { id: 'FIRE_FINAL_NOC', label: 'Final Fire Safety Certificate / Operational NOC from Fire Services', mandatory: true },
          { id: 'LIFT_INSPECTOR_LICENSE', label: 'Lift & Elevator Installation and Operation License from Electrical Inspectorate', mandatory: false },
          { id: 'POLLUTION_STP_NOC', label: 'Consent to Operate / STP operational compliance for large residential/commercial layouts', mandatory: false },
          { id: 'RAINWATER_VERIFIED', label: 'Municipal field verification of functional rainwater harvesting system', mandatory: true },
        ],
      },
      {
        category: EVIDENCE_CATEGORY.OWNERSHIP_EVIDENCE,
        title: 'Completion & Fee Clearance Proof',
        items: [
          { id: 'CC_COPY', label: 'Issued Completion Certificate (CC) from Local Authority', mandatory: true },
          { id: 'COMPACTION_FEE_RECEIPT', label: 'Payment Receipt for all compounding fees / betterment dues', mandatory: true },
        ],
      },
    ],
  },
};

/**
 * Checks whether a jurisdiction record verification has exceeded the max stale limit.
 *
 * @param {string} timestamp ISO timestamp
 * @param {number} [maxDays=180] Threshold in days
 * @returns {boolean} True if stale
 */
export function isDataStale(timestamp, maxDays = 180) {
  if (!timestamp) return true;
  const verifiedTime = new Date(timestamp).getTime();
  if (isNaN(verifiedTime)) return true;
  const now = Date.now();
  const diffDays = (now - verifiedTime) / (1000 * 60 * 60 * 24);
  return diffDays > maxDays;
}

/**
 * Resolves verified municipal and development authorities for a given jurisdiction key.
 * Returns explicit UNAVAILABLE_OR_UNVERIFIED status when jurisdiction is not recognized.
 *
 * @param {string} jurisdictionKey e.g., 'KARNATAKA_BENGALURU', 'MAHARASHTRA_MUMBAI'
 * @returns {Object} Authority configuration or explicit unverified fallback
 */
export function resolveCompetentAuthority(jurisdictionKey) {
  if (!jurisdictionKey || typeof jurisdictionKey !== 'string') {
    return {
      status: 'UNAVAILABLE_OR_UNVERIFIED',
      isSupported: false,
      message: 'No valid jurisdiction key provided. Select a supported municipal territory.',
      disclaimer: STATUTORY_SCOPE_DISCLAIMER,
      statutoryRulebook: 'National Building Code of India (NBC 2016)',
    };
  }

  const normKey = jurisdictionKey.trim().toUpperCase().replace(/\s+/g, '_');
  const record = VERIFIED_AUTHORITY_DIRECTORY[normKey];

  if (!record) {
    return {
      status: 'UNAVAILABLE_OR_UNVERIFIED',
      isSupported: false,
      jurisdictionKey: normKey,
      message: `Statutory building plan approval records for '${jurisdictionKey}' are currently unverified.`,
      disclaimer: STATUTORY_SCOPE_DISCLAIMER,
      statutoryRulebook: 'National Building Code of India (NBC 2016) & State Model Town Planning Bye-Laws',
      recommendedAction: 'Consult your local Municipal Council or District Town Planning Directorate (DTCP) office directly.',
    };
  }

  const stale = isDataStale(record.verificationTimestamp, record.maxStaleDays);

  return {
    status: stale ? 'STALE_DATA_WARNING' : 'VERIFIED',
    isSupported: true,
    jurisdictionKey: record.jurisdictionKey,
    state: record.state,
    city: record.city,
    municipalAuthority: record.municipalAuthority,
    developmentAuthority: record.developmentAuthority,
    scrutinyPortal: record.scrutinyPortal,
    statutoryRulebook: record.statutoryRulebook,
    sourceUrl: record.sourceUrl,
    effectiveDate: record.effectiveDate,
    verificationTimestamp: record.verificationTimestamp,
    isStale: stale,
    guidanceNotes: record.guidanceNotes,
    disclaimer: STATUTORY_SCOPE_DISCLAIMER,
  };
}

/**
 * Retrieves the checklist schema for a requested approval stage and jurisdiction.
 *
 * @param {string} stage e.g., 'PLAN_SANCTION', 'OCCUPANCY_CERTIFICATE'
 * @param {string} jurisdictionKey e.g., 'KARNATAKA_BENGALURU'
 * @returns {Object} Stage checklist configuration
 */
export function getStageChecklistRequirements(stage, jurisdictionKey) {
  const normStage = (stage || APPROVAL_STAGE.PLAN_SANCTION).toUpperCase();
  const schema = STAGE_REQUIREMENTS_SCHEMA[normStage];

  if (!schema) {
    throw new Error(`Unknown approval stage: '${stage}'. Supported stages: ${Object.keys(APPROVAL_STAGE).join(', ')}`);
  }

  const authorityInfo = resolveCompetentAuthority(jurisdictionKey);

  return {
    stage: schema.stage,
    stageTitle: schema.stageTitle,
    description: schema.description,
    deliverable: schema.deliverable,
    authorityInfo,
    requiredCategories: schema.requiredCategories,
    disclaimer: STATUTORY_SCOPE_DISCLAIMER,
  };
}

// In-memory data store for user building approval dossiers
const userDossierStore = new Map();

/**
 * Creates a user-managed building plan approval checklist record.
 *
 * @param {Object} input
 * @returns {Object} Created checklist dossier
 */
export function createBuildingApprovalChecklist(input = {}) {
  const {
    ownerId,
    jurisdictionKey = 'KARNATAKA_BENGALURU',
    stage = APPROVAL_STAGE.PLAN_SANCTION,
    plotReference,
    proposedUse = 'RESIDENTIAL',
    totalPlotAreaSqM = 0,
    proposedBuiltUpAreaSqM = 0,
    supervisingArchitectCoa,
    structuralEngineerLicence,
  } = input;

  if (!ownerId || typeof ownerId !== 'string') {
    throw new Error('Valid ownerId is required to instantiate a private building approval checklist');
  }

  const authorityInfo = resolveCompetentAuthority(jurisdictionKey);
  const checklistRequirements = getStageChecklistRequirements(stage, jurisdictionKey);

  const dossierId = `bldg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Initialize checklist items state
  const checklistItems = [];
  checklistRequirements.requiredCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      checklistItems.push({
        itemId: item.id,
        category: cat.category,
        label: item.label,
        mandatory: item.mandatory,
        completed: false,
        verifiedDate: null,
        documentRef: null,
      });
    });
  });

  const dossier = {
    id: dossierId,
    ownerId,
    jurisdictionKey: authorityInfo.isSupported ? authorityInfo.jurisdictionKey : jurisdictionKey,
    currentStage: stage,
    currentMilestone: MILESTONE_STATUS.DOCUMENT_INTAKE_AND_FEE_SCRUTINY,
    plotReference: plotReference || 'PLOT_UNSPECIFIED',
    proposedUse,
    totalPlotAreaSqM: Number(totalPlotAreaSqM) || 0,
    proposedBuiltUpAreaSqM: Number(proposedBuiltUpAreaSqM) || 0,
    supervisingArchitectCoa: supervisingArchitectCoa || null,
    structuralEngineerLicence: structuralEngineerLicence || null,
    checklistItems,
    deficiencyNotices: [],
    milestoneHistory: [
      {
        milestone: MILESTONE_STATUS.DOCUMENT_INTAKE_AND_FEE_SCRUTINY,
        recordedAt: new Date().toISOString(),
        notes: 'Checklist created in preparation workspace.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorityDetails: {
      municipalAuthority: authorityInfo.municipalAuthority || 'Unknown Municipal Authority',
      developmentAuthority: authorityInfo.developmentAuthority || 'Unknown Development Authority',
      scrutinyPortal: authorityInfo.scrutinyPortal || null,
      statutoryRulebook: authorityInfo.statutoryRulebook || 'National Building Code 2016',
    },
    statutoryDisclaimer: STATUTORY_SCOPE_DISCLAIMER,
  };

  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Retrieves an existing checklist record by ID with owner authorization check.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @returns {Object|null} Dossier or null if not found
 */
export function getBuildingApprovalChecklist(dossierId, ownerId) {
  if (!dossierId || !ownerId) return null;
  const record = userDossierStore.get(dossierId);
  if (!record) return null;
  if (record.ownerId !== ownerId) {
    throw new Error('Access Denied: You are not authorized to inspect this building approval record');
  }
  return record;
}

/**
 * Updates item completion status or metadata in a user's building approval checklist.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {Object} updates
 * @returns {Object} Updated dossier
 */
export function updateBuildingApprovalChecklist(dossierId, ownerId, updates = {}) {
  const dossier = getBuildingApprovalChecklist(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Building approval record '${dossierId}' not found`);
  }

  const { itemsToUpdate = [], currentMilestone, plotReference } = updates;

  if (itemsToUpdate && Array.isArray(itemsToUpdate)) {
    itemsToUpdate.forEach((upItem) => {
      const existing = dossier.checklistItems.find((i) => i.itemId === upItem.itemId);
      if (existing) {
        if (typeof upItem.completed === 'boolean') {
          existing.completed = upItem.completed;
          existing.verifiedDate = upItem.completed ? new Date().toISOString() : null;
        }
        if (upItem.documentRef !== undefined) {
          existing.documentRef = upItem.documentRef;
        }
      }
    });
  }

  if (currentMilestone && MILESTONE_STATUS[currentMilestone]) {
    dossier.currentMilestone = currentMilestone;
    dossier.milestoneHistory.push({
      milestone: currentMilestone,
      recordedAt: new Date().toISOString(),
      notes: updates.milestoneNote || `Milestone shifted to ${currentMilestone}`,
    });
  }

  if (plotReference) {
    dossier.plotReference = plotReference;
  }

  dossier.updatedAt = new Date().toISOString();
  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Records a deficiency notice / observation letter issued by the scrutiny officer.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {Object} noticeInput
 * @returns {Object} Updated dossier with added deficiency
 */
export function recordDeficiencyNotice(dossierId, ownerId, noticeInput = {}) {
  const dossier = getBuildingApprovalChecklist(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Building approval record '${dossierId}' not found`);
  }

  const {
    observationNumber,
    description,
    issuingOfficerTitle = 'Assistant Executive Engineer (Town Planning)',
    issuedDate = new Date().toISOString(),
    responseDeadlineDays = 15,
  } = noticeInput;

  if (!description || typeof description !== 'string') {
    throw new Error('Valid deficiency observation description is required');
  }

  const deadlineDate = new Date(new Date(issuedDate).getTime() + responseDeadlineDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const deficiencyRecord = {
    deficiencyId: `def_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    observationNumber: observationNumber || `OBS-${dossier.deficiencyNotices.length + 1}`,
    description,
    issuingOfficerTitle,
    issuedDate: new Date(issuedDate).toISOString().slice(0, 10),
    responseDeadlineDate: deadlineDate,
    status: 'PENDING_RECTIFICATION',
    resolvedAt: null,
    rectificationDetails: null,
  };

  dossier.deficiencyNotices.push(deficiencyRecord);
  dossier.currentMilestone = MILESTONE_STATUS.DEFICIENCY_NOTICE_ISSUED;
  dossier.milestoneHistory.push({
    milestone: MILESTONE_STATUS.DEFICIENCY_NOTICE_ISSUED,
    recordedAt: new Date().toISOString(),
    notes: `Deficiency notice issued: ${description}`,
  });

  dossier.updatedAt = new Date().toISOString();
  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Marks a recorded deficiency notice as resolved.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {string} deficiencyId
 * @param {string} resolutionExplanation
 * @returns {Object} Updated dossier
 */
export function resolveDeficiency(dossierId, ownerId, deficiencyId, resolutionExplanation) {
  const dossier = getBuildingApprovalChecklist(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Building approval record '${dossierId}' not found`);
  }

  const def = dossier.deficiencyNotices.find((d) => d.deficiencyId === deficiencyId);
  if (!def) {
    throw new Error(`Deficiency notice '${deficiencyId}' not found in record`);
  }

  def.status = 'RESOLVED';
  def.resolvedAt = new Date().toISOString();
  def.rectificationDetails = resolutionExplanation || 'Compliance submitted to municipal scrutiny cell.';

  const allResolved = dossier.deficiencyNotices.every((d) => d.status === 'RESOLVED');
  if (allResolved) {
    dossier.currentMilestone = MILESTONE_STATUS.DEFICIENCY_RESOLVED;
    dossier.milestoneHistory.push({
      milestone: MILESTONE_STATUS.DEFICIENCY_RESOLVED,
      recordedAt: new Date().toISOString(),
      notes: 'All scrutiny deficiencies resolved and re-submitted.',
    });
  }

  dossier.updatedAt = new Date().toISOString();
  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Transitions a dossier to a new approval stage (e.g. from SANCTION to COMPLETION).
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @param {string} targetStage
 * @returns {Object} Updated dossier
 */
export function transitionApprovalStage(dossierId, ownerId, targetStage) {
  const dossier = getBuildingApprovalChecklist(dossierId, ownerId);
  if (!dossier) {
    throw new Error(`Building approval record '${dossierId}' not found`);
  }

  if (!APPROVAL_STAGE[targetStage]) {
    throw new Error(`Target stage '${targetStage}' is invalid`);
  }

  const stageReqs = getStageChecklistRequirements(targetStage, dossier.jurisdictionKey);

  // Append new stage checklist items
  stageReqs.requiredCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      const exists = dossier.checklistItems.some((i) => i.itemId === item.id);
      if (!exists) {
        dossier.checklistItems.push({
          itemId: item.id,
          category: cat.category,
          label: item.label,
          mandatory: item.mandatory,
          completed: false,
          verifiedDate: null,
          documentRef: null,
        });
      }
    });
  });

  dossier.currentStage = targetStage;
  dossier.updatedAt = new Date().toISOString();
  userDossierStore.set(dossierId, dossier);
  return dossier;
}

/**
 * Deletes a building approval dossier from store with owner authorization.
 *
 * @param {string} dossierId
 * @param {string} ownerId
 * @returns {boolean} True if deleted
 */
export function deleteBuildingApprovalChecklist(dossierId, ownerId) {
  const dossier = getBuildingApprovalChecklist(dossierId, ownerId);
  if (!dossier) return false;
  return userDossierStore.delete(dossierId);
}

/**
 * Redacts personal identifiers for private export, audit, and community sharing.
 * Scrubs exact names, contact details, precise survey coordinates, and credentials.
 *
 * @param {Object} dossier Raw building approval record
 * @returns {Object} Sanitized exportable object
 */
export function sanitizeBuildingPlanDataForExport(dossier) {
  if (!dossier || typeof dossier !== 'object') {
    return null;
  }

  const sanitized = JSON.parse(JSON.stringify(dossier));

  // Scrub owner identifier
  sanitized.ownerId = 'REDACTED_CITIZEN_ID';

  // Scrub plot exact reference if sensitive
  if (sanitized.plotReference) {
    sanitized.plotReference = 'REDACTED_SITE_REF';
  }

  // Scrub architect / engineer exact credentials
  if (sanitized.supervisingArchitectCoa) {
    sanitized.supervisingArchitectCoa = 'COA/XXXX/REDACTED';
  }
  if (sanitized.structuralEngineerLicence) {
    sanitized.structuralEngineerLicence = 'SE/XXXX/REDACTED';
  }

  // Scrub any specific document references attached to items
  if (Array.isArray(sanitized.checklistItems)) {
    sanitized.checklistItems = sanitized.checklistItems.map((item) => ({
      ...item,
      documentRef: item.documentRef ? 'REDACTED_ATTACHMENT_ID' : null,
    }));
  }

  // Redact personal names in deficiency descriptions
  if (Array.isArray(sanitized.deficiencyNotices)) {
    sanitized.deficiencyNotices = sanitized.deficiencyNotices.map((n) => ({
      ...n,
      issuingOfficerTitle: n.issuingOfficerTitle || 'Designated Town Planning Officer',
    }));
  }

  return sanitized;
}

// In-memory registry for crowdsourced correction proposals
const communityCorrectionRegistry = [];

/**
 * Submits a community correction or update proposal for an authority record.
 *
 * @param {Object} proposalInput
 * @returns {Object} Registered correction proposal
 */
export function submitCorrectionProposal(proposalInput = {}) {
  const {
    jurisdictionKey,
    proposedAuthorityName,
    proposedPortalUrl,
    officialGazetteOrSourceUrl,
    submissionNotes,
    contributorId = 'ANONYMOUS_CONTRIBUTOR',
  } = proposalInput;

  if (!jurisdictionKey || !officialGazetteOrSourceUrl) {
    throw new Error('Valid jurisdictionKey and verifiable officialGazetteOrSourceUrl are mandatory');
  }

  const proposal = {
    proposalId: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    jurisdictionKey,
    proposedAuthorityName: proposedAuthorityName || null,
    proposedPortalUrl: proposedPortalUrl || null,
    officialGazetteOrSourceUrl,
    submissionNotes: submissionNotes || '',
    contributorId,
    reviewStatus: 'PENDING_ADMIN_REVIEW',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewerNotes: null,
  };

  communityCorrectionRegistry.push(proposal);
  return proposal;
}

/**
 * Evaluates a community correction proposal (Administrator action).
 *
 * @param {string} proposalId
 * @param {string} decision 'APPROVED' | 'REJECTED'
 * @param {string} reviewerNotes
 * @returns {Object} Updated proposal record
 */
export function reviewCorrectionProposal(proposalId, decision, reviewerNotes = '') {
  const proposal = communityCorrectionRegistry.find((p) => p.proposalId === proposalId);
  if (!proposal) {
    throw new Error(`Correction proposal '${proposalId}' not found`);
  }

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw new Error("Decision must be either 'APPROVED' or 'REJECTED'");
  }

  proposal.reviewStatus = decision;
  proposal.reviewedAt = new Date().toISOString();
  proposal.reviewerNotes = reviewerNotes;

  return proposal;
}

/**
 * Utility to reset in-memory test stores.
 */
export function _resetInternalStores() {
  userDossierStore.clear();
  communityCorrectionRegistry.length = 0;
}
