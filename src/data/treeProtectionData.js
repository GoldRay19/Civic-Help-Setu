/**
 * Tree Pruning, Transplantation, and Urban Tree Protection Data
 *
 * Implements structured statutory and municipal reference records across
 * major Indian Urban Local Bodies (ULBs) and State Forest Departments.
 *
 * Grounded in:
 * - Delhi Preservation of Trees Act, 1994 (DPTA 1994)
 * - Karnataka Preservation of Trees Act, 1976 (KPTA 1976)
 * - Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975
 * - Tamil Nadu Preservation of Private Forests Act & GCC Tree Committee Bye-laws
 * - Telangana Water, Land and Trees Act, 2002 (WALTA 2002)
 */

export const TREE_OPERATION_TYPE = {
  PRUNING: 'PRUNING',
  TRANSPLANTATION: 'TRANSPLANTATION',
  REMOVAL: 'REMOVAL',
  EMERGENCY_HAZARD: 'EMERGENCY_HAZARD',
  ILLEGAL_FELLING_REPORT: 'ILLEGAL_FELLING_REPORT',
};

export const OPERATION_METADATA = {
  [TREE_OPERATION_TYPE.PRUNING]: {
    id: TREE_OPERATION_TYPE.PRUNING,
    title: 'Tree Pruning & Branch Trimming',
    badge: 'Permission Dependent on Girth',
    summary:
      'Light trimming of minor lateral shoots (< 10-15 cm girth depending on state) for clearance usually requires municipal intimation, while lopping, pollarding, or severe branch removal mandates prior statutory Tree Officer permit.',
    requiresFormalPermit: true,
    riskLevel: 'Moderate',
  },
  [TREE_OPERATION_TYPE.TRANSPLANTATION]: {
    id: TREE_OPERATION_TYPE.TRANSPLANTATION,
    title: 'Tree Transplantation / Relocation',
    badge: 'Mandatory Technical Clearance',
    summary:
      'Requires root-ball preparation, soil suitability assessment, hydraulic crane deployment, designated reception site, and mandatory 1-3 year post-transplantation survival monitoring.',
    requiresFormalPermit: true,
    riskLevel: 'High',
  },
  [TREE_OPERATION_TYPE.REMOVAL]: {
    id: TREE_OPERATION_TYPE.REMOVAL,
    title: 'Tree Felling & Removal',
    badge: 'Strict Statutory Permission',
    summary:
      'Prohibited without prior Tree Officer sanction. Requires public notice / objection window, mandatory physical site inspection, security deposit, and compulsory compensatory tree plantation.',
    requiresFormalPermit: true,
    riskLevel: 'Critical',
  },
  [TREE_OPERATION_TYPE.EMERGENCY_HAZARD]: {
    id: TREE_OPERATION_TYPE.EMERGENCY_HAZARD,
    title: 'Emergency Dangerous / Leaning Tree',
    badge: '24/7 Fast-Track Disaster Route',
    summary:
      'Immediate public safety hazard (storm damage, root heave, split trunk threatening life or electrical lines). Bypasses standard 30-day public objection notice for rapid disaster mitigation.',
    requiresFormalPermit: false,
    riskLevel: 'Immediate Hazard',
  },
  [TREE_OPERATION_TYPE.ILLEGAL_FELLING_REPORT]: {
    id: TREE_OPERATION_TYPE.ILLEGAL_FELLING_REPORT,
    title: 'Suspected Illegal Felling Report',
    badge: 'Confidential Whistleblower Route',
    summary:
      'Confidential reporting channel for unauthorized cutting, trunk girdling, burning, or poisoning of trees. Mobilizes Forest Vigilance, Municipal Quick Response Teams, and police FIR registration.',
    requiresFormalPermit: false,
    riskLevel: 'Enforcement Action',
  },
};

export const STATUTORY_SCOPE_NOTICE =
  'Statutory Notice: Trees within municipal and urban planning jurisdictions in India are protected by state-specific tree preservation legislation. Pruning branches beyond prescribed girth thresholds or felling any standing tree without prior written permission from the designated Tree Officer is a cognizable offense punishable by fines and imprisonment.';

