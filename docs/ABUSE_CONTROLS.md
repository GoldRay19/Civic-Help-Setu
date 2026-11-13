# Abuse controls for public submissions

Issue #216. What accepts requests, what each one can trigger, and what limits it today.

## Inventory

| Entry point | Who can call it | Side effects | Control |
| --- | --- | --- | --- |
| `POST /api/firebase-token` (`api/firebase-token.js`) | anyone on the internet | Clerk session verification, a Clerk user lookup, a Firebase custom token | Limited per address (30 per minute) before Clerk is called, and per account (10 per minute) after. Concurrent requests from one account share one lookup and one mint. Over the limit: `429 { error: "rate_limited", retryAfterSeconds }` plus a `Retry-After` header |
| `POST /api/privacy-exports` (`api/privacy-exports.js`) | authenticated account with recent factor verification | short-lived account-bound JSON export record; metadata-only audit entry | Limited per address (20 per minute) and account (10 per minute). `GET /api/privacy-exports?token=...` also requires the same account session and consumes the link once |
| Firestore `errorReports`, `serviceSubmissions`, `barrierReports`, `bottleneckFeedback`, `communityAudits` (creates) | any session, or a signed-in account for audits | a `pending` record that an admin has to review | Not limited by this change, see below |
| Cloud Storage `vault/{uid}/...` | the owner | a stored file | Owner only, 5 MB limit, existing rules |

Ordinary workflow data still stays in browser storage. The Privacy Centre export route is the exception: it uses Firebase Admin for temporary export records and metadata-only audit records. The remaining Firebase report collections described below are not written by this endpoint.

## What is and is not covered

- **Covered:** the public API endpoints have explicit rate limits; privacy exports additionally verify recent Clerk factor authentication and consume download tokens atomically.
- **Per instance only.** Counters live in the memory of one function instance. That stops a script hammering one warm instance and removes accidental duplicates, but separate instances count separately, so it is not a global limit.
- **Client address.** Read only from `x-vercel-forwarded-for`, then `x-real-ip`, which Vercel sets. `x-forwarded-for` is not used, because a client can set it when those headers are absent. A request with no usable address skips the per-address limit (a shared bucket would let one caller exhaust it for everyone) and is still covered by the per-account limit.
- **Bounded memory has a cost.** Each limiter holds at most 5000 windows. When that many live windows exist, the oldest are dropped, so a caller using thousands of addresses can reset other callers' counters on that instance. This is another reason the limits are a speed bump, not a guarantee; a shared store would fix it.
- **Firestore creates are not throttled here.** Firestore security rules cannot count requests per caller, and duplicate detection there would need a write path through a server. When the app starts writing reports, the supported options are Firebase App Check (enforced on Firestore) and moving submissions behind a function that uses `createRateLimiter` and a stored idempotency key. That is left for the change that adds the writes, so it is not done speculatively now.
- **A global limit** needs a shared store (for example Upstash Redis or Vercel KV). None is configured, so none is claimed.

## Retry guidance

A `429` response always carries `Retry-After` (whole seconds, at least 1) and the same number as `retryAfterSeconds` in the body. Clients should wait that long and must not retry in a tight loop. The body never says which limit was hit.
