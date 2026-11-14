/**
 * Fire NOC and Fire-Safety Compliance Reference Dataset
 * Grounded in National Building Code of India (NBC 2016 Part 4: Fire and Life Safety)
 * and State Fire Force Acts / Municipal Fire Prevention Regulations.
 */

export const STATUTORY_SCOPE_DISCLAIMER =
  'Statutory Scope Notice: This guide provides procedural preparation assistance grounded in official State Fire Force Acts and the National Building Code of India (NBC 2016 Part 4). It DOES NOT constitute authoritative fire-engineering advice, hydraulic pressure calculations, or a guarantee of municipal clearance. Building owners and commercial occupants must engage registered fire-protection engineers and certified agencies for physical system audits.';

export const FIRE_JURISDICTIONS = [
  {
    id: 'delhi',
    jurisdictionKey: 'DELHI_NCT',
    state: 'Delhi (NCT)',
    city: 'Delhi / New Delhi',
    authorityName: 'Delhi Fire Service (DFS)',
    competentOfficer: 'Director / Chief Fire Officer (CFO)',
    statutoryAct: 'Delhi Fire Service Act, 2007 & Delhi Fire Service Rules, 2010',
    portalName: 'Delhi Fire Service Online Portal',
    portalUrl: 'https://dfs.delhigovt.nic.in',
    scrutinyPortal: 'https://mcdonline.nic.in/obps',
    effectiveDate: '2025-04-01',
    verificationTimestamp: '2026-03-01T10:00:00Z',
    maxStaleDays: 180,
    verified: true,
    inspectionMandatory: true,
    turnaroundDays: 30,
    validityYears: {
      residential: 5,
      commercial: 3,
      hazardous: 1
    },
    guidanceNotes: 'Applications for building plan fire sanction route through MCD/NDMC OBPS single-window portal with automatic DFS routing.'
  },
  {
    id: 'maharashtra_mumbai',
    jurisdictionKey: 'MAHARASHTRA_MUMBAI',
    state: 'Maharashtra',
    city: 'Mumbai',
    authorityName: 'Mumbai Fire Brigade / Brihanmumbai Municipal Corporation (BMC)',
    competentOfficer: 'Chief Fire Officer (CFO), Mumbai Fire Brigade',
    statutoryAct: 'Maharashtra Fire Prevention and Life Safety Measures Act, 2006 & Rules 2009',
    portalName: 'Maharashtra Fire Services Directorate / BMC AutoDCR',
    portalUrl: 'https://mahafireservice.gov.in',
    scrutinyPortal: 'https://autodcr.mcgm.gov.in',
    effectiveDate: '2024-11-01',
    verificationTimestamp: '2026-02-15T09:00:00Z',
    maxStaleDays: 180,
    verified: true,
    inspectionMandatory: true,
    turnaroundDays: 30,
    validityYears: {
      residential: 3,
      commercial: 1,
      hazardous: 1
    },
    guidanceNotes: 'Bi-annual submission of Form B (Certificate by Licensed Agency) mandatory in January and July under Section 3(1).'
  },
  {
    id: 'karnataka_bengaluru',
    jurisdictionKey: 'KARNATAKA_BENGALURU',
    state: 'Karnataka',
    city: 'Bengaluru',
    authorityName: 'Karnataka State Fire and Emergency Services (KSFES)',
    competentOfficer: 'Director General of Police & Director General Fire Services / CFO',
    statutoryAct: 'Karnataka Fire Force Act, 1964 & Karnataka Fire Force Rules, 1971',
    portalName: 'KSFES Citizen Portal',
    portalUrl: 'https://ksfes.karnataka.gov.in',
    scrutinyPortal: 'https://bpas.bbmp.gov.in',
    effectiveDate: '2025-01-15',
    verificationTimestamp: '2026-02-20T11:30:00Z',
    maxStaleDays: 180,
    verified: true,
    inspectionMandatory: true,
    turnaroundDays: 21,
    validityYears: {
      residential: 2,
      commercial: 1,
      hazardous: 1
    },
    guidanceNotes: 'Governed under Karnataka Sakala Services Act ensuring time-bound inspection and clearance within 21 working days.'
  },
  {
    id: 'tamil_nadu_chennai',
    jurisdictionKey: 'TAMIL_NADU_CHENNAI',
    state: 'Tamil Nadu',
    city: 'Chennai',
    authorityName: 'Tamil Nadu Fire and Rescue Services Department (TNFRS)',
    competentOfficer: 'Director / Deputy Director (Fire Prevention Wing)',
    statutoryAct: 'Tamil Nadu Fire Service Act, 1985 & TN Combined Development and Building Rules (TNCDBR 2019)',
    portalName: 'TNFRS Online Portal',
    portalUrl: 'https://tnfrs.tn.gov.in',
    scrutinyPortal: 'https://onlineppa.cmdaonline.tn.gov.in',
    effectiveDate: '2024-12-01',
    verificationTimestamp: '2026-01-10T08:00:00Z',
    maxStaleDays: 180,
    verified: true,
    inspectionMandatory: true,
    turnaroundDays: 30,
    validityYears: {
      residential: 3,
      commercial: 1,
      hazardous: 1
    },
    guidanceNotes: 'High-rise clearances (>18.30m) require Multi-Storeyed Building (MSB) Panel approval involving CMDA and TNFRS.'
  },
  {
    id: 'telangana_hyderabad',
    jurisdictionKey: 'TELANGANA_HYDERABAD',
    state: 'Telangana',
    city: 'Hyderabad',
    authorityName: 'Telangana State Disaster Response and Fire Services Department (TSDRFSD)',
    competentOfficer: 'Director General of State Disaster Response and Fire Services',
    statutoryAct: 'Telangana Fire Service Act, 1999 & TS-bPASS Act, 2020',
    portalName: 'TS Fire Service Online Portal',
    portalUrl: 'https://fire.telangana.gov.in',
    scrutinyPortal: 'https://tsbpass.telangana.gov.in',
    effectiveDate: '2025-02-01',
    verificationTimestamp: '2026-02-25T14:00:00Z',
    maxStaleDays: 180,
    verified: true,
    inspectionMandatory: true,
    turnaroundDays: 14,
    validityYears: {
      residential: 5,
      commercial: 1,
      hazardous: 1
    },
    guidanceNotes: 'Integrated with TS-bPASS single window; provisional NOC issued online based on automated risk profiling.'
  },
  {
    id: 'unspecified',
    jurisdictionKey: 'UNAVAILABLE_OR_UNVERIFIED',
    state: 'Other / Unlisted State',
    city: 'Unspecified District / Municipal Council',
    authorityName: 'State Directorate of Fire Services / Local Fire Station',
    competentOfficer: 'Jurisdictional Chief Fire Officer / Fire Station Officer',
    statutoryAct: 'Respective State Fire Force Act & NBC 2016 Part 4',
    portalName: 'Not specified by the linked official source.',
    portalUrl: null,
    scrutinyPortal: null,
    effectiveDate: 'Not specified by the linked official source.',
    verificationTimestamp: null,
    maxStaleDays: 180,
    verified: false,
    inspectionMandatory: true,
    turnaroundDays: null,
    validityYears: {
      residential: null,
      commercial: null,
      hazardous: null
    },
    guidanceNotes: 'Official online portal or rules not yet catalogued. Please consult your district headquarters Fire Station.'
  }
];