/**
 * Verified municipal and tree authorities across major jurisdictions.
 * All entries are linked to dated official portals with verification timestamps.
 */
export const VERIFIED_TREE_AUTHORITIES = {
  DELHI_NCT: {
    jurisdictionKey: 'DELHI_NCT',
    state: 'Delhi (NCT)',
    city: 'Delhi',
    authorityName: 'Department of Forests and Wildlife, GNCTD / Tree Officer',
    competentOfficerTitle: 'Deputy Conservator of Forests (DCF) & Designated Tree Officer',
    statutoryAct: 'Delhi Preservation of Trees Act, 1994 (DPTA 1994 - Sections 8, 9, 24)',
    portalName: 'Delhi e-Forest Online Citizen Services Portal',
    portalUrl: 'https://forest.delhigovt.nic.in',
    sourceUrl: 'https://forest.delhigovt.nic.in/tree-felling-permission',
    effectiveDate: '2026-09-01',
    verificationTimestamp: '2026-10-15T10:00:00Z',
    maxStaleDays: 180,
    publicObjectionWindowDays: 15,
    inspectionMandatory: true,
    inspectionTimelineDays: 'Within 30 days of application receipt',
    compensatoryPlantationRatio: '1:10 (10 indigenous saplings per felled tree) or statutory security deposit',
    pruningThresholdRule:
      'Pruning of branches up to 15.7 cm in girth is exempted only for basic maintenance; lopping, heading, or topping larger limbs strictly requires Section 9 Tree Officer permission.',
    statutoryPenalties: {
      imprisonmentMax: 'Up to 1 year imprisonment',
      fineMax: 'Up to ₹10,000 fine per felled tree, plus tree timber forfeiture and compounding fees',
      legalSection: 'Section 24 of the Delhi Preservation of Trees Act, 1994',
    },
    emergencyHelpline: '1800-11-8600 (Forest Dept Control Room) / 112 (Disaster Management)',
    guidanceNotes:
      'Delhi High Court mandates independent spot inspection and public objection disclosures for all development felling.',
  },
  KARNATAKA_BENGALURU: {
    jurisdictionKey: 'KARNATAKA_BENGALURU',
    state: 'Karnataka',
    city: 'Bengaluru',
    authorityName: 'BBMP Forest Cell / Karnataka Forest Department',
    competentOfficerTitle: 'Deputy Conservator of Forests (DCF), BBMP / Tree Officer',
    statutoryAct: 'Karnataka Preservation of Trees Act, 1976 (KPTA 1976 - Sections 8, 14, 22)',
    portalName: 'BBMP Forest Cell Online Single Window',
    portalUrl: 'https://bbmp.gov.in',
    sourceUrl: 'https://bbmp.gov.in/forest.html',
    effectiveDate: '2026-08-01',
    verificationTimestamp: '2026-10-18T09:30:00Z',
    maxStaleDays: 180,
    publicObjectionWindowDays: 10,
    inspectionMandatory: true,
    inspectionTimelineDays: '15 to 20 working days under Karnataka Sakala Services Act',
    compensatoryPlantationRatio: '1:10 compensatory saplings of prescribed native species',
    pruningThresholdRule:
      'Trimming of minor twigs obstructing cables allowed under ward forest supervisor; branch cutting exceeding 10 cm girth requires written Tree Officer permission.',
    statutoryPenalties: {
      imprisonmentMax: 'Up to 6 months imprisonment',
      fineMax: '₹1,000 to ₹10,000 per violation plus seizure of tools and timber',
      legalSection: 'Section 22 of the Karnataka Preservation of Trees Act, 1976',
    },
    emergencyHelpline: '080-22660000 (BBMP 24x7 Control Room) / 1926 (Karnataka Forest Helpline)',
    guidanceNotes:
      'Public hearing and publication in two leading newspapers required when more than 50 trees are proposed for felling.',
  },
  MAHARASHTRA_MUMBAI: {
    jurisdictionKey: 'MAHARASHTRA_MUMBAI',
    state: 'Maharashtra',
    city: 'Mumbai',
    authorityName: 'Brihanmumbai Municipal Corporation (BMC) Tree Authority',
    competentOfficerTitle: 'Superintendent of Gardens & Member Secretary, Tree Authority',
    statutoryAct: 'Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975 (Amended 2021)',
    portalName: 'BMC Citizen Portal / Tree Authority Services',
    portalUrl: 'https://www.mcgm.gov.in',
    sourceUrl: 'https://www.mcgm.gov.in/irj/portal/anonymous/qlgarden',
    effectiveDate: '2026-09-15',
    verificationTimestamp: '2026-10-20T11:00:00Z',
    maxStaleDays: 180,
    publicObjectionWindowDays: 7,
    inspectionMandatory: true,
    inspectionTimelineDays: '15 to 30 days including Tree Committee site visit',
    compensatoryPlantationRatio: 'Heritage trees (>50 yrs): plant number equal to tree age; General trees: 1:7 ratio',
    pruningThresholdRule:
      'Pre-monsoon trimming on private premises must be carried out only after BMC Horticulturist inspection and written clearance.',
    statutoryPenalties: {
      imprisonmentMax: 'Up to 1 year imprisonment',
      fineMax: 'Up to ₹1,00,000 per tree (under 2021 amendment for heritage trees)',
      legalSection: 'Section 21 of Maharashtra Act No. XLIV of 1975',
    },
    emergencyHelpline: '1916 (BMC Disaster Management Helpline) / 112',
    guidanceNotes:
      'Trees older than 50 years receive statutory Heritage Tree protection requiring geo-tagging and state-level clearance.',
  },
  MAHARASHTRA_PUNE: {
    jurisdictionKey: 'MAHARASHTRA_PUNE',
    state: 'Maharashtra',
    city: 'Pune',
    authorityName: 'Pune Municipal Corporation (PMC) Tree Authority',
    competentOfficerTitle: 'Tree Officer & Assistant Commissioner (Gardens), PMC',
    statutoryAct: 'Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975',
    portalName: 'PMC Citizen Online Tree Permission Portal',
    portalUrl: 'https://pmc.gov.in',
    sourceUrl: 'https://pmc.gov.in/en/tree-cutting-permission',
    effectiveDate: '2026-08-15',
    verificationTimestamp: '2026-10-10T14:00:00Z',
    maxStaleDays: 180,
    publicObjectionWindowDays: 7,
    inspectionMandatory: true,
    inspectionTimelineDays: '21 working days',
    compensatoryPlantationRatio: '1:5 compensatory native trees with geotagged photo proof',
    pruningThresholdRule:
      'All pruning must preserve natural tree balance; root trimming near foundations requires prior horticultural assessment.',
    statutoryPenalties: {
      imprisonmentMax: 'Up to 1 year imprisonment',
      fineMax: 'Up to ₹50,000 per tree plus tree restoration costs',
      legalSection: 'Section 21 of Maharashtra Act No. XLIV of 1975',
    },
    emergencyHelpline: '1800-1030-222 (PMC Toll-Free Helpline) / 020-25501269 (PMC Disaster Cell)',
    guidanceNotes:
      'Tree census data and tree age verification mandatory before processing non-emergency applications.',
  },
  TAMIL_NADU_CHENNAI: {
    jurisdictionKey: 'TAMIL_NADU_CHENNAI',
    state: 'Tamil Nadu',
    city: 'Chennai',
    authorityName: 'Greater Chennai Corporation (GCC) & District Green Committee',
    competentOfficerTitle: 'District Forest Officer (DFO) / Zonal Officer & Tree Officer, GCC',
    statutoryAct: 'Tamil Nadu District Green Committee Guidelines & Chennai City Municipal Corporation Act, 1919',
    portalName: 'Greater Chennai Corporation Parks & Tree Portal',
    portalUrl: 'https://chennaicorporation.gov.in',
    sourceUrl: 'https://chennaicorporation.gov.in/gcc/online-services',
    effectiveDate: '2026-09-01',
    verificationTimestamp: '2026-10-05T08:45:00Z',
    maxStaleDays: 180,
    publicObjectionWindowDays: 15,
    inspectionMandatory: true,
    inspectionTimelineDays: '15 to 30 working days',
    compensatoryPlantationRatio: '1:10 saplings with minimum 2-year maintenance undertaking',
    pruningThresholdRule:
      'Light overhead electric line branch clearance handled directly by TANGEDCO/GCC; private tree pruning requires zonal clearance.',
    statutoryPenalties: {
      imprisonmentMax: 'Cognizable offense under Tamil Nadu Forest & Municipal Laws',
      fineMax: '₹5,000 to ₹25,000 per violation plus mandatory replantation bond',
      legalSection: 'Madras High Court Directives & Municipal Green Protocol',
    },
    emergencyHelpline: '1913 (GCC 24/7 Helpline) / 044-25619206 (Flood & Storm Tree Control)',
    guidanceNotes:
      'District Green Committee headed by the District Collector must approve any felling exceeding 5 mature trees.',
  },
  TELANGANA_HYDERABAD: {
    jurisdictionKey: 'TELANGANA_HYDERABAD',
    state: 'Telangana',
    city: 'Hyderabad',
    authorityName: 'GHMC Urban Biodiversity Wing / Telangana Forest Department',
    competentOfficerTitle: 'Director of Urban Biodiversity, GHMC & Designated Tree Officer',
    statutoryAct: 'Telangana Water, Land and Trees Act, 2002 (WALTA 2002 - Sections 28, 29, 35)',
    portalName: 'TS-bPASS / GHMC Online Tree Clearance',
    portalUrl: 'https://tsbpass.telangana.gov.in',
    sourceUrl: 'https://forests.telangana.gov.in',
    effectiveDate: '2026-10-01',
    verificationTimestamp: '2026-10-25T10:30:00Z',
    maxStaleDays: 180,
    publicObjectionWindowDays: 15,
    inspectionMandatory: true,
    inspectionTimelineDays: '14 working days under TS-bPASS single-window system',
    compensatoryPlantationRatio: '1:3 to 1:5 compensatory saplings or deposit in WALTA Green Fund',
    pruningThresholdRule:
      'Pruning for road safety or utility lines requires permission from GHMC Biodiversity Wing; unauthorized pollarding attracts WALTA penalties.',
    statutoryPenalties: {
      imprisonmentMax: 'Up to 6 months imprisonment for repeat offenses',
      fineMax: '₹1,000 to ₹5,000 per tree or double the estimated commercial timber value',
      legalSection: 'Section 35 of the Telangana WALTA Act, 2002',
    },
    emergencyHelpline: '040-21111111 (GHMC Call Centre) / 1926 (Telangana Forest Toll-Free)',
    guidanceNotes:
      'Transplantation mandatory for trees with trunk diameter > 30 cm if physically feasible before felling approval is considered.',
  },
};

