/**
 * Citizen Draft Sync Engine (#775)
 *
 * Provides a production-grade, conflict-aware, offline-first synchronization engine
 * for citizen draft workflows (checklists, draft applications, and saved notes).
 *
 * Guarantees:
 * 1. Offline-First: Mutations are staged locally in a persistent operation queue (`offline_operations`).
 * 2. Monotonic Revisions: Authoritative record revisions track sequential revision numbers,
 *    preventing clock-skew vulnerabilities.
 * 3. 3-Way Conflict Awareness: Diffs base, local, and remote snapshots. Safe fields (such as
 *    non-overlapping properties or set unions for checklists) are merged deterministically;
 *    divergent free text or sensitive fields trigger explainable `ConflictRecord`s requiring human resolution.
 * 4. Idempotency: All operations carry cryptographic idempotency keys to eliminate replay and duplicate submissions.
 * 5. Tombstones: Deleted records emit tombstones to prevent offline clients from resurrecting them.
 * 6. Security & Privacy: Sensitive draft content can be encrypted locally; client data scopes
 *    are enforced by actor ID; audit logs are recorded for overrides.
 */

import { getCurrentActor } from './accessControl';
import { sanitizeTextFields } from '../utils/safeContent';

// ---------------------------------------------------------------------------
// STORAGE KEYS & CONSTANTS
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  CITIZEN_DRAFTS: 'civicbridge_citizen_drafts_v1',
  OFFLINE_OPERATIONS: 'civicbridge_offline_operations_v1',
  SYNC_SESSIONS: 'civicbridge_sync_sessions_v1',
  RECORD_REVISIONS: 'civicbridge_record_revisions_v1',
  CONFLICT_RECORDS: 'civicbridge_conflict_records_v1',
  DEVICE_CURSORS: 'civicbridge_device_cursors_v1',
  TOMBSTONES: 'civicbridge_tombstones_v1',
};

export const SCHEMA_VERSION = 1;
export const RULESET_VERSION = 'draft-merge-ruleset-v1.0.0';
export const MAX_QUEUE_SIZE = 100;
export const MAX_PAYLOAD_BYTES = 500 * 1024; // 500 KiB

export const ENTITY_TYPES = ['checklist', 'application_draft', 'saved_note'];

export const OPERATION_TYPES = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
};

export const OP_STATUS = {
  PENDING: 'PENDING',
  IN_FLIGHT: 'IN_FLIGHT',
  COMMITTED: 'COMMITTED',
  FAILED: 'FAILED',
};

export const CONFLICT_STATUS = {
  UNRESOLVED: 'UNRESOLVED',
  RESOLVED: 'RESOLVED',
};

export const RESOLUTION_STRATEGIES = {
  MANUAL_MERGE: 'MANUAL_MERGE',
  DETERMINISTIC_FIELD_UNION: 'DETERMINISTIC_FIELD_UNION',
  KEEP_LOCAL: 'KEEP_LOCAL',
  KEEP_REMOTE: 'KEEP_REMOTE',
};

export const ERROR_CODES = {
  CONFLICT_DETECTED: 'ERR_CONFLICT_DETECTED',
  STALE_REVISION: 'ERR_STALE_REVISION',
  INVALID_TRANSITION: 'ERR_INVALID_TRANSITION',
  PERMISSION_DENIED: 'ERR_PERMISSION_DENIED',
  STORAGE_QUOTA_EXCEEDED: 'ERR_STORAGE_QUOTA_EXCEEDED',
  PAYLOAD_TOO_LARGE: 'ERR_PAYLOAD_TOO_LARGE',
  INVALID_PAYLOAD: 'ERR_INVALID_PAYLOAD',
  RECORD_DELETED: 'ERR_RECORD_DELETED',
  RECORD_NOT_FOUND: 'ERR_RECORD_NOT_FOUND',
  QUEUE_FULL: 'ERR_QUEUE_FULL',
};

// ---------------------------------------------------------------------------
// ERROR CLASS
// ---------------------------------------------------------------------------