export const BUILDING_OCCUPANCY_GROUPS = [
  {
    code: 'GROUP_A',
    name: 'Group A: Residential',
    description: 'Private dwellings, apartment houses, flats, dormitories, hotels, and staff quarters.',
    heightThresholdMeters: 15,
    coveredAreaThresholdSqM: null,
    nocMandatoryTrigger: 'Mandatory if building height is 15 meters or higher (high-rise), or hotels/lodging houses regardless of height.',
    exemptCondition: 'Individual low-rise private residential houses under 15 meters are exempt from Fire NOC in most municipal jurisdictions.',
    inspectionFocus: 'Fire escapes, staircase widths, corridor ventilation, dry/wet riser points, external open space for fire tender movement.'
  },
  {
    code: 'GROUP_B',
    name: 'Group B: Educational',
    description: 'Schools, colleges, day-care centres, training institutes, and polytechnics.',
    heightThresholdMeters: 9,
    coveredAreaThresholdSqM: 500,
    nocMandatoryTrigger: 'Mandatory for all school/college buildings exceeding 9 meters in height or built-up area exceeding 500 sq. meters, or housing chemical laboratories.',
    exemptCondition: 'Single-storey day schools with fewer than 100 students and immediate ground-level exits (confirm with local CFO).',
    inspectionFocus: 'Two wide exits per classroom block, clear unobstructed corridors, functional fire extinguishers, sand buckets, evacuation drill plan.'
  },
  {
    code: 'GROUP_C',
    name: 'Group C: Institutional',
    description: 'Hospitals, nursing homes, sanatoria, custodial institutions, and old-age care homes.',
    heightThresholdMeters: 0,
    coveredAreaThresholdSqM: 0,
    nocMandatoryTrigger: 'Mandatory for ALL institutional buildings, hospitals, and nursing homes regardless of height or plot area.',
    exemptCondition: 'None. Universal statutory clearance required under Clinical Establishments Acts and Fire Rules.',
    inspectionFocus: 'Emergency ramp with maximum 1:10 slope, stretcher-compatible fire lifts, dedicated fire pump room, smoke check doors, backup power for life support corridors.'
  },
  {
    code: 'GROUP_D',
    name: 'Group D: Assembly',
    description: 'Theatres, cinemas, multiplexes, auditoriums, marriage halls, banquet halls, exhibition centres, and sports complexes.',
    heightThresholdMeters: 0,
    coveredAreaThresholdSqM: 200,
    nocMandatoryTrigger: 'Mandatory for all public assembly buildings having occupant load exceeding 50 persons or covered area exceeding 200 sq. meters.',
    exemptCondition: 'Temporary open-ground structures under 50 persons (subject to temporary event fire permission).',
    inspectionFocus: 'Illuminated panic exit signs, fire-retardant seat upholstery certificates, automatic sprinkler systems, smoke extraction vents, four-sided peripheral fire tender driveway.'
  },
  {
    code: 'GROUP_E',
    name: 'Group E: Business / Commercial',
    description: 'Offices, software parks, banks, professional establishments, and corporate headquarters.',
    heightThresholdMeters: 15,
    coveredAreaThresholdSqM: 500,
    nocMandatoryTrigger: 'Mandatory for commercial offices over 15 meters in height or plot area exceeding 500 sq. meters, or multi-tenant commercial complexes.',
    exemptCondition: 'Ground-floor single-office units with direct road access under 100 sq. meters in low-rise commercial markets.',
    inspectionFocus: 'Pressurized staircase shafts, fire-rated doors (2-hour rating), public address communication system, automatic sprinkler grid.'
  },
  {
    code: 'GROUP_F',
    name: 'Group F: Mercantile',
    description: 'Shops, departmental stores, retail markets, supermarkets, and wholesale shopping establishments.',
    heightThresholdMeters: 9,
    coveredAreaThresholdSqM: 500,
    nocMandatoryTrigger: 'Mandatory if covered area exceeds 500 sq. meters or multi-level shopping complex regardless of area.',
    exemptCondition: 'Small neighborhood standalone grocery/retail stores on ground floor under 50 sq. meters with open storefront.',
    inspectionFocus: 'Aisle clearance (minimum 1.5m to 2m), combustible stock storage segregation, overhead sprinklers, emergency exit signage.'
  },
  {
    code: 'GROUP_G',
    name: 'Group G: Industrial',
    description: 'Manufacturing plants, workshops, automobile garages, and fabrication units.',
    heightThresholdMeters: 0,
    coveredAreaThresholdSqM: 300,
    nocMandatoryTrigger: 'Mandatory for all moderate and high-hazard industrial units; low-hazard units exceeding 300 sq. meters.',
    exemptCondition: 'Micro-scale handicraft or dry assembly units without thermal processing or combustible inventory.',
    inspectionFocus: 'Hazard categorization, external yard hydrants, flame-proof electrical fittings, oil/chemical separator basins, heavy-duty fire pumps.'
  },
  {
    code: 'GROUP_H',
    name: 'Group H: Storage',
    description: 'Warehouses, logistics godowns, cold storage, freight depots, and transit sheds.',
    heightThresholdMeters: 0,
    coveredAreaThresholdSqM: 250,
    nocMandatoryTrigger: 'Mandatory if storage area exceeds 250 sq. meters or stores inflammable, plastic, paper, or chemical packaging.',
    exemptCondition: 'Non-combustible inert material storage (e.g. stones, tiles) under 100 sq. meters.',
    inspectionFocus: 'Stack height limitation, minimum 1-meter aisle separation between racks, high-velocity water spray systems, perimeter hydrants.'
  },
  {
    code: 'GROUP_J',
    name: 'Group J: Hazardous',
    description: 'Petroleum storage, LPG bottling plants, paint factories, explosive godowns, and toxic gas units.',
    heightThresholdMeters: 0,
    coveredAreaThresholdSqM: 0,
    nocMandatoryTrigger: 'Mandatory for ALL hazardous structures regardless of size, height, or location.',
    exemptCondition: 'None. Maximum regulatory scrutiny with PESO and State Fire Directorate joint clearance.',
    inspectionFocus: 'Blast walls, foam pourer systems, explosive gas detection sensors, static charge grounding, dual-redundant diesel engine fire pumps.'
  }
];

