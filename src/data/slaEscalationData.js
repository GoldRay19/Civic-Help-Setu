/**
 * Statutory Service Level Agreement (SLA) timelines, appellate authorities,
 * and penalty provisions under Indian Citizen Charters & Right to Services Acts.
 */
export const STATUTORY_SLA_DATA = {
  'income-certificate': {
    serviceName: 'Income Certificate',
    statutoryDays: 15,
    firstAppellateAuthority: 'Sub-Divisional Magistrate (SDM) / Revenue Officer',
    secondAppellateAuthority: 'District Magistrate / Collector',
    actName: 'Right to Public Services Guarantee Act',
    penaltyClause: '₹250 per day of delay up to a maximum of ₹5,000 on defaulting designated officer.'
  },
  'caste-certificate': {
    serviceName: 'Caste / Community Certificate',
    statutoryDays: 21,
    firstAppellateAuthority: 'District Social Welfare Officer / Additional District Magistrate (ADM)',
    secondAppellateAuthority: 'Divisional Commissioner',
    actName: 'Right to Public Services Guarantee Act',
    penaltyClause: 'Statutory inquiry and compensation to applicant up to ₹2,500.'
  },
  'driving-license': {
    serviceName: 'Driving License (Learner / Permanent)',
    statutoryDays: 14,
    firstAppellateAuthority: 'Regional Transport Officer (RTO)',
    secondAppellateAuthority: 'Transport Commissioner',
    actName: 'Motor Vehicles (Citizen Charter) Rules',
    penaltyClause: 'Expedited hearing within 7 working days from date of first appeal.'
  },
  'ration-card': {
    serviceName: 'New / Modified Ration Card',
    statutoryDays: 30,
    firstAppellateAuthority: 'District Supply Officer (DSO)',
    secondAppellateAuthority: 'State Food & Civil Supplies Director',
    actName: 'National Food Security Act (NFSA) Charter',
    penaltyClause: 'Immediate spot inspection order and disciplinary intimation.'
  },
  'passport-seva': {
    serviceName: 'Passport Police Verification Clearance',
    statutoryDays: 21,
    firstAppellateAuthority: 'Superintendent of Police (SP) / DCP (Special Branch)',
    secondAppellateAuthority: 'Regional Passport Officer (RPO)',
    actName: 'Passports Act & Ministry of External Affairs Citizen Charter',
    penaltyClause: 'Priority review meeting at Regional Passport Office.'
  },
  'default': {
    serviceName: 'General Civic Service',
    statutoryDays: 30,
    firstAppellateAuthority: 'Head of Department / Appellate Officer',
    secondAppellateAuthority: 'District Grievance Redressal Officer',
    actName: 'Public Service Delivery Charter',
    penaltyClause: 'Statutory departmental review of unaddressed application.'
  }
};
