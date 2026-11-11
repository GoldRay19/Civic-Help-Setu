# DPDP Retention Enforcement, Consent-Withdrawal Cascade & Hash-Chained Audit Log

## Overview

Civic-Help-Setu implements local-first DPDP Act 2023 enforcement and cryptographic tamper-evidence across [`src/services/privacyIntegrityService.js`](../src/services/privacyIntegrityService.js), [`src/services/privacyConsentService.js`](../src/services/privacyConsentService.js), [`src/components/privacy/PrivacyConsentCenterModal.jsx`](../src/components/privacy/PrivacyConsentCenterModal.jsx), and [`src/pages/Privacy.jsx`](../src/pages/Privacy.jsx).

## Architecture

1. **Cryptographic Privacy Integrity (`src/services/privacyIntegrityService.js`)**
   - **`sha256Hex` & `canonicalStringify`**: Pure browser- and Node-compatible FIPS 180-4 SHA-256 implementation paired with order-independent canonical JSON serialization.
   - **Hash-Chained Audit Log (`createChainedAuditEntry`, `verifyPrivacyAuditLogIntegrity`)**: Every entry recorded via `recordPrivacyAuditLog` embeds monotonically increasing `sequence`, `prevHash` (anchored to `GENESIS_AUDIT_HASH`), and canonical `entryHash`. Verification catches modified fields (`HASH_MISMATCH`), deleted/reordered entries (`CHAIN_BREAK`), unchained insertions (`MISSING_HASH`), and small-log ancestor truncation (`MISSING_ANCESTOR`), while supporting legacy unchained entries without false failures.
   - **Signed Data Export Dossiers (`signExportPayload`, `verifyExportedDataIntegrity`)**: `exportUserData` embeds a canonical `exportMetadata.integrityDigest` (`SHA-256`) that citizens can verify against uploaded or pasted export JSON.

2. **Consent-Withdrawal Cascade & Retention Enforcement (`src/services/privacyConsentService.js`)**
   - **`CONSENT_CATEGORY_STORAGE_MAP`**: Explicitly maps optional categories (`offline_cache`, `chat_session_memory`, `personalization`, `analytics_telemetry`) to their registered keys in `USER_DATA_STORES` and `USER_DATA_SESSION_STORES` without introducing unlisted `localStorage` keys.
   - **Automatic Revocation Purge (`revokeConsentAndPurge`, `updateConsentPreference`)**: Withdrawing consent for an optional category deletes its dependent non-essential stores and appends a `CONSENT_REVOCATION_PURGE` audit event, while preserving mandatory user records (Vault, tracked applications).
   - **Retention TTL Enforcement (`getRetentionPolicyStatus`, `enforceRetentionPolicies`)**: Evaluates stored record timestamps against `CONSENT_CATEGORIES[id].retentionDays` (`14`, `30`, `60`, `90`), clears expired non-essential stores, prunes stale messages individually from mixed chat histories, and logs a `RETENTION_POLICY_ENFORCED` event.

3. **UI Integration (`Privacy.jsx`, `PrivacyConsentCenterModal.jsx`)**
   - Live SHA-256 audit-chain verification status banners and sequence/hash previews.
   - Retention compliance indicator and one-click **"Enforce Retention"** / **"Enforce Retention Policies Now"** cleanup controls.
   - Interactive JSON dossier integrity verifier in the Data Export tab.

## Verification

```bash
npx vitest run src/services/privacyIntegrityService.test.js src/services/privacyConsentService.test.js src/services/vaultStorage.test.js src/utils/dataMinimization.test.js src/pages/Privacy.test.jsx src/components/privacy/PrivacyConsentCenterModal.test.jsx
npx eslint src/services/privacyIntegrityService.js src/services/privacyIntegrityService.test.js src/services/privacyConsentService.js src/services/privacyConsentService.test.js src/components/privacy/PrivacyConsentCenterModal.jsx src/components/privacy/PrivacyConsentCenterModal.test.jsx src/pages/Privacy.jsx src/pages/Privacy.test.jsx
npm run lint:security
node scripts/security/audit-report.mjs --omit-dev --level high
npm run build
```
