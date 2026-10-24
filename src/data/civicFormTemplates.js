/**
 * Standard legal and civic application form templates used across Indian administrative offices.
 */
export const CIVIC_FORM_TEMPLATES = [
  {
    id: 'rti-section-6',
    title: 'Standard RTI Application (Section 6(1))',
    act: 'Right to Information Act, 2005',
    category: 'GOVERNANCE',
    applicableServices: ['complaints', 'general', 'all'],
    fields: [
      { key: 'applicantName', label: 'Full Name of Applicant', required: true, defaultFromProfile: 'username' },
      { key: 'guardianName', label: "Father's / Spouse's Name", required: true },
      { key: 'address', label: 'Postal Address for Communication', required: true },
      { key: 'pincode', label: 'Postal PIN Code', required: true },
      { key: 'contactNumber', label: 'Phone / Mobile Number', required: true },
      { key: 'publicAuthority', label: 'Name of Public Authority / Department', required: true },
      { key: 'particulars', label: 'Information Sought (Point-wise)', type: 'textarea', required: true },
      { key: 'feePaymentMode', label: 'Application Fee Mode (IPO / Court Fee Stamp / DD)', default: 'Court Fee Stamp (₹10)' }
    ],
    templateText: `FORM A
APPLICATION FOR INFORMATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005

To,
The Public Information Officer (PIO),
{{publicAuthority}}

1. Full Name of the Applicant: {{applicantName}}
2. Father's / Spouse's Name: {{guardianName}}
3. Complete Address for Correspondence:
   {{address}}
   PIN Code: {{pincode}}
   Contact Mobile: {{contactNumber}}

4. Particulars of Information Sought:
{{particulars}}

5. Period to which the information relates: Current / Financial Year {{year}}
6. Whether information is required by post or in person: Registered Post
7. Details of Fee Deposited:
   An application fee of ₹10/- has been remitted via: {{feePaymentMode}}

8. Declaration:
   I hereby declare that I am a citizen of India and the information sought falls within the scope of Section 2(f) and does not fall under exemptions of Section 8 or 9 of the RTI Act, 2005.

Place: ________________________
Date: {{date}}

Signature of Applicant:
({{applicantName}})`
  },
  {
    id: 'income-declaration-affidavit',
    title: 'Self-Declaration Affidavit of Family Income',
    act: 'State Welfare & Concession Rules',
    category: 'WELFARE',
    applicableServices: ['income-cert', 'ration-card', 'welfare'],
    fields: [
      { key: 'applicantName', label: 'Declarant Full Name', required: true, defaultFromProfile: 'username' },
      { key: 'guardianName', label: "Father's / Husband's Name", required: true },
      { key: 'age', label: 'Age (in years)', required: true },
      { key: 'residentialAddress', label: 'Permanent Address', required: true },
      { key: 'occupation', label: 'Source of Livelihood / Profession', required: true },
      { key: 'annualIncomeFigure', label: 'Total Annual Income from all sources (₹)', required: true },
      { key: 'purpose', label: 'Purpose of Affidavit (e.g., Scholarship / Fee Waiver)', required: true }
    ],
    templateText: `BEFORE THE NOTARY PUBLIC / EXECUTIVE MAGISTRATE
SELF-DECLARATION AFFIDAVIT FOR ANNUAL INCOME

I, {{applicantName}}, son/daughter/spouse of {{guardianName}}, aged {{age}} years, residing permanently at:
{{residentialAddress}}, do hereby solemnly affirm and state on oath as under:

1. That I am a permanent resident of the address specified above.
2. That my primary occupation / source of livelihood is {{occupation}}.
3. That my total annual family income from all legitimate sources (including agriculture, wages, trade, and investments) during the current financial year is ₹{{annualIncomeFigure}}/-.
4. That neither I nor any dependent family member has any concealed source of income.
5. That this affidavit is being executed to be submitted before the competent authority for the purpose of {{purpose}}.

VERIFICATION:
Verified at ________________________ on this day of {{date}}, that the contents of paragraphs 1 to 5 of this affidavit are true and correct to the best of my personal knowledge and belief. No part of it is false and nothing material has been concealed.

Deponent Signature:
({{applicantName}})`
  },
  {
    id: 'service-grievance-representation',
    title: 'Formal Representation for Undue Delay in Civic Service',
    act: 'Citizen Charter / Right to Public Service Delivery Act',
    category: 'GRIEVANCE',
    applicableServices: ['all', 'track'],
    fields: [
      { key: 'applicantName', label: 'Citizen Name', required: true, defaultFromProfile: 'username' },
      { key: 'applicationNumber', label: 'Original Application Reference / Ack No.', required: true },
      { key: 'serviceName', label: 'Name of Service Applied For', required: true },
      { key: 'dateOfApplication', label: 'Date of Initial Submission', required: true },
      { key: 'departmentOffice', label: 'Office / Department Where Filed', required: true },
      { key: 'stipulatedDays', label: 'Citizen Charter Statutory Days', default: '15' }
    ],
    templateText: `MEMORANDUM OF REPRESENTATION FOR SERVICE DELIVERY DELAY

To,
The Competent Appellate Authority / District Magistrate,
{{departmentOffice}}

Subject: Grievance regarding non-delivery of '{{serviceName}}' beyond statutory timeline (Application Ref: {{applicationNumber}}).

Respected Sir/Madam,

I, {{applicantName}}, submitted a formal application for {{serviceName}} on {{dateOfApplication}} at {{departmentOffice}} under acknowledgement reference {{applicationNumber}}.

Under the notified Citizen Charter and State Public Services Guarantee Act, the prescribed timeline for processing this service is {{stipulatedDays}} working days.

Despite expiry of the statutory period and my repeated inquiries, the said service/certificate has neither been granted nor has any written communication detailing deficiencies been issued to me.

I therefore earnestly request you to kindly:
1. Intervene and direct the designated officer to dispose of my application immediately.
2. Communicate the reasons for the delay in writing.

Thanking you.

Yours faithfully,

({{applicantName}})
Date: {{date}}`
  }
];
