import { describe, it, expect } from 'vitest';
import {
  TENDER_SCHEMA_VERSION,
  FORBIDDEN_TENDER_FIELDS,
  validateTenderRecord,
  validateTenderDirectory,
} from './tenderContract';
import { TENDER_DIRECTORY_DATA } from './tenders';

const sampleValidTender = {
  id: 'gem-2026-b-581902',
  tenderRefNumber: 'GEM/2026/B/581902',
  title: 'Procurement of Solar Inverters for Primary Health Centers',
  category: 'goods',
  authority: 'Ministry of New and Renewable Energy',
  jurisdiction: {
    level: 'national',
    states: [],
    districts: [],
    localBody: '',
  },
  sourceUrl: 'https://gem.gov.in/tenders/GEM-2026-B-581902',
  publishedDate: '2026-10-15',
  closingSchedule: {
    closingDate: '2026-11-20',
    isUnavailable: false,
    closingTime: '15:00 IST',
  },
  preBidMeeting: {
    date: '2026-10-25',
    time: '11:00 IST',
    mode: 'online',
    venueOrLink: 'https://meet.gov.in/gem-prebid-581902',
    isUnavailable: false,
    instructions: 'Vendors must register queries 24 hours in advance via GeM portal.',
  },
  clarificationsDeadline: '2026-10-24',
  financials: {
    estimatedValue: {
      amount: 4500000,
      currency: 'INR',
      isDisclosed: true,
      statedText: '₹45,00,000 (Inclusive of GST)',
    },
    tenderFee: {
      amount: 0,
      isExemptForMsme: true,
      exemptionBasis: 'General Financial Rules 2017 Rule 161(iv)',
      paymentMode: 'Exempt',
    },
    emd: {
      amount: 90000,
      isExemptForMsme: true,
      exemptionBasis: 'Rule 170 of General Financial Rules (GFR) 2017 for Micro and Small Enterprises',
      exemptionRules: 'Exempt on submission of valid UDYAM Registration certificate matching tender NIC code.',
      formsAccepted: ['Bank Guarantee', 'Demand Draft', 'Insurance Surety Bond'],
    },
  },
  eligibilityCriteria: {
    mandatory: [
      {
        id: 'req-gstin',
        label: 'Valid GSTIN Registration',
        description: 'Vendor must hold active Goods and Services Tax identification number.',
        evidenceRequired: 'GSTIN Registration Certificate with latest GSTR-3B filing acknowledgement',
        statutoryBasis: 'CGST Act 2017',
      },
      {
        id: 'req-udyam',
        label: 'UDYAM Registration (for MSME exemptions)',
        description: 'Micro or Small Enterprise status certificate for fee/EMD waiver.',
        evidenceRequired: 'Valid UDYAM Registration Certificate with appropriate NIC code',
        statutoryBasis: 'MSMED Act 2006',
      },
    ],
    preferences: [
      {
        id: 'pref-ppp-mii',
        label: 'Public Procurement (Preference to Make in India) Order 2017',
        description: 'Class I Local Supplier preference (local content >= 50%).',
        policyReference: 'DPIIT Order No. P-45021/2/2017-PP (BE-II)',
        benefitDescription: 'Purchase preference margin of 20% in competitive L1 bidding.',
      },
    ],
    conditional: [
      {
        id: 'cond-startup',
        condition: 'DPIIT Recognized Startup',
        requirements: ['Exemption from prior turnover and experience criteria subject to meeting technical specifications.'],
      },
    ],
    unverifiedGaps: [],
  },
  corrigenda: [
    {
      corrigendumNumber: 1,
      publishedDate: '2026-10-28',
      title: 'Extension of Pre-bid query window and clarification on battery compatibility',
      sourceUrl: 'https://gem.gov.in/tenders/corrigendum/1',
      summary: 'Pre-bid queries extended to 2026-10-29; clarified lithium ferro-phosphate compatibility.',
    },
  ],
  officialInstructions: [
    {
      section: 'Clause 4.1 - Bid Submission',
      content: 'All documents must be digitally signed using Class 3 DSC. Physical submission of documents is strictly disallowed.',
    },
  ],
  editorialNotes: [
    {
      topic: 'MSME Exemption Tip',
      note: 'Ensure your UDYAM certificate Major Activity category covers Manufacturing or Services relevant to solar installations before requesting EMD waiver.',
      author: 'Civic Help Setu',
    },
  ],
  auditMetadata: {
    effectiveDate: '2026-10-15',
    lastVerified: '2026-11-01',
    verifiedBy: 'Civic Help Setu Procurement Auditor',
    sourceUrl: 'https://gem.gov.in/tenders/GEM-2026-B-581902',
    status: 'active',
  },
};

describe('tenderContract validation (#722)', () => {
  it('passes on a valid tender readiness record', () => {
    const errors = validateTenderRecord(sampleValidTender);
    expect(errors).toEqual([]);
  });

  it('rejects forbidden personal fields (vendor privacy & bidding prevention)', () => {
    FORBIDDEN_TENDER_FIELDS.forEach((forbiddenKey) => {
      const contaminated = {
        ...sampleValidTender,
        [forbiddenKey]: 'secret_data_or_pii',
      };
      const errors = validateTenderRecord(contaminated);
      expect(errors.some((e) => e.field.includes(forbiddenKey))).toBe(true);
    });
  });

  it('enforces dated official https source URL', () => {
    const invalidUrl = {
      ...sampleValidTender,
      sourceUrl: 'http://insecure-portal.gov.in',
    };
    const errors = validateTenderRecord(invalidUrl);
    expect(errors.some((e) => e.field === 'sourceUrl')).toBe(true);
  });

  it('requires explicit unavailable flag when closing date is missing', () => {
    const missingClosing = {
      ...sampleValidTender,
      closingSchedule: {
        closingDate: null,
        isUnavailable: false,
      },
    };
    const errors = validateTenderRecord(missingClosing);
    expect(errors.some((e) => e.field.includes('closingSchedule'))).toBe(true);

    const validUnavailable = {
      ...sampleValidTender,
      closingSchedule: {
        closingDate: null,
        isUnavailable: true,
        unavailableReason: 'Notice states date to be notified in forthcoming corrigendum.',
      },
    };
    const noErrors = validateTenderRecord(validUnavailable);
    expect(noErrors).toEqual([]);
  });

  it('strictly validates separation of mandatory eligibility from preferences', () => {
    const noMandatory = {
      ...sampleValidTender,
      eligibilityCriteria: {
        mandatory: [],
        preferences: [],
      },
    };
    const errors = validateTenderRecord(noMandatory);
    expect(errors.some((e) => e.field === 'eligibilityCriteria.mandatory')).toBe(true);
  });

  it('validates full directory envelope and catches duplicate IDs', () => {
    const envelope = {
      schemaVersion: TENDER_SCHEMA_VERSION,
      tenders: [sampleValidTender, { ...sampleValidTender, id: 'gem-2026-b-581902', tenderRefNumber: 'DIFF-REF-1' }],
    };
    const errors = validateTenderDirectory(envelope);
    expect(errors.some((e) => e.reason.includes('duplicate tender id'))).toBe(true);
  });

  it('validates every seed tender in TENDER_DIRECTORY_DATA without errors', () => {
    const errors = validateTenderDirectory(TENDER_DIRECTORY_DATA);
    expect(errors).toEqual([]);
    expect(TENDER_DIRECTORY_DATA.tenders.length).toBeGreaterThanOrEqual(4);
  });
});
