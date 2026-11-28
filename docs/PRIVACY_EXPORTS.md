# Privacy Centre exports

The Privacy Centre at `/privacy#privacy-centre` previews five categories: profile, saved
services, journey metadata, checklist progress, and consent history. The JSON document
uses schema version `1.0.0`, documented in
[`privacy-export.schema.json`](./privacy-export.schema.json).

## Human-readable index

| JSON path | Description |
| --- | --- |
| `exportVersion` | Semantic version of the export schema. |
| `generatedAt` | UTC export-generation time. |
| `user.id` | Account identifier from the verified Clerk session; never accepted from the request body. |
| `meta.platform` | Product that generated the export. |
| `meta.categories` | Categories selected by the account owner. |
| `meta.recordCount` | Count of exported records. |
| `meta.vaultMetadataIncluded` | Whether the separate vault opt-in and unlock were completed. |
| `meta.security` | Explicit confirmation that secrets and vault binaries are excluded. |
| `data.profile` | Server-resolved name, primary email, and optional profile fields. |
| `data.savedServices[]` | Owner-tagged saved service identifiers, folder, notes, priority, status and dates. |
| `data.journeyMetadata[]` | Owner-tagged journey/handoff identifiers, title, dates and progress counts; no handoff token. |
| `data.checklistProgress[]` | Owner-tagged checklist identifiers, checked labels, revision and update time. |
| `data.consentHistory[]` | Consent changes whose audit actor matches the authenticated account. |
| `data.vaultDocumentMetadata[]` | Optional document type/category/issuer/dates/verification metadata; no document number or file. |

Empty arrays mean no attributable account-owned records were available in that category.
Legacy browser records without an owner identifier are deliberately omitted because the
application cannot safely infer which account created them.

## CSV format

The download can also be saved as CSV. The browser converts the securely downloaded JSON, so
the authorisation, field allowlists and single-use link are the same for both formats.

- One table with the columns `category`, `record`, `field` and `value`; list fields have one
  row per item. `user` and `meta` are only in the JSON file.
- Every cell is quoted. Text that a spreadsheet would read as a formula (starting with `=`,
  `+`, `-`, `@`, a tab or a carriage return) is prefixed with an apostrophe.
- The file starts with a UTF-8 byte order mark so non-English text displays correctly.

## Security and lifecycle

- Both export creation and download require a Clerk session whose `fva` factor-verification
  ages are at most five minutes old. The export account ID is derived only from verified
  session claims.
- Create uses an opaque random token; only its SHA-256 digest is stored. The link is bound
  to the account, expires after five minutes, and is consumed atomically once. Download
  requires the same authenticated account. Consuming deletes the stored payload; Firestore
  TTL is enabled on `privacyExports.expiresAt` for expired/unconsumed records.
- Export payloads are held temporarily in the server-only Firestore collection
  `privacyExports`. `privacyExportAudit` records only the account id, action, category
  identifiers, record count, byte count and whether vault metadata was included. Export
  content is never written to audit records or application logs.
- Server-side field allowlists are applied again before storage. Documents larger than
  900 KiB are rejected. Both collections are inaccessible to browser clients by Firestore
  rules.
- Vault metadata is off by default. It requires a separate checkbox, at-rest vault
  encryption, and successful passphrase unlock. Raw files, encrypted envelopes, document
  numbers and vault credentials are never included.
- Direct browser exports from older UI helpers are disabled. The Privacy Centre is the
  supported export path.

## Deployment

The Vercel function requires the existing server-only `CLERK_SECRET_KEY` and
`FIREBASE_SERVICE_ACCOUNT` variables. Enable Firestore TTL for the `expiresAt` field in
`privacyExports` when deploying the updated `firebase/firestore.indexes.json`. Requests
fail closed when either server integration is unavailable.
