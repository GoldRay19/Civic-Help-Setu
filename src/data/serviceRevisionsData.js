/**
 * Historical official revisions, Government Orders (G.O.s), and Gazette Notifications
 * documenting changes to service rules, fee schedules, and required documentation.
 */
export const SERVICE_REVISIONS = [
  {
    serviceId: 'income-certificate',
    revisions: [
      {
        version: 'v2.4',
        effectiveDate: '2026-01-15',
        circularNumber: 'GO-REV/2026/104-B',
        issuingAuthority: 'Department of Revenue & Land Reforms',
        title: 'Mandatory Self-Declaration Affidavit in lieu of Gazetted Attestation',
        type: 'DOCUMENT_SIMPLIFICATION',
        changes: [
          'Removed requirement of Executive Magistrate attestation for annual income under ₹3 Lakhs.',
          'Self-declaration affidavit on plain paper accepted for faster 7-day disposal.'
        ],
        sourceUrl: 'https://revenue.rajasthan.gov.in/circulars/2026/104-B'
      },
      {
        version: 'v2.3',
        effectiveDate: '2025-08-01',
        circularNumber: 'GO-REV/2025/89',
        issuingAuthority: 'Board of Revenue',
        title: 'Statutory Validity Extension to 3 Financial Years',
        type: 'VALIDITY_UPDATE',
        changes: [
          'Income certificate validity enhanced from 1 year to 3 financial years for recurring student scholarships.',
          'QR code verification enabled on digital certificates.'
        ],
        sourceUrl: 'https://revenue.rajasthan.gov.in/circulars/2025/89'
      }
    ]
  },
  {
    serviceId: 'driving-license',
    revisions: [
      {
        version: 'v3.1',
        effectiveDate: '2026-02-10',
        circularNumber: 'MoRTH/CMVR/2026/08',
        issuingAuthority: 'Ministry of Road Transport and Highways (MoRTH)',
        title: 'Faceless Learner License via Aadhaar e-KYC',
        type: 'PROCEDURE_UPDATE',
        changes: [
          'Learner License computer test permitted from home via AI proctoring; RTO physical visit eliminated.',
          'Driving school accreditation certificate (Form 5B) accepted for waiver of driving skill test.'
        ],
        sourceUrl: 'https://morth.nic.in/notifications/2026/08'
      }
    ]
  },
  {
    serviceId: 'caste-certificate',
    revisions: [
      {
        version: 'v2.0',
        effectiveDate: '2025-11-20',
        circularNumber: 'GO-SWD/2025/112',
        issuingAuthority: 'Ministry of Social Justice & Empowerment',
        title: 'Digitized Central OBC Non-Creamy Layer (NCL) Income Cap Update',
        type: 'ELIGIBILITY_UPDATE',
        changes: [
          'OBC Creamy Layer threshold verified directly through automated Income Tax PAN linkage.',
          'Ancestral residence record prior to 1993 required for first-time applicant lineages.'
        ],
        sourceUrl: 'https://socialjustice.gov.in/orders/2025/112'
      }
    ]
  }
];
