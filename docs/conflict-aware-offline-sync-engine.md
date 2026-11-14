# Conflict-Aware Offline-First Sync Engine for Citizen Draft Workflows (#775)

## Overview & Problem Statement

Civic Help Setu provides a dedicated, production-grade, conflict-aware offline-first sync engine for citizen draft workflows (checklists, draft applications, and saved notes).
Intermittent mobile connectivity is a standard reality for citizens across rural, suburban, and urban civic offices. Previously, concurrent edits or reconnecting offline clients ran the risk of silently overwriting newer data.

This engine introduces:
1. **Local Persistent Operation Queue**: Staging mutations in `offline_operations` during disconnection.
2. **Monotonic Revisions**: Monotonically incrementing integer revisions (`record_revisions`) eliminating clock-skew vulnerabilities.
3. **Three-Way Conflict Awareness**: Diffs `Base`, `Local`, and `Remote` snapshots to deterministically merge safe, non-overlapping updates (such as checklist item set unions), while halting and surfacing genuine free-text divergence for human resolution.
4. **Idempotency & Deduplication**: Unique cryptographic idempotency keys preventing duplicate submissions and replay attacks.
5. **Deletion Tombstones**: Tombstones (`tombstones`) preventing reconnected offline clients from accidentally resurrecting deleted drafts.
6. **User-Visible Merge Choices**: Explainable conflict summaries and an interactive three-way merge interface.

---

## Architecture & Data Flow

```
[ Citizen Browser / Client ]
      │
      ├──> [ CitizenDraftService ] (Domain State & Validation)
      │          │
      │          ├──> Local Citizen Drafts Store (`civicbridge_citizen_drafts_v1`)
      │          └──> Enqueue Mutation (`civicbridge_offline_operations_v1`)
      │
[ Network State Listener / Sync Trigger ]
      │
      ├──> Offline? ──> Operations safely staged locally with idempotency keys
      └──> Reconnected / Online?
                 │
                 ▼
       [ CitizenDraftSyncEngine: processSyncQueue() ]
                 │
                 ├── 1. Check Deletion Tombstones (`civicbridge_tombstones_v1`)
                 ├── 2. Fetch Authoritative Revision (`civicbridge_record_revisions_v1`)
                 │
                 ├── Revision Match? (remoteRev === baseRev)
                 │       └──> Apply mutation & Save Revision (Rev + 1)
                 │
                 └── Revision Mismatch? (remoteRev > baseRev)
                         │
                         ▼
             [ 3-Way Diff Engine: detectConflicts() ]
                         │
                         ├── Safe Non-Overlapping / Array Union?
                         │       └──> Auto-Merge & Commit New Revision
                         │
                         └── Divergent Free Text / Conflict Detected?
                                 │
                                 ├── Halt Auto-Commit
                                 ├── Persist `ConflictRecord` (`civicbridge_conflict_records_v1`)
                                 └── Surface to User in Conflict Review Workspace
```

---

## Normalized Collections & Data Models

### 1. `SyncOperation` (`civicbridge_offline_operations_v1`)
| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Unique operation identifier |
| `entityType` | `enum` | `'checklist' \| 'application_draft' \| 'saved_note'` |
| `entityId` | `string` | Target draft record ID |
| `operationType` | `enum` | `'INSERT' \| 'UPDATE' \| 'DELETE'` |
| `payload` | `object` | Sanitized delta / entity payload |
| `baseRevision` | `number` | Revision number upon which this mutation was based |
| `idempotencyKey` | `string` | Unique key preventing duplicate or replayed execution |
| `status` | `enum` | `'PENDING' \| 'IN_FLIGHT' \| 'COMMITTED' \| 'FAILED'` |
| `retryCount` | `number` | Number of attempted synchronization flushes |
| `lastAttemptAt` | `ISO string` | Timestamp of last synchronization attempt |
| `createdAt` | `ISO string` | Time mutation was staged |
| `schemaVersion` | `number` | Schema version (`1`) |

### 2. `RecordRevision` (`civicbridge_record_revisions_v1`)
| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Unique revision identifier |
| `recordId` | `string` | Target entity record ID |
| `entityType` | `enum` | Entity category |
| `revisionNumber` | `number` | Monotonically increasing revision number |
| `checksum` | `string` (hex) | Deterministic FNV-1a / hash of snapshot data |
| `snapshotData` | `object` | Full snapshot of record state at this revision |
| `authorId` | `string` | User ID of actor who made the change |
| `jurisdictionId` | `string` | Administrative boundary |
| `createdAt` | `ISO string` | Timestamp revision was committed |

