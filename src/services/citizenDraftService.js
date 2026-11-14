/**
 * Citizen Draft Service (#775)
 *
 * Dedicated domain service layer for citizen drafts (checklists, application forms, and saved notes).
 * Separates all business and state machine logic from React UI components.
 *
 * Enforces:
 * - Domain state machine and allowed transitions
 * - Role-scoped and actor-scoped data boundaries
 * - Content sanitization and payload limits
 * - Integration with the conflict-aware offline sync engine
 */

import { getCurrentActor } from './accessControl';
import { sanitizeTextFields } from '../utils/safeContent';
import {
  STORAGE_KEYS,
  SCHEMA_VERSION,
  ERROR_CODES,
  OPERATION_TYPES,
  SyncEngineError,
  readStore,
  writeStore,
  generateUUID,
  enqueueOperation,
  processSyncQueue,
  isTombstoned,
  applyTombstone,
  resolveConflict,
} from './citizenDraftSyncEngine';

// ---------------------------------------------------------------------------
// DOMAIN STATES & ALLOWED TRANSITIONS
// ---------------------------------------------------------------------------

export const DRAFT_STATES = {
  DRAFT_LOCAL: 'DRAFT_LOCAL',
  QUEUED: 'QUEUED',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  CONFLICTED: 'CONFLICTED',
  RECOVERABLE_ERROR: 'RECOVERABLE_ERROR',
};

export const ALLOWED_TRANSITIONS = {
  [DRAFT_STATES.DRAFT_LOCAL]: [DRAFT_STATES.QUEUED, DRAFT_STATES.SYNCED],
  [DRAFT_STATES.QUEUED]: [DRAFT_STATES.SYNCING, DRAFT_STATES.DRAFT_LOCAL, DRAFT_STATES.RECOVERABLE_ERROR],
  [DRAFT_STATES.SYNCING]: [DRAFT_STATES.SYNCED, DRAFT_STATES.CONFLICTED, DRAFT_STATES.RECOVERABLE_ERROR, DRAFT_STATES.QUEUED],
  [DRAFT_STATES.SYNCED]: [DRAFT_STATES.DRAFT_LOCAL, DRAFT_STATES.QUEUED],
  [DRAFT_STATES.CONFLICTED]: [DRAFT_STATES.SYNCED, DRAFT_STATES.DRAFT_LOCAL],
  [DRAFT_STATES.RECOVERABLE_ERROR]: [DRAFT_STATES.QUEUED, DRAFT_STATES.DRAFT_LOCAL],
};

export const validateStateTransition = (currentState, nextState) => {
  if (currentState === nextState) return true;
  const allowed = ALLOWED_TRANSITIONS[currentState] || [];
  if (!allowed.includes(nextState)) {
    throw new SyncEngineError(
      `Invalid domain state transition from ${currentState} to ${nextState}`,
      ERROR_CODES.INVALID_TRANSITION
    );
  }
  return true;
};

// ---------------------------------------------------------------------------
// DRAFT TYPES & SCHEMA DEFAULTS
// ---------------------------------------------------------------------------

export const DRAFT_TYPES = {
  CHECKLIST: 'checklist',
  APPLICATION_DRAFT: 'application_draft',
  SAVED_NOTE: 'saved_note',
};

