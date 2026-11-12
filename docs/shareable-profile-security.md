# Cryptographic Shareable Profile Protection (#734)

## Overview

Civic-Help-Setu hardens citizen-controlled profile share links across [`src/services/shareableProfileService.js`](../src/services/shareableProfileService.js), [`src/components/profile/ShareableProfileModal.jsx`](../src/components/profile/ShareableProfileModal.jsx), and [`src/pages/SharedProfileView.jsx`](../src/pages/SharedProfileView.jsx) using pure client-side primitives in [`src/services/privacyIntegrityService.js`](../src/services/privacyIntegrityService.js) and [`src/utils/dataMinimization.js`](../src/utils/dataMinimization.js).

## Security Controls

1. **Fail-Closed CSPRNG Token & Salt Generation (`generateShareToken`)**
   - Uses `globalThis.crypto.getRandomValues` to issue 128-bit (32 hex character) share tokens and 16-byte per-link passcode salts.
   - Throws immediately when a CSPRNG is unavailable instead of falling back to `Math.random()`.
   - Uses `Object.prototype.hasOwnProperty.call` checks on token lookups to prevent `Object.prototype` key collisions (`toString`, `constructor`, `__proto__`).

2. **Recursive PII & Secret Scrubbing**
   - All projected snapshot text (`fullName`, `state`, `district`, `category`, `occupation`, `savedServices`, `applicationMilestones`) is scrubbed with `minimizeForExternal()` both before snapshot storage and during public projection.
   - Prevents accidental exposure of Aadhaar numbers, PAN cards, mobile numbers, emails, secret keys, or `SRV-` / `GRV-` / `TKN-` reference IDs embedded inside service or milestone descriptions.

3. **Canonical SHA-256 Snapshot Seal (`verifyShareIntegrity`)**
   - Signs `{ version: 1, token, userId, createdAt, profileSnapshot }` using `canonicalStringify` + `sha256Hex`.
   - Any post-creation tampering with `profileSnapshot` fields deterministically returns `status: "TAMPERED"` before releasing profile data.

4. **Salted Passcode Gating & Brute-Force Lockout (`PIN_REQUIRED`, `INVALID_PIN`, `LOCKED`)**
   - Optional viewer passcodes (`MIN_PASSCODE_LENGTH = 4`) are stored only as domain-separated salted SHA-256 digests (`passcodeSalt`, `passcodeHash`) and compared in constant time.
   - Exceeding `MAX_PIN_ATTEMPTS` (`5`) consecutive invalid attempts locks the token for `PIN_LOCKOUT_MS` (`15` minutes), blocking even valid passcodes until the lockout expires.

5. **Burn-After-Read & View-Quota Enforcement (`VIEW_LIMIT_REACHED`)**
   - Owners can configure `maxViews` (including single-use burn-after-read `1` view) from `ShareableProfileModal.jsx`.
   - `SharedProfileView.jsx` evaluates the token once on initial mount (avoiding effect double-consumption), tracks remaining views, and marks exhausted links inactive.

## Verification

```bash
npx vitest run src/services/shareableProfileService.test.js src/pages/SharedProfileView.test.jsx src/components/profile/ShareableProfileModal.test.jsx src/pages/Profile.test.jsx
npx eslint src/services/shareableProfileService.js src/services/shareableProfileService.test.js src/components/profile/ShareableProfileModal.jsx src/components/profile/ShareableProfileModal.test.jsx src/pages/SharedProfileView.jsx src/pages/SharedProfileView.test.jsx
npm run lint:security
node scripts/security/audit-report.mjs --omit-dev --level high
npm run build
```