/**
 * Common protected / restricted tree species across Indian states.
 * Felling or lopping of these species incurs elevated scrutiny or outright prohibition.
 */
export const PROTECTED_TREE_SPECIES = [
  {
    commonName: 'Sandalwood',
    botanicalName: 'Santalum album',
    protectionCategory: 'Special Royal / Reserved Tree',
    applicableStates: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Maharashtra'],
    rules:
      'State government ownership rights prevail regardless of land tenure. Extraction and felling is the exclusive preserve of the State Forest Department.',
  },
  {
    commonName: 'Teak',
    botanicalName: 'Tectona grandis',
    protectionCategory: 'Reserved Timber Species',
    applicableStates: ['All States'],
    rules:
      'Transit pass and prior divisional forest officer (DFO) permit strictly mandatory even on privately owned patta land.',
  },
  {
    commonName: 'Banyan Tree',
    botanicalName: 'Ficus benghalensis',
    protectionCategory: 'Heritage / Ecological Keystone Species',
    applicableStates: ['Maharashtra', 'Delhi NCT', 'Karnataka', 'Tamil Nadu'],
    rules:
      'Protected under Heritage Tree rules in Maharashtra (>50 years) and prioritized for mandatory preservation or engineering rerouting.',
  },
  {
    commonName: 'Peepal Tree',
    botanicalName: 'Ficus religiosa',
    protectionCategory: 'Heritage / Ecological Keystone Species',
    applicableStates: ['All States'],
    rules:
      'High oxygen generator and sacred keystone species; pruning permitted only when severe structural foundation damage is certified by an engineer.',
  },
  {
    commonName: 'Red Sanders',
    botanicalName: 'Pterocarpus santalinus',
    protectionCategory: 'Endangered / CITES Appendix II Species',
    applicableStates: ['Andhra Pradesh', 'Tamil Nadu', 'Telangana'],
    rules:
      'Strict criminal liability under Wildlife Protection Act & State Forest Acts for any unauthorized cutting, possession, or transit.',
  },
  {
    commonName: 'Rosewood / Sheesham',
    botanicalName: 'Dalbergia latifolia / sissoo',
    protectionCategory: 'Reserved Timber Species',
    applicableStates: ['Karnataka', 'Kerala', 'Punjab', 'Haryana'],
    rules:
      'Requires Tree Officer valuation, timber transit marking, and official forest department auction protocol.',
  },
];

