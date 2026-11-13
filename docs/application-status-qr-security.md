# Cryptographic Application Status QR Pass Protection (#739)

## Overview

Civic-Help-Setu secures citizen-controlled application status QR lookup passes across [`src/services/applicationStatusQrService.js`](../src/services/applicationStatusQrService.js), [`src/components/tracking/ApplicationStatusQrModal.jsx`](../src/components/tracking/ApplicationStatusQrModal.jsx), and [`src/pages/PublicApplicationStatusView.jsx`](../src/pages/PublicApplicationStatusView.jsx) using pure client-side primitives in [`src/services/privacyIntegrityService.js`](../src/services/privacyIntegrityService.js) and [`src/utils/dataMinimization.js`](../src/utils/dataMinimization.js).

## Security Controls

1. **Fail-Closed CSPRNG Token & Salt Generation (`generateStatusToken`)**
   - Uses `globalThis.crypto.getRandomValues` to issue 128-bit (32 hex character) status lookup tokens and 16-byte per-token passcode salts.
   - Fails closed immediately (throws) when a CSPRNG is unavailable instead of falling back to `Math.random()`.
   - Uses `Object.prototype.hasOwnProperty.call` guards on token lookups to prevent `Object.prototype` key collisions (`toString`, `constructor`, `__proto__`).

2. **Recursive PII & Secret Scrubbing**
   - All projected public fields (`serviceName`, `department`, `stage`, `milestones.label`, `expectedResolution`) are scrubbed with `minimizeForExternal()` before snapshot persistence and during public projection.
   - Prevents accidental exposure of Aadhaar numbers, PAN cards, mobile numbers, emails, secret credentials, or `SRV-` / `GRV-` / `TKN-` reference IDs embedded inside milestone notes.

3. **Canonical SHA-256 Snapshot Seal (`verifyStatusTokenIntegrity`)**
   - Signs `{ version: 1, token, applicationId, createdAt, publicData }` using `canonicalStringify` + `sha256Hex`.
   - Any post-creation tampering with `publicData` fields or milestone progression deterministically returns `status: "TAMPERED"` prior to exposing status data.

4. **Salted Passcode Gating & Brute-Force Lockout (`PIN_REQUIRED`, `INVALID_PIN`, `LOCKED`)**
   - Optional viewer passcodes (`MIN_PASSCODE_LENGTH = 4`) are stored exclusively as domain-separated salted SHA-256 digests (`passcodeSalt`, `passcodeHash`) and compared in constant time.
   - Exceeding `MAX_PIN_ATTEMPTS` (`5`) consecutive invalid attempts locks the QR pass for `PIN_LOCKOUT_MS` (`15` minutes), blocking even valid passcodes until the lockout window elapses.

5. **Burn-After-Read & View-Quota Enforcement (`VIEW_LIMIT_REACHED`)**
   - Applicants can configure `maxViews` (including single-use burn-after-read `1` view) from `ApplicationStatusQrModal.jsx`.
   - `PublicApplicationStatusView.jsx` verifies the token on mount, displays remaining view counts, and marks exhausted passes inactive.

## Verification

```bash
npx vitest run src/services/applicationStatusQrService.test.js src/pages/PublicApplicationStatusView.test.jsx src/components/tracking/ApplicationStatusQrModal.test.jsx
npx eslint src/services/applicationStatusQrService.js src/services/applicationStatusQrService.test.js src/components/tracking/ApplicationStatusQrModal.jsx src/components/tracking/ApplicationStatusQrModal.test.jsx src/pages/PublicApplicationStatusView.jsx src/pages/PublicApplicationStatusView.test.jsx
npm run lint:security
node scripts/security/audit-report.mjs --omit-dev --level high
npm run build
```