export const FIRE_NOC_STAGE = {
  PROVISIONAL_NOC: 'PROVISIONAL_NOC',
  FINAL_FIRE_CERTIFICATE: 'FINAL_FIRE_CERTIFICATE',
  RENEWAL_FIRE_CERTIFICATE: 'RENEWAL_FIRE_CERTIFICATE'
};

export const FIRE_NOC_STAGES = {
  PROVISIONAL_NOC: {
    stage: 'PROVISIONAL_NOC',
    title: 'Stage 1: Provisional Fire NOC (Pre-Construction / Planning Stage)',
    description: 'Statutory approval of architectural plans, setbacks, and proposed fire protection scheme prior to municipal building plan sanction.',
    deliverable: 'Provisional Fire Recommendation Letter / Fire Scheme Approval',
    dateLabel: 'Sanction / Application Date',
    milestone: 'Pre-construction fire scheme clearance issued.'
  },
  FINAL_FIRE_CERTIFICATE: {
    stage: 'FINAL_FIRE_CERTIFICATE',
    title: 'Stage 2: Final Fire Safety Certificate / Occupancy NOC (Post-Construction)',
    description: 'Mandatory on-site inspection of installed fire-fighting hardware, pumps, water storage tanks, and alarms prior to granting Occupancy Certificate.',
    deliverable: 'Final Fire Safety Certificate (FSC) / Occupancy Fire NOC',
    dateLabel: 'Inspection & Issuance Date',
    milestone: 'Post-construction physical inspection verified; Occupancy clearance endorsed.'
  },
  RENEWAL_FIRE_CERTIFICATE: {
    stage: 'RENEWAL_FIRE_CERTIFICATE',
    title: 'Stage 3: Periodic Fire NOC Renewal / Annual Compliance Declaration',
    description: 'Recurring periodic renewal (typically annual or 3-yearly) certifying that all installed fire protection equipment remains fully operational and properly maintained.',
    deliverable: 'Fire Safety Certificate Renewal Endorsement / Form B Compliance',
    dateLabel: 'Renewal Expiry & Re-validation Date',
    milestone: 'Annual maintenance audit completed; validity extended.'
  }
};