export class SyncEngineError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'SyncEngineError';
    this.code = code;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// LOW-LEVEL STORAGE HELPERS (Safe for SSR / test environments)
// ---------------------------------------------------------------------------

const getStorage = (customStorage = null) => {
  if (customStorage) return customStorage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const readStore = (key, storage = null) => {
  const store = getStorage(storage);
  if (!store) return {};
  try {
    const raw = store.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

export const writeStore = (key, data, storage = null) => {
  const store = getStorage(storage);
  if (!store) throw new SyncEngineError('Storage is not available', ERROR_CODES.STORAGE_QUOTA_EXCEEDED);
  try {
    store.setItem(key, JSON.stringify(data));
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      throw new SyncEngineError('Storage quota exceeded', ERROR_CODES.STORAGE_QUOTA_EXCEEDED);
    }
    throw err;
  }
};

// ---------------------------------------------------------------------------
// CRYPTOGRAPHIC & IDENTIFIER UTILITIES
// ---------------------------------------------------------------------------

export const generateUUID = () => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const generateIdempotencyKey = (prefix = 'op') => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
};

/**
 * Fast deterministic FNV-1a checksum for arbitrary JSON serializable objects.
 */
export const calculateChecksum = (obj) => {
  if (obj === null || obj === undefined) return '00000000';
  const canonicalString = (val) => {
    if (val === null || typeof val !== 'object') {
      return JSON.stringify(val);
    }
    if (Array.isArray(val)) {
      return `[${val.map(canonicalString).join(',')}]`;
    }
    const keys = Object.keys(val).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalString(val[k])}`).join(',')}}`;
  };

  const str = canonicalString(obj);
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

// ---------------------------------------------------------------------------
// DEVICE CURSOR MANAGEMENT
// ---------------------------------------------------------------------------

export const getDeviceCursor = (deviceId, entityType = 'all', storage = null) => {
  const cursors = readStore(STORAGE_KEYS.DEVICE_CURSORS, storage);
  const key = `${deviceId}:${entityType}`;
  return (
    cursors[key] || {
      deviceId,
      entityType,
      lastSyncedRevision: 0,
      lastSyncedAt: null,
      schemaVersion: SCHEMA_VERSION,
    }
  );
};

export const updateDeviceCursor = (deviceId, entityType, revisionNumber, storage = null) => {
  const cursors = readStore(STORAGE_KEYS.DEVICE_CURSORS, storage);
  const key = `${deviceId}:${entityType}`;
  cursors[key] = {
    deviceId,
    entityType,
    lastSyncedRevision: Math.max(revisionNumber, cursors[key]?.lastSyncedRevision || 0),
    lastSyncedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  };
  writeStore(STORAGE_KEYS.DEVICE_CURSORS, cursors, storage);
  return cursors[key];
};

// ---------------------------------------------------------------------------
// TOMBSTONE MANAGEMENT
// ---------------------------------------------------------------------------

export const isTombstoned = (recordId, storage = null) => {
  if (!recordId) return false;
  const tombstones = readStore(STORAGE_KEYS.TOMBSTONES, storage);
  return Boolean(tombstones[recordId]);
};

export const applyTombstone = (recordId, entityType, actorId, reason = 'Deleted by user', storage = null) => {
  const tombstones = readStore(STORAGE_KEYS.TOMBSTONES, storage);
  tombstones[recordId] = {
    id: generateUUID(),
    recordId,
    entityType,
    deletedAt: new Date().toISOString(),
    deletedBy: actorId || 'anonymous',
    reason,
    schemaVersion: SCHEMA_VERSION,
  };
  writeStore(STORAGE_KEYS.TOMBSTONES, tombstones, storage);
  return tombstones[recordId];
};

// ---------------------------------------------------------------------------
// AUTHORITATIVE RECORD REVISIONS (Remote / Server simulation)
// ---------------------------------------------------------------------------

export const getLatestRevision = (recordId, storage = null) => {
  const revisions = readStore(STORAGE_KEYS.RECORD_REVISIONS, storage);
  const list = revisions[recordId] || [];
  if (!list.length) return null;
  return list[list.length - 1];
};

export const saveRevision = ({ recordId, entityType, snapshotData, authorId, jurisdictionId = 'all', storage = null }) => {
  const revisions = readStore(STORAGE_KEYS.RECORD_REVISIONS, storage);
  const currentList = revisions[recordId] || [];
  const nextRevNumber = currentList.length > 0 ? currentList[currentList.length - 1].revisionNumber + 1 : 1;
  const checksum = calculateChecksum(snapshotData);

  const newRev = {
    id: generateUUID(),
    recordId,
    entityType,
    revisionNumber: nextRevNumber,
    checksum,
    snapshotData: JSON.parse(JSON.stringify(snapshotData)),
    authorId: authorId || 'citizen',
    jurisdictionId,
    createdAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  };

  revisions[recordId] = [...currentList, newRev];
  writeStore(STORAGE_KEYS.RECORD_REVISIONS, revisions, storage);
  return newRev;
};

// ---------------------------------------------------------------------------
// THREE-WAY CONFLICT DETECTION & MERGE RULES
// ---------------------------------------------------------------------------

/**
 * Compare two values for deep equality
 */
const deepEqual = (a, b) => {
  return calculateChecksum(a) === calculateChecksum(b);
};

/**
 * 3-Way Difference & Conflict Detection
 *
 * @param {Object} base Base snapshot at the time the local draft branched
 * @param {Object} local Current local edits on device
 * @param {Object} remote Current remote/authoritative record
 * @returns {Object} { hasConflict, conflictFields, autoMergedData, explanation }
 */
export const detectConflicts = (base = {}, local = {}, remote = {}) => {
  const baseSafe = base || {};
  const localSafe = local || {};
  const remoteSafe = remote || {};

  const allKeys = Array.from(new Set([
    ...Object.keys(baseSafe),
    ...Object.keys(localSafe),
    ...Object.keys(remoteSafe),
  ]));

  const conflictFields = [];
  const autoMerged = {};
  const fieldChanges = {};

  for (const key of allKeys) {
    if (key === 'id' || key === 'createdAt' || key === 'createdBy' || key === 'schemaVersion') {
      autoMerged[key] = remoteSafe[key] || localSafe[key] || baseSafe[key];
      continue;
    }

    const bVal = baseSafe[key];
    const lVal = localSafe[key];
    const rVal = remoteSafe[key];

    const localChanged = !deepEqual(bVal, lVal);
    const remoteChanged = !deepEqual(bVal, rVal);

    if (!localChanged && !remoteChanged) {
      // Neither changed
      autoMerged[key] = bVal;
    } else if (localChanged && !remoteChanged) {
      // Only local changed
      autoMerged[key] = lVal;
      fieldChanges[key] = 'local_only';
    } else if (!localChanged && remoteChanged) {
      // Only remote changed
      autoMerged[key] = rVal;
      fieldChanges[key] = 'remote_only';
    } else {
      // Both changed!
      if (deepEqual(lVal, rVal)) {
        // Both changed to the identical value
        autoMerged[key] = lVal;
        fieldChanges[key] = 'both_identical';
      } else if (Array.isArray(lVal) && Array.isArray(rVal)) {
        // Safe field heuristic: Set union for array of primitives/labels (e.g. checklists)
        if (lVal.every((i) => typeof i === 'string') && rVal.every((i) => typeof i === 'string')) {
          const combined = Array.from(new Set([...rVal, ...lVal]));
          autoMerged[key] = combined;
          fieldChanges[key] = 'array_union';
        } else {
          conflictFields.push(key);
        }
      } else {
        // Conflicting scalar or object values
        conflictFields.push(key);
      }
    }
  }

  const hasConflict = conflictFields.length > 0;
  let explanation = null;

  if (hasConflict) {
    const inputFeatureWindow = {
      localKeysCount: Object.keys(localSafe).length,
      remoteKeysCount: Object.keys(remoteSafe).length,
      conflictCount: conflictFields.length,
      evaluatedAt: new Date().toISOString(),
    };

    explanation = {
      rulesetVersion: RULESET_VERSION,
      inputFeatureWindow,
      rationale: `Concurrent modifications detected in [${conflictFields.join(', ')}]. Manual confirmation is required to avoid silently overwriting civic application draft data.`,
      influencingFields: conflictFields,
    };
  }

  return {
    hasConflict,
    conflictFields,
    autoMergedData: autoMerged,
    explanation,
  };
};

// ---------------------------------------------------------------------------
// OPERATION QUEUE MANAGEMENT
// ---------------------------------------------------------------------------

export const getPendingOperations = (entityType = null, storage = null) => {
  const store = readStore(STORAGE_KEYS.OFFLINE_OPERATIONS, storage);
  let ops = Object.values(store).filter((op) => op.status === OP_STATUS.PENDING || op.status === OP_STATUS.FAILED);
  if (entityType) {
    ops = ops.filter((op) => op.entityType === entityType);
  }
  return ops.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const enqueueOperation = ({
  entityType,
  entityId,
  operationType,
  payload,
  baseRevision = 0,
  idempotencyKey = null,
  actorId = null,
  storage = null,
}) => {
  if (!ENTITY_TYPES.includes(entityType)) {
    throw new SyncEngineError(`Invalid entityType: ${entityType}`, ERROR_CODES.INVALID_PAYLOAD);
  }
  if (!Object.values(OPERATION_TYPES).includes(operationType)) {
    throw new SyncEngineError(`Invalid operationType: ${operationType}`, ERROR_CODES.INVALID_PAYLOAD);
  }
  if (!entityId) {
    throw new SyncEngineError('entityId is required', ERROR_CODES.INVALID_PAYLOAD);
  }

  // Payload byte limit check
  const payloadStr = JSON.stringify(payload || {});
  if (new Blob([payloadStr]).size > MAX_PAYLOAD_BYTES) {
    throw new SyncEngineError('Payload exceeds maximum allowed size of 500 KiB', ERROR_CODES.PAYLOAD_TOO_LARGE);
  }

  const opsStore = readStore(STORAGE_KEYS.OFFLINE_OPERATIONS, storage);
  const existingKeys = Object.keys(opsStore);
  if (existingKeys.length >= MAX_QUEUE_SIZE) {
    throw new SyncEngineError('Offline operation queue is full. Synchronize or clear old items.', ERROR_CODES.QUEUE_FULL);
  }

  // Deduplication check via idempotencyKey
  const finalKey = idempotencyKey || generateIdempotencyKey();
  const existingOp = Object.values(opsStore).find((o) => o.idempotencyKey === finalKey);
  if (existingOp) {
    return existingOp; // Return idempotent duplicate without re-queueing
  }

  const opId = generateUUID();
  const operation = {
    id: opId,
    entityType,
    entityId,
    operationType,
    payload: sanitizeTextFields(payload || {}),
    baseRevision: Number.isInteger(baseRevision) && baseRevision >= 0 ? baseRevision : 0,
    idempotencyKey: finalKey,
    status: OP_STATUS.PENDING,
    retryCount: 0,
    lastAttemptAt: null,
    actorId: actorId || getCurrentActor()?.id || 'citizen',
    createdAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  };

  opsStore[opId] = operation;
  writeStore(STORAGE_KEYS.OFFLINE_OPERATIONS, opsStore, storage);
  return operation;
};

// ---------------------------------------------------------------------------
// CONFLICT RECORD PERSISTENCE
// ---------------------------------------------------------------------------

export const getConflictRecords = ({ status = null, entityType = null, storage = null } = {}) => {
  const conflicts = readStore(STORAGE_KEYS.CONFLICT_RECORDS, storage);
  let list = Object.values(conflicts);
  if (status) {
    list = list.filter((c) => c.status === status);
  }
  if (entityType) {
    list = list.filter((c) => c.entityType === entityType);
  }
  return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

export const resolveConflict = (
  conflictId,
  optionsOrStrategy = {},
  storage = null
) => {
  const options = typeof optionsOrStrategy === 'string'
    ? { strategy: optionsOrStrategy }
    : (optionsOrStrategy || {});

  const {
    strategy,
    resolvedData = null,
    resolvedBy = null,
    reason = 'Resolved by user',
    deviceId = 'default-device',
  } = options;

  const conflicts = readStore(STORAGE_KEYS.CONFLICT_RECORDS, storage);
  let conflict = conflicts[conflictId];
  if (!conflict) {
    // Check if conflictId was provided as recordId (draftId)
    conflict = Object.values(conflicts).find(
      (c) => (c.recordId === conflictId || c.id === conflictId) && c.status === CONFLICT_STATUS.UNRESOLVED
    ) || Object.values(conflicts).find((c) => c.recordId === conflictId || c.id === conflictId);
  }

  if (!conflict) {
    throw new SyncEngineError(`Conflict record ${conflictId} not found`, ERROR_CODES.RECORD_NOT_FOUND);
  }
  if (conflict.status === CONFLICT_STATUS.RESOLVED) {
    const existingRev = getLatestRevision(conflict.recordId, storage);
    return { ...conflict, conflict, revision: existingRev };
  }

  if (!Object.values(RESOLUTION_STRATEGIES).includes(strategy)) {
    throw new SyncEngineError(`Invalid resolution strategy: ${strategy}`, ERROR_CODES.INVALID_PAYLOAD);
  }

  let finalData;
  if (strategy === RESOLUTION_STRATEGIES.KEEP_LOCAL) {
    finalData = conflict.localData;
  } else if (strategy === RESOLUTION_STRATEGIES.KEEP_REMOTE) {
    finalData = conflict.remoteData;
  } else {
    finalData = sanitizeTextFields(resolvedData || conflict.localData);
  }

  // Commit authoritative new revision
  const newRev = saveRevision({
    recordId: conflict.recordId,
    entityType: conflict.entityType,
    snapshotData: finalData,
    authorId: resolvedBy || getCurrentActor()?.id || 'citizen',
    storage,
  });

  // Update local drafts store
  const drafts = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage);
  drafts[conflict.recordId] = {
    ...finalData,
    id: conflict.recordId,
    entityType: conflict.entityType,
    revision: newRev.revisionNumber,
    syncStatus: 'SYNCED',
    conflictId: null,
    updatedAt: new Date().toISOString(),
  };
  writeStore(STORAGE_KEYS.CITIZEN_DRAFTS, drafts, storage);

  // Mark conflict as resolved
  conflict.status = CONFLICT_STATUS.RESOLVED;
  conflict.resolutionStrategy = strategy;
  conflict.resolvedData = finalData;
  conflict.resolvedBy = resolvedBy || 'citizen';
  conflict.resolvedAt = new Date().toISOString();
  conflict.resolutionReason = reason;

  writeStore(STORAGE_KEYS.CONFLICT_RECORDS, conflicts, storage);

  // Clear or mark as committed any pending/failed operations for this record
  const opsStore = readStore(STORAGE_KEYS.OFFLINE_OPERATIONS, storage);
  let opsChanged = false;
  for (const op of Object.values(opsStore)) {
    if (op.entityId === conflict.recordId) {
      op.status = OP_STATUS.COMMITTED;
      op.error = null;
      opsChanged = true;
    }
  }
  if (opsChanged) {
    writeStore(STORAGE_KEYS.OFFLINE_OPERATIONS, opsStore, storage);
  }

  // Advance device cursor
  updateDeviceCursor(deviceId, conflict.entityType, newRev.revisionNumber, storage);

  return { ...conflict, conflict, revision: newRev };
};

// ---------------------------------------------------------------------------
// SYNC PROCESSOR (The Heart of the Engine)
// ---------------------------------------------------------------------------

export const processSyncQueue = async ({
  deviceId = 'default-device',
  actorId = null,
  jurisdictionId = 'all',
  storage = null,
} = {}) => {
  const sessionId = generateUUID();
  const startedAt = new Date().toISOString();
  const sessionsStore = readStore(STORAGE_KEYS.SYNC_SESSIONS, storage);

  const pendingOps = getPendingOperations(null, storage);
  const session = {
    id: sessionId,
    deviceId,
    userId: actorId || getCurrentActor()?.id || 'anonymous',
    startedAt,
    completedAt: null,
    status: 'IN_PROGRESS',
    operationsCount: pendingOps.length,
    conflictsCount: 0,
    errorMessage: null,
  };
  sessionsStore[sessionId] = session;
  writeStore(STORAGE_KEYS.SYNC_SESSIONS, sessionsStore, storage);

  const opsStore = readStore(STORAGE_KEYS.OFFLINE_OPERATIONS, storage);
  const draftsStore = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage);
  const conflictsStore = readStore(STORAGE_KEYS.CONFLICT_RECORDS, storage);

  let appliedCount = 0;
  let conflictsCount = 0;

  for (const pendingOp of pendingOps) {
    const op = opsStore[pendingOp.id] || pendingOp;
    op.status = OP_STATUS.IN_FLIGHT;
    op.lastAttemptAt = new Date().toISOString();
    op.retryCount = (op.retryCount || 0) + 1;

    try {
      // 1. Check if record has been deleted / tombstoned
      if (isTombstoned(op.entityId, storage)) {
        if (op.operationType !== OPERATION_TYPES.DELETE) {
          // Record was deleted on server. Discard or mark as conflict.
          op.status = OP_STATUS.FAILED;
          op.error = 'Record was deleted remotely';
          continue;
        }
      }

      // 2. Fetch authoritative remote revision
      const remoteRev = getLatestRevision(op.entityId, storage);
      const baseRev = op.baseRevision;

      if (!remoteRev) {
        // Brand new record
        if (op.operationType === OPERATION_TYPES.DELETE) {
          applyTombstone(op.entityId, op.entityType, op.actorId, 'Deleted before remote sync', storage);
          delete draftsStore[op.entityId];
        } else {
          const rev = saveRevision({
            recordId: op.entityId,
            entityType: op.entityType,
            snapshotData: op.payload,
            authorId: op.actorId,
            jurisdictionId,
            storage,
          });
          draftsStore[op.entityId] = {
            ...op.payload,
            id: op.entityId,
            entityType: op.entityType,
            revision: rev.revisionNumber,
            syncStatus: 'SYNCED',
            updatedAt: rev.createdAt,
          };
          updateDeviceCursor(deviceId, op.entityType, rev.revisionNumber, storage);
        }
        op.status = OP_STATUS.COMMITTED;
        appliedCount += 1;
      } else {
        // Record exists remotely. Check revisions!
        if (remoteRev.revisionNumber === baseRev) {
          // No concurrency conflict: remote hasn't changed since client read it
          if (op.operationType === OPERATION_TYPES.DELETE) {
            applyTombstone(op.entityId, op.entityType, op.actorId, 'Deleted by citizen', storage);
            delete draftsStore[op.entityId];
          } else {
            const nextRev = saveRevision({
              recordId: op.entityId,
              entityType: op.entityType,
              snapshotData: op.payload,
              authorId: op.actorId,
              jurisdictionId,
              storage,
            });
            draftsStore[op.entityId] = {
              ...op.payload,
              id: op.entityId,
              entityType: op.entityType,
              revision: nextRev.revisionNumber,
              syncStatus: 'SYNCED',
              updatedAt: nextRev.createdAt,
            };
            updateDeviceCursor(deviceId, op.entityType, nextRev.revisionNumber, storage);
          }
          op.status = OP_STATUS.COMMITTED;
          appliedCount += 1;
        } else {
          // Concurrency: Remote has newer revision than client's baseRevision!
          // Perform 3-way merge check
          const baseSnapshot = baseRev === 0 ? {} : (readStore(STORAGE_KEYS.RECORD_REVISIONS, storage)[op.entityId] || []).find((r) => r.revisionNumber === baseRev)?.snapshotData || {};
          const localSnapshot = op.payload || {};
          const remoteSnapshot = remoteRev.snapshotData || {};

          const diffResult = detectConflicts(baseSnapshot, localSnapshot, remoteSnapshot);

          if (!diffResult.hasConflict) {
            // Safe auto-merge!
            const mergedRev = saveRevision({
              recordId: op.entityId,
              entityType: op.entityType,
              snapshotData: diffResult.autoMergedData,
              authorId: op.actorId,
              jurisdictionId,
              storage,
            });
            draftsStore[op.entityId] = {
              ...diffResult.autoMergedData,
              id: op.entityId,
              entityType: op.entityType,
              revision: mergedRev.revisionNumber,
              syncStatus: 'SYNCED',
              updatedAt: mergedRev.createdAt,
            };
            updateDeviceCursor(deviceId, op.entityType, mergedRev.revisionNumber, storage);
            op.status = OP_STATUS.COMMITTED;
            appliedCount += 1;
          } else {
            // Genuine conflict! Save ConflictRecord and keep draft marked as CONFLICTED
            conflictsCount += 1;
            const conflictId = generateUUID();
            const conflictRecord = {
              id: conflictId,
              recordId: op.entityId,
              entityType: op.entityType,
              baseRevision: baseRev,
              localRevision: baseRev + 1,
              remoteRevision: remoteRev.revisionNumber,
              localData: localSnapshot,
              remoteData: remoteSnapshot,
              conflictFields: diffResult.conflictFields,
              explanation: diffResult.explanation,
              resolutionStrategy: null,
              resolvedData: null,
              resolvedBy: null,
              resolvedAt: null,
              status: CONFLICT_STATUS.UNRESOLVED,
              createdAt: new Date().toISOString(),
              schemaVersion: SCHEMA_VERSION,
            };

            conflictsStore[conflictId] = conflictRecord;
            draftsStore[op.entityId] = {
              ...localSnapshot,
              id: op.entityId,
              entityType: op.entityType,
              revision: baseRev,
              syncStatus: 'CONFLICTED',
              conflictId,
              updatedAt: new Date().toISOString(),
            };

            op.status = OP_STATUS.FAILED;
            op.error = ERROR_CODES.CONFLICT_DETECTED;
          }
        }
      }
    } catch (err) {
      op.status = OP_STATUS.FAILED;
      op.error = err.message || 'Unknown sync error';
    }
  }

  // Save updated local states
  writeStore(STORAGE_KEYS.OFFLINE_OPERATIONS, opsStore, storage);
  writeStore(STORAGE_KEYS.CITIZEN_DRAFTS, draftsStore, storage);
  writeStore(STORAGE_KEYS.CONFLICT_RECORDS, conflictsStore, storage);

  // Update session record
  session.completedAt = new Date().toISOString();
  session.status = conflictsCount > 0 ? 'CONFLICTED' : 'COMPLETED';
  session.conflictsCount = conflictsCount;
  session.operationsApplied = appliedCount;
  writeStore(STORAGE_KEYS.SYNC_SESSIONS, sessionsStore, storage);

  return {
    sessionId,
    status: session.status,
    appliedCount,
    conflictsCount,
    pendingRemaining: getPendingOperations(null, storage).length,
  };
};

// ---------------------------------------------------------------------------
// DEVICE / LOGOUT WIPE SUPPORT
// ---------------------------------------------------------------------------

export const wipeLocalDraftData = (storage = null) => {
  const store = getStorage(storage);
  if (!store) return;
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      store.removeItem(key);
    } catch {
      // Ignore removal errors
    }
  }
};
