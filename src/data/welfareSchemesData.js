/**
 * Master data for Indian central and state welfare entitlement programs,
 * direct benefit transfers (DBT), insurance covers, and statutory subsidies.
 */
export const WELFARE_SCHEMES = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN Samman Nidhi',
    department: 'Ministry of Agriculture & Farmers Welfare',
    category: 'AGRICULTURE',
    annualBenefitCash: 6000,
    annualBenefitInKind: 0,
    type: 'DIRECT_CASH',
    description: 'Direct income support of ₹6,000 per year in three equal 4-monthly installments of ₹2,000.',
    criteria: {
      occupation: ['farmer', 'agriculture'],
      maxAnnualIncome: 300000,
      landholder: true
    }
  },
  {
    id: 'ayushman-bharat',
    name: 'Ayushman Bharat PM-JAY',
    department: 'National Health Authority',
    category: 'HEALTH',
    annualBenefitCash: 0,
    annualBenefitInKind: 500000,
    type: 'HEALTH_COVER',
    description: 'Cashless secondary and tertiary healthcare hospitalization cover of up to ₹5,00,000 per family per year.',
    criteria: {
      maxAnnualIncome: 250000,
      priorityCategories: ['BPL', 'SC', 'ST', 'OBC', 'GENERAL_EWS']
    }
  },
  {
    id: 'pm-awas-gramin',
    name: 'PM Awas Yojana (PMAY-G / Urban)',
    department: 'Ministry of Housing and Urban Affairs',
    category: 'HOUSING',
    annualBenefitCash: 120000,
    annualBenefitInKind: 0,
    type: 'SUBSIDY',
    description: 'Financial assistance for construction of pucca house with basic amenities for homeless or kutcha house dwellers.',
    criteria: {
      maxAnnualIncome: 300000,
      hasPuccaHouse: false
    }
  },
  {
    id: 'nsap-old-age',
    name: 'Indira Gandhi National Old Age Pension (IGNOAPS)',
    department: 'Ministry of Rural Development',
    category: 'PENSION',
    annualBenefitCash: 6000, // ₹500/month avg central+state share
    annualBenefitInKind: 0,
    type: 'PENSION',
    description: 'Monthly social security pension for senior citizens living below poverty line.',
    criteria: {
      minAge: 60,
      maxAnnualIncome: 120000
    }
  },
  {
    id: 'post-matric-scholarship',
    name: 'Post-Matric Scholarship Scheme',
    department: 'Ministry of Social Justice and Empowerment',
    category: 'EDUCATION',
    annualBenefitCash: 24000,
    annualBenefitInKind: 0,
    type: 'SCHOLARSHIP',
    description: 'Full tuition reimbursement and monthly maintenance allowance for post-secondary education.',
    criteria: {
      student: true,
      maxAnnualIncome: 250000,
      priorityCategories: ['SC', 'ST', 'OBC', 'MINORITY']
    }
  },
  {
    id: 'pm-mudra-shishu',
    name: 'PMMY MUDRA Collateral-Free Microloan Subsidy',
    department: 'Ministry of Finance / SIDBI',
    category: 'LIVELIHOOD',
    annualBenefitCash: 15000, // Estimated interest subvention & collateral waiver saving
    annualBenefitInKind: 0,
    type: 'INTEREST_SUBVENTION',
    description: 'Access to collateral-free micro enterprise capital up to ₹50,000 with 2% interest subvention for prompt repayers.',
    criteria: {
      occupation: ['self-employed', 'artisan', 'vendor', 'business', 'entrepreneur'],
      minAge: 18
    }
  },
  {
    id: 'sukanya-samriddhi',
    name: 'Sukanya Samriddhi Yojana (Interest Bonus)',
    department: 'Department of Posts / Ministry of Finance',
    category: 'GIRL_CHILD',
    annualBenefitCash: 12500, // Compounded tax-free high interest yield differential
    annualBenefitInKind: 0,
    type: 'HIGH_YIELD_SAVINGS',
    description: 'High interest rate (8.2% p.a.) sovereign girl child welfare scheme with 80C tax deduction.',
    criteria: {
      hasDaughterUnder10: true
    }
  }
];