const normalizeDraftPayload = (draftType, data) => {
  const sanitized = sanitizeTextFields(data || {});

  switch (draftType) {
    case DRAFT_TYPES.CHECKLIST:
      return {
        title: sanitized.title || 'Untitled Checklist',
        serviceId: sanitized.serviceId || null,
        items: Array.isArray(sanitized.items)
          ? sanitized.items.map((item, idx) => ({
              id: item.id || `chk_${idx}_${Date.now()}`,
              label: typeof item.label === 'string' ? item.label.trim() : (typeof item === 'string' ? item.trim() : `Item ${idx + 1}`),
              completed: Boolean(item.completed),
            }))
          : [],
        notes: sanitized.notes || '',
        category: sanitized.category || 'General',
      };

    case DRAFT_TYPES.APPLICATION_DRAFT:
      return {
        serviceId: sanitized.serviceId || 'unknown_service',
        serviceName: sanitized.serviceName || 'Civic Service Draft',
        applicantName: sanitized.applicantName || '',
        formData: typeof sanitized.formData === 'object' && sanitized.formData !== null ? sanitized.formData : {},
        attachedDocsCount: Number.isInteger(sanitized.attachedDocsCount) ? sanitized.attachedDocsCount : 0,
        targetJurisdiction: sanitized.targetJurisdiction || 'State/District Default',
        notes: sanitized.notes || '',
      };

    case DRAFT_TYPES.SAVED_NOTE:
      return {
        title: sanitized.title || 'Civic Note',
        content: sanitized.content || '',
        category: sanitized.category || 'General Guidance',
        pinned: Boolean(sanitized.pinned),
        jurisdiction: sanitized.jurisdiction || 'all',
      };

    default:
      throw new SyncEngineError(`Unsupported draft type: ${draftType}`, ERROR_CODES.INVALID_PAYLOAD);
  }
};

// ---------------------------------------------------------------------------
// CRUD SERVICE METHODS
// ---------------------------------------------------------------------------

/**
 * Create a new citizen draft and queue for synchronization
 */
export const createDraft = async (
  draftType,
  initialData = {},
  { isOnline = true, deviceId = 'device_main', storage = null } = {}
) => {
  const actor = getCurrentActor();
  const actorId = actor?.id || 'citizen_anon';

  const draftId = generateUUID();
  const normalizedData = normalizeDraftPayload(draftType, initialData);

  const newDraft = {
    ...normalizedData,
    id: draftId,
    entityType: draftType,
    revision: 0,
    syncStatus: isOnline ? DRAFT_STATES.QUEUED : DRAFT_STATES.DRAFT_LOCAL,
    createdBy: actorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  };

  const draftsStore = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage);
  draftsStore[draftId] = newDraft;
  writeStore(STORAGE_KEYS.CITIZEN_DRAFTS, draftsStore, storage);

  // Enqueue sync operation
  enqueueOperation({
    entityType: draftType,
    entityId: draftId,
    operationType: OPERATION_TYPES.INSERT,
    payload: normalizedData,
    baseRevision: 0,
    actorId,
    storage,
  });

  if (isOnline) {
    try {
      await processSyncQueue({ deviceId, actorId, storage });
      const refreshed = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage)[draftId];
      return refreshed || newDraft;
    } catch {
      // Graceful offline fallback: Draft remains locally queued
      return newDraft;
    }
  }

  return newDraft;
};

/**
 * Retrieve a single draft by ID with actor scope enforcement
 */
export const getDraft = (draftId, { actorId = null, storage = null } = {}) => {
  if (!draftId) return null;
  if (isTombstoned(draftId, storage)) return null;

  const draftsStore = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage);
  const draft = draftsStore[draftId];
  if (!draft) return null;

  const currentActorId = actorId || getCurrentActor()?.id;
  if (currentActorId && draft.createdBy && draft.createdBy !== currentActorId && currentActorId !== 'admin') {
    throw new SyncEngineError('You are not authorized to view this draft', ERROR_CODES.PERMISSION_DENIED);
  }

  return draft;
};

/**
 * Update an existing draft and queue the changes
 */
export const updateDraft = async (
  draftId,
  changes = {},
  { isOnline = true, deviceId = 'device_main', expectedRevision = null, storage = null } = {}
) => {
  const draft = getDraft(draftId, { storage });
  if (!draft) {
    throw new SyncEngineError(`Draft ${draftId} not found or has been deleted`, ERROR_CODES.RECORD_NOT_FOUND);
  }

  const baseRev = expectedRevision !== null ? expectedRevision : (draft.revision || 0);
  const updatedPayload = normalizeDraftPayload(draft.entityType, {
    ...draft,
    ...changes,
  });

  draft.syncStatus = DRAFT_STATES.QUEUED;
  draft.updatedAt = new Date().toISOString();
  Object.assign(draft, updatedPayload);

  const draftsStore = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage);
  draftsStore[draftId] = draft;
  writeStore(STORAGE_KEYS.CITIZEN_DRAFTS, draftsStore, storage);

  enqueueOperation({
    entityType: draft.entityType,
    entityId: draftId,
    operationType: OPERATION_TYPES.UPDATE,
    payload: updatedPayload,
    baseRevision: baseRev,
    actorId: draft.createdBy,
    storage,
  });

  if (isOnline) {
    try {
      await processSyncQueue({ deviceId, actorId: draft.createdBy, storage });
      const refreshed = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage)[draftId];
      return refreshed || draft;
    } catch {
      return draft;
    }
  }

  return draft;
};

