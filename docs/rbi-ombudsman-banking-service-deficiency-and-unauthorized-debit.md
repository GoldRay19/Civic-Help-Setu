# RBI Ombudsman Banking Service Deficiency & Unauthorized Digital Debit Compensation Workspace

## Overview & Statutory Mandate

The **RBI Banking Ombudsman Redressal Workspace** provides bank account holders, digital payment users, and retail borrowers with a calculation, audit, and legal petition generation tool under the **Reserve Bank of India (RBI) Integrated Ombudsman Scheme, 2021 (RB-IOS 2021)** and governing RBI Master Directions.

When consumers face unauthorized electronic debits, delayed reversal of failed ATM/UPI transactions, or arbitrary refusal of banks to return property title deeds, they often encounter bureaucratic delays and lack awareness of statutory compensation formulas. This workspace operationalizes RBI circulars into automated dispute workflows.

---

## Statutory Framework & Key Provisions

### 1. Limiting Liability in Unauthorised Electronic Banking Transactions
Under RBI Master Direction `DBR.No.Leg.BC.78/09.07.005/2017-18`:
- **Zero Customer Liability:**
  - Where the deficiency lies in the bank's systems (negligence/fault of the bank).
  - In third-party breaches where the deficiency lies neither with the bank nor with the customer, and the customer notifies the bank **within three (3) working days** of receiving communication.
  - **Shadow Credit Mandate:** The bank must credit the disputed amount to the customer's account **within 10 working days** from notification date.
- **Limited Customer Liability (4 to 7 Working Days):**
  - Basic Savings Bank Deposit (BSBD) Accounts: Maximum liability capped at **₹5,000/-**.
  - All other Savings, Current, Overdraft accounts, and Credit Cards with limit $\le$ ₹5 Lakh: Maximum liability capped at **₹10,000/-**.
  - Credit Cards with credit limit > ₹5 Lakh: Maximum liability capped at **₹25,000/-**.
- **Burden of Proof (Paragraph 9):** The burden of proving customer negligence or credential sharing lies strictly on the bank.

### 2. Harmonisation of Turnaround Time (TAT) for Failed Transactions
Under RBI Circular `DPSS.CO.PD No.629/02.01.014/2019-20`:
- **Failed ATM Cash Withdrawal:** Pro-active auto-reversal within **T+5 calendar days**. Compensation of **₹100 per day** of delay beyond T+5.
- **Failed UPI Payment:** Auto-reversal within **T+1 calendar day**. Compensation of **₹100 per day** of delay beyond T+1.
- **Failed PoS / E-Commerce Card Transactions:** Auto-reversal within **T+5 calendar days**. Compensation of **₹100 per day** of delay beyond T+5.
- **Failed IMPS / NEFT Transfers:** Reversal within **T+1 calendar day**. Compensation of **₹100 per day** of delay beyond T+1.

### 3. Release of Property Documents on Loan Settlement
Under RBI Circular `DoR.MCS.REC.38/01.01.001/2023-24`:
- Regulated Entities (REs) must release all original movable/immovable property title deeds within **30 days** of full settlement of the loan account.
- In case of failure to release within 30 days, the RE must pay compensation at the rate of **₹5,000 per day** of delay to the borrower.

### 4. Prohibition on Prepayment Penalties
Under RBI Circular `DBOD.No.Dir.BC.30/13.03.00/2014-15`:
- Banks are strictly prohibited from levying foreclosure charges or pre-payment penalties on all floating-rate term loans sanctioned to individual borrowers.

---

## Escalation Procedure & RBI Ombudsman (CMS)

```
Step 1: Branch / Netbanking Complaint Registration
   │
   ▼
Step 2: Escalation to Bank Principal Nodal Officer (PNO)
   │ (Mandatory 30-Day Statutory Cure Period)
   ▼
Step 3: RBI Integrated Ombudsman (cms.rbi.org.in)
   │ (Clause 11 Grounds of Complaint)
   ▼
Step 4: Award & Compensation under Clause 16
   │ - Full Financial Loss (Up to ₹20,00,000/-)
   │ - Mental Agony & Harassment Damages (Up to ₹1,00,000/-)
```

---

## Workspace Architecture & Local-First Security

```
src/
├── services/
│   ├── rbiOmbudsmanService.js       # Statutory zero-liability & TAT calculation logic
│   ├── rbiOmbudsmanService.test.js  # Vitest test suite
│   ├── rbiOmbudsmanStorage.js       # LocalStorage vault with SHA-256 seal
│   └── rbiOmbudsmanStorage.test.js  # Storage tests & integrity verification
├── components/rbiOmbudsman/
│   ├── ZeroLiabilityAuditorCard.jsx             # Zero-liability tier & shadow credit auditor
│   ├── ZeroLiabilityAuditorCard.test.jsx
│   ├── TatCompensationCalculatorCard.jsx        # ₹100/day & ₹5,000/day TAT calculator
│   ├── TatCompensationCalculatorCard.test.jsx
│   ├── RbiBankingCaseSummaryCard.jsx            # Dispute summary & lifecycle manager
│   ├── RbiBankingCaseSummaryCard.test.jsx
│   ├── RbiOmbudsmanDrafterModal.jsx             # PNO Letter & CMS Petition drafter
│   └── RbiOmbudsmanDrafterModal.test.jsx
└── pages/
    ├── RbiOmbudsmanWorkspace.jsx    # Primary workspace container & case switcher
    └── RbiOmbudsmanWorkspace.test.jsx
```

### Data Storage & Privacy Protection
1. **Local Vault Key:** `civicbridge_rbi_banking_vault`
2. **Settings Key:** `civicbridge_rbi_banking_settings`
3. **SHA-256 Tamper-Evident Seal:** Each case computes a canonical cryptographic digest over key fields (bank name, account number, dispute type, transaction amount, dates, timestamps) to verify evidentiary integrity.
4. **DPDP Act 2023 Compliance:** Bank account numbers are masked (`XXXX-XXXX-8123`) and contact details are redacted (`98XXXXXX45`, `u***@bank.in`) upon export.

---

## Official Status Disclaimer

> **CITIZEN WORKSPACE RECORD & INTEGRITY SEAL:** This banking service deficiency and compensation case record is generated and stored locally in your browser. It is intended for citizen evidentiary organization, TAT penalty calculation, and drafting petitions to the Bank Principal Nodal Officer (PNO) and RBI Ombudsman. It does NOT automatically file complaints on the RBI CMS portal (cms.rbi.org.in) or execute monetary awards.
