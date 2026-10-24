/**
 * Directory of Indian public authorities, nodal ministries, and Central/State PIO designations.
 */
export const RTI_DEPARTMENT_DIRECTORY = [
  {
    id: 'municipal-corporation',
    name: 'Municipal Corporation (Civic Works & Sanitation)',
    nodalAuthority: 'Office of the Chief Municipal Officer / Commissioner',
    pioDesignation: 'Public Information Officer (Engineering & Public Health)',
    appellateAuthority: 'Additional Municipal Commissioner',
    feeMode: 'Court Fee Stamp of ₹10 or Cash Receipt at Citizen Facilitation Center',
    commonQueries: [
      'Certified copy of road construction and repair contract sanctioned in Ward.',
      'Daily attendance and muster roll of sanitation workers in sector.',
      'Total funds allocated vs actual expenditure on drainage desilting.'
    ]
  },
  {
    id: 'revenue-land-records',
    name: 'Revenue & Land Records (Tehsil / Sub-Registrar)',
    nodalAuthority: 'Office of the District Collector / Sub-Divisional Officer',
    pioDesignation: 'Tehsildar / Naib Tehsildar (RTI Cell)',
    appellateAuthority: 'Sub-Divisional Magistrate (SDM)',
    feeMode: 'Indian Postal Order (IPO) or Court Fee Stamp of ₹10 payable to Accounts Officer',
    commonQueries: [
      'Daily progress report and officer movement sheet for pending mutation application.',
      'Certified copy of Jamabandi / Khasra land record entry.',
      'Details of encumbrance inspection report.'
    ]
  },
  {
    id: 'transport-rto',
    name: 'Regional Transport Authority (RTO / DTO)',
    nodalAuthority: 'Office of the Transport Commissioner',
    pioDesignation: 'Assistant Regional Transport Officer (ARTO - Administration)',
    appellateAuthority: 'Regional Transport Officer (RTO)',
    feeMode: 'Treasury Challan or IPO of ₹10',
    commonQueries: [
      'Status of Permanent Driving License dispatch and postal speed post tracking code.',
      'Copy of vehicle fitness re-inspection report and remarks sheet.',
      'Procedure and prescribed timeline for commercial permit renewal.'
    ]
  },
  {
    id: 'food-civil-supplies',
    name: 'Food, Civil Supplies & Consumer Affairs',
    nodalAuthority: 'Directorate of Food & Civil Supplies',
    pioDesignation: 'District Supply Officer (DSO)',
    appellateAuthority: 'Joint Director (PDS Distribution)',
    feeMode: 'IPO of ₹10 in favour of Accounts Officer',
    commonQueries: [
      'Monthly allocation quota and actual lifting statement for Fair Price Shop (FPS).',
      'Pending application list for priority household (NFSA) ration cards in block.',
      'Stock register copy of subsidised foodgrain distribution.'
    ]
  }
];