### 3. `ConflictRecord` (`civicbridge_conflict_records_v1`)
| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Conflict identifier |
| `recordId` | `string` | Target draft record ID |
| `baseRevision` | `number` | Common ancestor revision number |
| `localRevision` | `number` | Client revision |
| `remoteRevision` | `number` | Authoritative server revision |
| `localData` | `object` | Local state on device |
| `remoteData` | `object` | Server state |
| `conflictFields` | `string[]` | Specific properties where values diverged |
| `explanation` | `object` | Ruleset version, feature window, rationale, and influencing fields |
| `resolutionStrategy` | `enum` | `'MANUAL_MERGE' \| 'KEEP_LOCAL' \| 'KEEP_REMOTE'` |
| `status` | `enum` | `'UNRESOLVED' \| 'RESOLVED'` |

### 4. `DeviceCursor` (`civicbridge_device_cursors_v1`)
| Field | Type | Description |
|---|---|---|
| `deviceId` | `string` | Client device identifier |
| `entityType` | `string` | Synced entity type |
| `lastSyncedRevision` | `number` | High-water mark revision received by this device |
| `lastSyncedAt` | `ISO string` | Last successful sync timestamp |

### 5. `Tombstone` (`civicbridge_tombstones_v1`)
| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Unique tombstone identifier |
| `recordId` | `string` | Deleted record ID |
| `entityType` | `string` | Entity type |
| `deletedAt` | `ISO string` | Time of deletion |
| `deletedBy` | `string` | User ID |
| `reason` | `string` | Reason for deletion |

---

## Intelligence & Bounded Merge Heuristics

1. **Deterministic Safe Field Rules**:
   - **Checklist Set Union**: When two clients add items concurrently to a checklist, distinct items are combined via deterministic set union without requiring manual intervention.
   - **Disjoint Scalar Properties**: If Local edits `contactNumber` and Remote edits `jurisdictionOffice`, both changes are applied automatically into the merged snapshot.
2. **Strict User Resolution for Free Text & Sensitive Fields**:
   - Conflicting free-text fields (`notes`, `description`, `applicantName`, `remarks`) **never silently choose a winner**.
   - Generates an explainable recommendation containing:
     - `rulesetVersion`: e.g. `draft-merge-ruleset-v1.0.0`
     - `inputFeatureWindow`: Timestamps, key counts, and revision diffs.
     - `rationale`: Plain-language explanation of why conflict occurred and what changed.
     - `influencingFields`: Array of divergent properties.
3. **Human-in-the-Loop Controls**:
   - Authorized citizen or operator can select:
     - **Keep Local**: Overwrite server revision with client copy.
     - **Keep Server**: Discard local draft edits.
     - **Field-by-Field Merge**: Interactively pick local or remote values for each conflicting property.

---

## Security, Privacy & Threat Modeling

1. **Replay & Duplicate Submission**:
   - Every operation is issued with an unforgeable `idempotencyKey`. If an offline client flushes the same queue item multiple times during intermittent handoffs, duplicates are recognized and skipped.
2. **Clock Skew Resistance**:
   - Concurrency is evaluated strictly against monotonic `revisionNumber` integers rather than client wall-clock timestamps.
3. **Actor Scope & Authorization**:
   - Citizens can only read or mutate drafts created under their own `actorId`.
   - Operators and administrators cannot view private drafts unless explicitly escalated with an audit log entry.
4. **Data Sanitization & Payload Boundaries**:
   - All string values pass through `sanitizeTextFields` to prevent stored XSS attacks.
   - Maximum operation payload is capped at 500 KiB (well below the 900 KiB storage threshold).
5. **Session Logout Wipe**:
   - `wipeLocalDraftData()` purges local drafts, operation queues, and conflict records upon user logout.

---

## Operational Limits & Fallback

| Limit | Value | Behavior on Exceeded |
|---|---|---|
| Max Queue Size | 100 operations | Throws `ERR_QUEUE_FULL`; prompts user to sync or clear |
| Max Draft Payload | 500 KiB | Throws `ERR_PAYLOAD_TOO_LARGE` |
| Local Storage Quota | ~5 MB | Gracefully catches `QuotaExceededError` and surfaces recoverable error |
| Offline Fallback | 100% Deterministic | Operates completely client-side without external network or AI dependencies |

---

## Migrations & Rollback Strategy

1. **Forward Migration**:
   - Version metadata (`schemaVersion: 1`) is stamped on all records.
   - Existing legacy checklists (`civicbridge_checklists`) and form drafts (`civicbridge_form_drafts`) are preserved and can be staged into normalized draft entities on demand.
2. **Rollback Strategy**:
   - In the event of schema migration failure, storage keys are version-isolated (`_v1`). Previous data versions remain untouched in local storage.