export const EVIDENCE_CATEGORIES = {
  BUILDING_PLANS: 'BUILDING_PLANS',
  ACTIVE_FIRE_SYSTEMS: 'ACTIVE_FIRE_SYSTEMS',
  PASSIVE_FIRE_SYSTEMS: 'PASSIVE_FIRE_SYSTEMS',
  LEGAL_OCCUPANCY: 'LEGAL_OCCUPANCY',
  PROFESSIONAL_CERTIFICATIONS: 'PROFESSIONAL_CERTIFICATIONS'
};

export const STAGE_EVIDENCE_REQUIREMENTS = {
  PROVISIONAL_NOC: [
    {
      category: EVIDENCE_CATEGORIES.BUILDING_PLANS,
      title: 'Architectural & Site Layout Plans',
      items: [
        {
          id: 'PLAN_SITE_LAYOUT',
          label: 'Dimensioned Site Plan with Peripheral Driveway Width (minimum 6 meters for fire tender)',
          mandatory: true,
          officialRule: 'NBC 2016 Part 4 Clause 3.4.6 (Access)',
          officialBasis: 'Fire appliances require unobstructed access around the perimeter of the building.'
        },
        {
          id: 'PLAN_FLOOR_LAYOUTS',
          label: 'Floor Plans highlighting Means of Escape, Exits, Corridor Widths, and Travel Distances',
          mandatory: true,
          officialRule: 'NBC 2016 Part 4 Clause 4.2 (Exit Requirements)',
          officialBasis: 'Exit capacity and travel distance to the nearest exit must conform to occupancy occupant load.'
        },
        {
          id: 'PLAN_FIRE_SCHEME',
          label: 'Fire Protection Layout Drawing showing proposed riser, hydrant, sprinkler, and pump locations',
          mandatory: true,
          officialRule: 'State Fire Service Byelaws',
          officialBasis: 'Fire scheme must be vetted before piping and electrical works are embedded into the structure.'
        },
        {
          id: 'PLAN_SECTIONS_ELEVATIONS',
          label: 'Building Sections & Elevations indicating floor-to-floor heights, headroom, and refuge areas',
          mandatory: true,
          officialRule: 'NBC 2016 Part 4 Clause 4.4.2 (Refuge Areas for High-Rises over 24m)',
          officialBasis: 'Required to compute high-rise pressure zones and cantilever ladder reach.'
        }
      ]
    },
    {
      category: EVIDENCE_CATEGORIES.LEGAL_OCCUPANCY,
      title: 'Premises Ownership & Authority Filings',
      items: [
        {
          id: 'DOC_TITLE_DEED',
          label: 'Proof of Title Ownership (Registered Sale Deed / Lease Deed / Mutation Extract)',
          mandatory: true,
          officialRule: 'Municipal Town Planning Procedure',
          officialBasis: 'Confirms applicant possesses lawful right to apply for construction permits on the land.'
        },
        {
          id: 'DOC_ZONING_CLEARANCE',
          label: 'Town Planning Zoning / Land Use Permissibility Certificate',
          mandatory: true,
          officialRule: 'City Master Plan Rules',
          officialBasis: 'Ensures the intended building use is legally authorized on the site.'
        }
      ]
    },
    {
      category: EVIDENCE_CATEGORIES.PROFESSIONAL_CERTIFICATIONS,
      title: 'Registered Professional Undertakings',
      items: [
        {
          id: 'CERT_ARCHITECT_COA',
          label: 'Supervising Architect Council of Architecture (COA) Registration & Declaration',
          mandatory: true,
          officialRule: 'Architects Act, 1972',
          officialBasis: 'Attests that architectural drawings comply with life safety and fire exit standards.'
        },
        {
          id: 'CERT_FIRE_CONSULTANT',
          label: 'Fire Safety Consultant / Engineer Structural Compliance Declaration',
          mandatory: false,
          officialRule: 'NBC 2016 Part 4 Appendix A',
          officialBasis: 'Recommended for high-rises (>30m) or hazardous industrial occupancies.'
        }
      ]
    }
  ],
  FINAL_FIRE_CERTIFICATE: [
    {
      category: EVIDENCE_CATEGORIES.ACTIVE_FIRE_SYSTEMS,
      title: 'Active Fire-Fighting Installations & Commissioning Reports',
      items: [
        {
          id: 'SYS_FIRE_PUMPS',
          label: 'Main Electric, Standby Diesel, and Jockey Pump Installation & Discharge Test Report',
          mandatory: true,
          officialRule: 'NBC 2016 Table 7 / IS 15301',
          officialBasis: 'Dual-source water pumping capability is mandatory to ensure pressurized water supply during electrical outages.'
        },
        {
          id: 'SYS_WATER_STORAGE',
          label: 'Underground Static Water Tank & Overhead Terrace Tank Capacity Certificate',
          mandatory: true,
          officialRule: 'NBC 2016 Table 7 Water Supply Matrix',
          officialBasis: 'Dedicated, non-potable fire reserve water volume must be verified on site.'
        },
        {
          id: 'SYS_WET_RISER_HYDRANT',
          label: 'Wet Riser / Downcomer & Internal/External Yard Hydrant Hydrostatic Pressure Test Report',
          mandatory: true,
          officialRule: 'IS 3844 / NBC 2016 Part 4 Clause 5.1',
          officialBasis: 'Must sustain prescribed bar pressure (typically minimum 3.5 bar at highest outlet) without leakage.'
        },
        {
          id: 'SYS_AUTO_SPRINKLERS',
          label: 'Automatic Sprinkler System Grid Flow-Switch Commissioning Certificate',
          mandatory: true,
          officialRule: 'IS 15105 / NBC 2016 Part 4 Clause 5.1.2',
          officialBasis: 'Required in basements >200 sq. m., high-rises >15m, and mercantile/assembly occupancies.'
        },
        {
          id: 'SYS_FIRE_ALARM_PA',
          label: 'Addressable Fire Alarm, Smoke Detection, and Two-Way Public Address System Report',
          mandatory: true,
          officialRule: 'IS 2189 / NBC 2016 Part 4 Clause 5.2',
          officialBasis: 'Ensures instantaneous audio-visual emergency notification and directional evacuation.'
        },
        {
          id: 'SYS_PORTABLE_EXTINGUISHERS',
          label: 'ISI Marked Portable Fire Extinguishers (ABC Dry Powder, CO2, Foam) Deployment Map',
          mandatory: true,
          officialRule: 'IS 15683 / IS 2190',
          officialBasis: 'First-aid firefighting equipment placed at maximum 15-meter walking intervals.'
        }
      ]
    },
    {
      category: EVIDENCE_CATEGORIES.PASSIVE_FIRE_SYSTEMS,
      title: 'Passive Fire Protection & Compartmentation',
      items: [
        {
          id: 'PASSIVE_FIRE_DOORS',
          label: 'Fire-Resistant Doors (minimum 1-hour to 2-hour rating) Test Certificate from CBRI/NABL Lab',
          mandatory: true,
          officialRule: 'IS 3614 / NBC 2016 Clause 3.4.4',
          officialBasis: 'Staircase enclosures and lift lobbies must prevent vertical smoke and heat propagation.'
        },
        {
          id: 'PASSIVE_FIRE_STOP',
          label: 'Fire-Stop Sealant & Cable Penetration Barrier Certificate in Electrical Shafts',
          mandatory: true,
          officialRule: 'NBC 2016 Clause 3.4.8',
          officialBasis: 'Vertical wiring shafts are prime vectors for smoke spread if unsealed between floors.'
        },
        {
          id: 'PASSIVE_STAIR_PRESSURIZATION',
          label: 'Staircase and Lift Well Pressurization Fan Air-Flow Balance Report',
          mandatory: true,
          officialRule: 'NBC 2016 Clause 4.4.3 (Mandatory for buildings >15m)',
          officialBasis: 'Maintains positive air pressure inside escape stairs to keep them free from toxic fumes.'
        }
      ]
    },
    {
      category: EVIDENCE_CATEGORIES.PROFESSIONAL_CERTIFICATIONS,
      title: 'Licensed Agency Completion Certificates',
      items: [
        {
          id: 'CERT_LICENSED_AGENCY_WORK',
          label: 'Certificate of Execution / Work Completion from Directorate-Licensed Fire Agency',
          mandatory: true,
          officialRule: 'State Fire Prevention Act (e.g. Maharashtra Act Sec 3(1) Form A)',
          officialBasis: 'Only registered agencies licensed by the Fire Directorate are authorized to commission safety hardware.'
        },
        {
          id: 'CERT_STRUCTURAL_STABILITY',
          label: 'As-Built Structural Stability Certificate from Registered Structural Engineer',
          mandatory: true,
          officialRule: 'National Building Code 2016 Part 6',
          officialBasis: 'Confirms structure safely supports weight of heavy water tanks and vibration of diesel pumps.'
        }
      ]
    }
  ],
  RENEWAL_FIRE_CERTIFICATE: [
    {
      category: EVIDENCE_CATEGORIES.ACTIVE_FIRE_SYSTEMS,
      title: 'Operational Readiness & Periodic Testing Reports',
      items: [
        {
          id: 'AUDIT_PUMP_RUN_TEST',
          label: 'Quarterly Fire Pump Automatic Cut-In & Flow Inspection Logbook',
          mandatory: true,
          officialRule: 'NBC 2016 Part 4 Maintenance Matrix',
          officialBasis: 'Confirms jockey and diesel pumps trigger automatically upon riser pressure drop.'
        },
        {
          id: 'AUDIT_EXTINGUISHER_REFILL',
          label: 'Fire Extinguisher Annual Servicing, Hydrostatic Test, and Refill Inspection Tags',
          mandatory: true,
          officialRule: 'IS 2190 Clause 12',
          officialBasis: 'Chemical extinguishing agents lose pressure and cake over time without annual maintenance.'
        },
        {
          id: 'AUDIT_WATER_RESERVE',
          label: 'Photographic Proof of Water Storage Availability (dedicated fire water tanks kept full)',
          mandatory: true,
          officialRule: 'State Fire Inspection Norms',
          officialBasis: 'Prevents building management from diverting dedicated fire storage to domestic plumbing.'
        }
      ]
    },
    {
      category: EVIDENCE_CATEGORIES.PROFESSIONAL_CERTIFICATIONS,
      title: 'Periodic Audit & Maintenance Declarations',
      items: [
        {
          id: 'CERT_PERIODIC_FORM_B',
          label: 'Maintenance Audit Certificate by Licensed Fire Protection Agency (e.g. Form B / Annual Audit)',
          mandatory: true,
          officialRule: 'State Fire Prevention Act & Rules',
          officialBasis: 'Statutory biannual or annual re-certification confirming systems are maintained in good working order.'
        },
        {
          id: 'CERT_MOCK_DRILL_EVAC',
          label: 'Bi-Annual Fire Safety Evacuation Mock Drill Report & Staff Training Record',
          mandatory: true,
          officialRule: 'NBC 2016 Part 4 Clause 4.14',
          officialBasis: 'Building occupants and security staff must be trained to operate equipment and guide evacuations.'
        },
        {
          id: 'DOC_PREVIOUS_NOC_COPY',
          label: 'Copy of Previous Fire Safety Certificate / Provisional NOC',
          mandatory: true,
          officialRule: 'State Fire Service Renewal Guidelines',
          officialBasis: 'Provides reference number and establishes continuity of statutory compliance history.'
        }
      ]
    }
  ]
};
