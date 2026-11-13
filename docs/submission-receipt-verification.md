# Civic Submission Receipt Verification (#742)

## 1. Overview

Civic submission receipts act as statutory proof of citizen applications under State Right to Public Services Charters. Prior to #742, acknowledgment slips utilized a short polynomial hash (`CB-SEAL-XXXX-XXXX`) and lacked cryptographic sealing, leaving exported receipts vulnerable to off-platform tampering, forged reference IDs, altered processing timelines, and accidental PII leakage (such as embedded Aadhaar, PAN, or phone numbers).

This release introduces an end-to-end cryptographic receipt verification system featuring:
1. **Canonical FIPS 180-4 SHA-256 Digital Seals:** Deterministic digests computed over canonicalized receipt facts.
2. **Recursive PII & Secret Scrubbing:** Automatic data minimization stripping government identifiers and sensitive credentials prior to sealing and export.
3. **Pure-SVG Scannable QR Codes:** Vector-rendered QR matrices embeddable across both dark-mode web views and print media.
4. **Offline Interactive Tamper Verifier:** Interactive validation tab allowing citizens, counter clerks, and appellate authorities to paste any ASCII slip or JSON dossier to verify cryptographic authenticity.
5. **Signed JSON Dossiers:** Portable, machine-readable acknowledgment exports with statutory signature metadata.

---

## 2. Cryptographic Architecture

### 2.1 Canonical Serialization & Deterministic Digest

To prevent hash discrepancies caused by differing JSON key ordering or whitespace, receipt facts are canonicalized prior to hashing:

```
+-------------------------------------------------------------+
| Application Record (ID, Service, Applicant, Dates, Stages)  |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
| PII Minimization & Scrubbing (Aadhaar, PAN, Phone redacted) |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
| Canonical Normalization (getReceiptCanonicalPayload)        |
| - version: 1                                                |
| - receiptNumber, applicationId, serviceName, applicantName  |
| - submissionDate, targetCompletionDate, status, stages      |
+-------------------------------------------------------------+
                              │
                              ▼
+-------------------------------------------------------------+
| FIPS 180-4 SHA-256 Digest (64-character lowercase hex)      |
+-------------------------------------------------------------+
```

Canonical keys are sorted deterministically via `canonicalStringify` from `privacyIntegrityService.js`, guaranteeing that receipts generated in different runtimes or parsed from exported formats yield identical digests.

### 2.2 Constant-Time Equality Check

Digests are verified using `constantTimeEqual` to prevent side-channel timing attacks when checking against tampered receipts:

```javascript
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
```

### 2.3 Dual Seal & Backward Compatibility

Existing tests and legacy workflows continue to receive the standard verification seal:
- **Legacy Seal:** `CB-SEAL-XXXX-XXXX` (maintained for backward compatibility).
- **SHA-256 Seal:** 64-character lowercase hex digest embedded into all receipts, ASCII text slips, and QR codes.
- If a receipt lacks a SHA-256 digest, `verifyReceiptIntegrity` gracefully falls back to validating the legacy polynomial seal (`status: 'LEGACY_VALID'`).

---

## 3. PII & Secret Scrubbing

Civic receipts are frequently printed, screenshotted, or shared via messaging apps. All applicant names, service names, and timeline step notes are processed through `minimizeForExternal()` (`src/utils/dataMinimization.js`):

- **Aadhaar Numbers:** `\b\d{4}\s?\d{4}\s?\d{4}\b` -> Redacted
- **PAN Cards:** `\b[A-Z]{5}[0-9]{4}[A-Z]\b` -> Redacted
- **Phone Numbers & Emails:** Scanned and minimized
- **Account Credentials & Auth Tokens:** Scrubbed automatically

---

## 4. Pure-SVG Scannable QR Matrix

Receipt verification payloads are encoded into pure SVG paths using `qrcode-generator`:
- **Payload Schema:**
  ```json
  {
    "id": "APP-10294-DL",
    "rec": "REC-APP-10294-DL",
    "seal": "CB-SEAL-9BD8-3964",
    "sha256": "eddafcb724ad5edb352621f791a75e1af3be437c4e37b4bd3e205b67793bcb3b"
  }
  ```
- **Vector Rendering:** Path strings (`M...h1v1h-1z`) are rendered natively within an `<svg>` element with zero external image requests, canvas overhead, or network dependencies.
- **Print Fidelity:** High-contrast `#0f172a` modules on pure white backgrounds ensure scannability from physical printouts.

---

## 5. Offline Interactive Verifier

The receipt modal includes an interactive tabbed interface:
1. **Receipt Slip View:**
   - Displays receipt details, SHA-256 badge, legacy seal, and scannable SVG QR code.
   - Quick actions: "Copy Text", "Print Slip", "Download Slip" (`.txt`), and "Download JSON" (`.json`).
2. **Verify Authenticity View:**
   - Input textarea accepting either an ASCII receipt slip or a JSON export dossier.
   - Cryptographic verification against canonical facts.
   - Distinct visual verdicts:
     - **Verified Authentic (Green):** Seal matches receipt facts; displays verified Reference ID, Service, Applicant, and Status.
     - **Tamper Warning (Red):** Cryptographic mismatch detected; alerts user that fields (such as dates, service, or applicant) were modified post-issuance.
     - **Invalid Format (Amber):** Missing statutory headers or corrupted input.

---

## 6. Verification Commands

Run unit tests and component tests:
```bash
npx vitest run src/services/submissionReceiptService.test.js src/components/tracking/TrackingReceiptModal.test.jsx src/pages/Track.test.jsx
```

Run linter:
```bash
npx eslint src/services/submissionReceiptService.js src/services/submissionReceiptService.test.js src/components/tracking/TrackingReceiptModal.jsx src/components/tracking/TrackingReceiptModal.test.jsx
```

Run security linter and audit check:
```bash
npm run lint:security
node scripts/security/audit-report.mjs --omit-dev --level high
```

Run production build:
```bash
npm run build
```