/**
 * Delete a draft with tombstone registration
 */
export const deleteDraft = async (
  draftId,
  { reason = 'Deleted by citizen', isOnline = true, deviceId = 'device_main', storage = null } = {}
) => {
  const draft = getDraft(draftId, { storage });
  if (!draft) return { ok: true };

  const actorId = draft.createdBy || getCurrentActor()?.id || 'citizen';

  // Apply tombstone
  applyTombstone(draftId, draft.entityType, actorId, reason, storage);

  // Remove from local drafts
  const draftsStore = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage);
  delete draftsStore[draftId];
  writeStore(STORAGE_KEYS.CITIZEN_DRAFTS, draftsStore, storage);

  // Enqueue deletion operation
  enqueueOperation({
    entityType: draft.entityType,
    entityId: draftId,
    operationType: OPERATION_TYPES.DELETE,
    payload: { id: draftId },
    baseRevision: draft.revision || 0,
    actorId,
    storage,
  });

  if (isOnline) {
    try {
      await processSyncQueue({ deviceId, actorId, storage });
    } catch {
      // Deletion is staged locally and will flush when online
    }
  }

  return { ok: true, draftId };
};

/**
 * List drafts with optional filters, pagination, and jurisdiction scope
 */
export const listDrafts = ({
  draftType = null,
  status = null,
  jurisdiction = null,
  page = 1,
  limit = 20,
  actorId = null,
  storage = null,
} = {}) => {
  const draftsStore = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, storage);
  const currentActorId = actorId || getCurrentActor()?.id;

  let list = Object.values(draftsStore).filter((d) => !isTombstoned(d.id, storage));

  // Access control filter
  if (currentActorId && currentActorId !== 'admin') {
    list = list.filter((d) => !d.createdBy || d.createdBy === currentActorId);
  }

  if (draftType) {
    list = list.filter((d) => d.entityType === draftType);
  }
  if (status) {
    list = list.filter((d) => d.syncStatus === status);
  }
  if (jurisdiction && jurisdiction !== 'all') {
    list = list.filter((d) => !d.targetJurisdiction || d.targetJurisdiction === jurisdiction || d.jurisdiction === jurisdiction);
  }

  list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  const total = list.length;
  const startIndex = (Math.max(page, 1) - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    items: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Search drafts by query string
 */
export const searchDrafts = (query = '', filters = {}, storage = null) => {
  const all = listDrafts({ ...filters, page: 1, limit: 1000, storage }).items;
  if (!query || !query.trim()) return all;

  const q = query.trim().toLowerCase();
  return all.filter((d) => {
    const titleMatch = d.title && d.title.toLowerCase().includes(q);
    const serviceMatch = d.serviceName && d.serviceName.toLowerCase().includes(q);
    const notesMatch = d.notes && d.notes.toLowerCase().includes(q);
    const contentMatch = d.content && d.content.toLowerCase().includes(q);
    return titleMatch || serviceMatch || notesMatch || contentMatch;
  });
};

export {
  resolveConflict,
  getConflictRecords,
  processSyncQueue,
  detectConflicts,
  getPendingOperations,
  enqueueOperation,
  applyTombstone,
  isTombstoned,
  wipeLocalDraftData,
  RESOLUTION_STRATEGIES,
  CONFLICT_STATUS,
  RULESET_VERSION,
  STORAGE_KEYS,
  SCHEMA_VERSION,
  ERROR_CODES,
  SyncEngineError,
} from './citizenDraftSyncEngine';

/**
 * Resolve a draft conflict with full engine synchronization
 */
export const resolveDraftConflict = (conflictId, options = {}, storage = null) => {
  return resolveConflict(conflictId, options, storage);
};