/**
 * Standard categorized evidence checklist for tree permission applications.
 */
export const EVIDENCE_CHECKLIST_SCHEMA = [
  {
    categoryId: 'LAND_AND_APPLICANT_PROOF',
    categoryTitle: '1. Land Tenure & Applicant Proof',
    items: [
      {
        id: 'OWNERSHIP_DOC',
        label: 'Registered Sale Deed / Property Title / Khata Extract showing lawful possession',
        mandatory: true,
        helpText: 'Proves the applicant has legal custody of the land where the tree is situated.',
      },
      {
        id: 'RWA_OR_SOCIETY_NOC',
        label: 'No-Objection Certificate (NOC) from Housing Society / RWA managing committee',
        mandatory: false,
        condition: 'Mandatory if tree is located in common residential society grounds or shared boundary.',
      },
      {
        id: 'ADJACENT_NEIGHBOUR_CONSENT',
        label: 'Consent letter from adjacent property owner',
        mandatory: false,
        condition: 'Mandatory if branches or roots overhang adjoining private properties.',
      },
    ],
  },
  {
    categoryId: 'PHOTOGRAPHIC_AND_SITE_EVIDENCE',
    categoryTitle: '2. Photographic & Geo-Spatial Evidence',
    items: [
      {
        id: 'PHOTO_WIDE_ANGLE',
        label: 'Wide-angle contextual photo showing tree relative to adjacent buildings, roads, and cables',
        mandatory: true,
        helpText: 'Helps the inspecting officer understand physical clearance constraints.',
      },
      {
        id: 'PHOTO_CLOSEUP_DEFECT',
        label: 'Close-up photos of trunk base, root zone, and visible rot/cavities/crack defects',
        mandatory: true,
        helpText: 'Shows biological health, trunk hollows, fungal growth, or termite infestation.',
      },
      {
        id: 'SITE_SKETCH_PLAN',
        label: 'Simple dimensioned site sketch indicating plot boundaries and exact tree position',
        mandatory: true,
        helpText: 'Must show distance from building foundation and overhead high-tension lines.',
      },
    ],
  },
  {
    categoryId: 'TECHNICAL_AND_COMPENSATION_PROOF',
    categoryTitle: '3. Technical Certification & Compensatory Undertaking',
    items: [
      {
        id: 'ARBORIST_OR_STRUCTURAL_REPORT',
        label: 'Certified Arborist health evaluation or Structural Engineer danger report',
        mandatory: false,
        condition: 'Mandatory when claiming foundation danger, dead/decayed status, or severe tilt.',
      },
      {
        id: 'COMPENSATORY_UNDERTAKING',
        label: 'Signed legal undertaking to plant and maintain compensatory saplings (minimum 1:10 ratio)',
        mandatory: true,
        helpText: 'Statutory commitment to nurture replacement indigenous trees for a minimum of 2-3 years.',
      },
      {
        id: 'TRANSPLANT_RECEIVING_SITE_PLAN',
        label: 'Receiving site soil report and mechanical crane transit plan',
        mandatory: false,
        condition: 'Mandatory for Tree Transplantation applications.',
      },
    ],
  },
];
