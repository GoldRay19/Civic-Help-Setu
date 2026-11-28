# Food Safety (FSSAI) Adulteration, Hygiene Rating & Adjudicating Officer Redressal Workspace

## Overview & Statutory Mandate

The **Food Safety & Standards Redressal Workspace** provides citizens, consumers, and public-interest advocates with an evidence-grade calculation, audit, and legal petition generation tool under the **Food Safety and Standards Act, 2006 (FSSA 2006)** and the **Food Safety and Standards (Licensing and Registration of Food Businesses) Regulations, 2011**.

When facing adulterated meals, foreign physical contaminants, expired or misleadingly labeled packaged goods, or unhygienic commercial kitchens, consumers often lack clarity on how statutory penalties are structured or how to enforce mandatory victim compensation under **Section 65**. This workspace operationalizes statutory provisions into structured workflows.

---

## Statutory Framework & Key Provisions

### 1. FSSAI Schedule 4 Sanitary & Hygiene Standards
Under the Licensing & Registration Regulations, all Food Business Operators (FBOs) must comply with mandatory Schedule 4 sanitary requirements:
- **Potable Water Compliance (IS 10500):** Continuous supply of potable water with quarterly laboratory test reports for microbial and heavy metal parameters.
- **Cold Chain Monitoring:** Daily temperature monitoring logs ensuring chilled storage ($\le 5^\circ\text{C}$), frozen storage ($\le -18^\circ\text{C}$), and hot holding ($\ge 60^\circ\text{C}$).
- **Food Handler Health (Form IX):** Annual medical fitness certificates, typhoid/hepatitis A vaccinations, and daily fitness checks.
- **Integrated Pest Management (IPM):** Commercial contracts, bait station maps, insect electrocutor logs, and zero tolerance for infestation.
- **Total Polar Compounds (TPC):** Cooking oil monitoring ensuring TPC $\le 25\%$ without toxic cyclic polymer formation from repeated overheating.
- **Cross-Contamination Prevention:** Color-coded cutting surfaces and strict physical separation of raw and ready-to-eat foods.

### 2. Statutory Penalties under FSSA 2006
| Statutory Provision | Nature of Violation | Maximum Fine Liability | Competent Forum |
| :--- | :--- | :--- | :--- |
| **Section 51** | Sale of Substandard Food | Up to ₹5,00,000/- | Adjudicating Officer (ADM) |
| **Section 52** | Misbranded Food / Deceptive Labeling | Up to ₹3,00,000/- | Adjudicating Officer (ADM) |
| **Section 53** | Misleading Advertisements | Up to ₹10,00,000/- | Adjudicating Officer (ADM) |
| **Section 54** | Extraneous Matter (Insects, plastics, metals) | Up to ₹1,00,000/- | Adjudicating Officer (ADM) |
| **Section 56** | Unhygienic / Unsanitary Processing | Up to ₹1,00,000/- | Adjudicating Officer (ADM) |
| **Section 59** | Unsafe Food Causing Bodily Harm / Death | Imprisonment up to life + Fine up to ₹10,00,000/- | Special Court / Judicial Magistrate |

### 3. Consumer Injury Compensation (Section 65)
Section 65 creates a strict statutory right of compensation payable **directly to the consumer or legal heirs**:
- **Death / Fatality:** Not less than **₹5,00,000/-**.
- **Grievous Bodily Injury:** Up to **₹3,00,000/-** plus actual medical expenses.
- **Other Physical Injury / Toxicity:** Up to **₹1,00,000/-** plus hospitalization bills and lost wages.
- **Mandatory Interim Relief (Section 65(2)):** The Adjudicating Officer is empowered to order interim relief within **30 days** of application.
- **Default Penalty (Section 65(3)):** Failure of an FBO to pay compensation within the decreed timeline triggers immediate suspension and cancellation of their FSSAI food business license.

---

## Workspace Architecture & Local-First Security

```
src/
├── services/
│   ├── foodSafetyService.js       # Statutory formulas, Schedule 4 auditor, petition drafter
│   ├── foodSafetyService.test.js  # Vitest test suite for statutory calculations
│   ├── foodSafetyStorage.js       # LocalStorage vault with SHA-256 seal computation
│   └── foodSafetyStorage.test.js  # Storage & tamper-evident digest verification tests
├── components/foodSafety/
│   ├── Schedule4AuditorCard.jsx             # Interactive Schedule 4 checklist & rating
│   ├── Schedule4AuditorCard.test.jsx        # Component test suite
│   ├── AdulterationPenaltyCalculatorCard.jsx # Penalty exposure & Section 65 calculator
│   ├── AdulterationPenaltyCalculatorCard.test.jsx
│   ├── FoodSafetyCaseSummaryCard.jsx        # Case summary, lifecycle stage, actions
│   ├── FoodSafetyCaseSummaryCard.test.jsx
│   ├── FoodSafetyDrafterModal.jsx           # ADM Petition & FBO Notice generator
│   └── FoodSafetyDrafterModal.test.jsx
└── pages/
    ├── FoodSafetyWorkspace.jsx    # Primary workspace container & case selector
    └── FoodSafetyWorkspace.test.jsx
```

### Data Storage & Privacy Protection
1. **Local Vault Key:** `civicbridge_food_safety_vault`
2. **Settings Key:** `civicbridge_food_safety_settings`
3. **SHA-256 Tamper-Evident Seal:** Each case computes a canonical cryptographic digest over key fields (FBO details, product, batch, injury tier, expenses, timestamps) to verify evidentiary integrity.
4. **DPDP Act 2023 Compliance:** Phone numbers and email addresses are masked upon dossier export (`98XXXXXX10`, `m***@example.com`), and PIN codes are generalized to prevent involuntary PII leakage.

---

## Official Status Disclaimer

> **CITIZEN WORKSPACE RECORD & INTEGRITY SEAL:** This food safety case record is created and stored strictly on your local browser device. It is intended for citizen evidentiary organization, Schedule 4 sanitary audits, and drafting petitions before the Adjudicating Officer (ADM) or Designated Officer. It does NOT constitute an official government case file or an automated filing on the FSSAI / FoSCoS portal.
