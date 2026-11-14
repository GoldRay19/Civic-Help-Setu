import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEYS,
  SCHEMA_VERSION,
  RULESET_VERSION,
  ERROR_CODES,
  OPERATION_TYPES,
  OP_STATUS,
  CONFLICT_STATUS,
  RESOLUTION_STRATEGIES,
  SyncEngineError,
  readStore,
  writeStore,
  generateUUID,
  generateIdempotencyKey,
  calculateChecksum,
  getDeviceCursor,
  updateDeviceCursor,
  isTombstoned,
  applyTombstone,
  getLatestRevision,
  saveRevision,
  detectConflicts,
  getPendingOperations,
  enqueueOperation,
  getConflictRecords,
  resolveConflict,
  processSyncQueue,
  wipeLocalDraftData,
} from './citizenDraftSyncEngine';

import {
  createDraft,
  getDraft,
  updateDraft,
  deleteDraft,
  listDrafts,
  searchDrafts,
  DRAFT_STATES,
  DRAFT_TYPES,
  validateStateTransition,
} from './citizenDraftService';

// In-memory mock storage implementing standard localStorage interface
const createMockStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

describe('citizenDraftSyncEngine (#775)', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  describe('Storage & Checksum Integrity', () => {
    it('calculates deterministic checksums regardless of key insertion order', () => {
      const objA = { b: 2, a: 1, c: { y: 'hello', x: 'world' } };
      const objB = { a: 1, c: { x: 'world', y: 'hello' }, b: 2 };

      const hashA = calculateChecksum(objA);
      const hashB = calculateChecksum(objB);

      expect(hashA).toBe(hashB);
      expect(typeof hashA).toBe('string');
      expect(hashA.length).toBe(8);
    });

    it('safely handles null and empty structures in readStore and writeStore', () => {
      expect(readStore('missing_key', mockStorage)).toEqual({});
      writeStore('test_key', { test: true }, mockStorage);
      expect(readStore('test_key', mockStorage)).toEqual({ test: true });
    });

    it('handles simulated storage quota exceeded error', () => {
      const failingStorage = {
        getItem: () => null,
        setItem: () => {
          const err = new Error('Quota exceeded');
          err.name = 'QuotaExceededError';
          throw err;
        },
        removeItem: () => {},
      };

      expect(() => writeStore('key', { large: 'data' }, failingStorage)).toThrowError(SyncEngineError);
    });
  });

  describe('Device Cursors & Monotonic Revisions', () => {
    it('initializes and advances device cursors monotonically', () => {
      const initial = getDeviceCursor('dev_1', 'checklist', mockStorage);
      expect(initial.lastSyncedRevision).toBe(0);

      updateDeviceCursor('dev_1', 'checklist', 3, mockStorage);
      const updated = getDeviceCursor('dev_1', 'checklist', mockStorage);
      expect(updated.lastSyncedRevision).toBe(3);

      // Does not decrease even if an older revision arrives
      updateDeviceCursor('dev_1', 'checklist', 2, mockStorage);
      const afterLower = getDeviceCursor('dev_1', 'checklist', mockStorage);
      expect(afterLower.lastSyncedRevision).toBe(3);
    });

    it('creates monotonically incremented revisions with checksums', () => {
      const recordId = 'rec_100';
      const rev1 = saveRevision({
        recordId,
        entityType: 'saved_note',
        snapshotData: { title: 'First Note' },
        authorId: 'cit_1',
        storage: mockStorage,
      });
      expect(rev1.revisionNumber).toBe(1);
      expect(rev1.checksum).toBe(calculateChecksum({ title: 'First Note' }));

      const rev2 = saveRevision({
        recordId,
        entityType: 'saved_note',
        snapshotData: { title: 'Updated Note' },
        authorId: 'cit_1',
        storage: mockStorage,
      });
      expect(rev2.revisionNumber).toBe(2);
      expect(rev2.checksum).toBe(calculateChecksum({ title: 'Updated Note' }));

      const latest = getLatestRevision(recordId, mockStorage);
      expect(latest.revisionNumber).toBe(2);
    });
  });

  describe('Idempotency & Operation Queue', () => {
    it('enqueues mutations and deduplicates based on idempotencyKey', () => {
      const key = generateIdempotencyKey('draft');
      const op1 = enqueueOperation({
        entityType: 'checklist',
        entityId: 'chk_1',
        operationType: OPERATION_TYPES.INSERT,
        payload: { title: 'Aadhaar Checklist' },
        baseRevision: 0,
        idempotencyKey: key,
        storage: mockStorage,
      });

      const op2 = enqueueOperation({
        entityType: 'checklist',
        entityId: 'chk_1',
        operationType: OPERATION_TYPES.INSERT,
        payload: { title: 'Aadhaar Checklist Duplicate' },
        baseRevision: 0,
        idempotencyKey: key,
        storage: mockStorage,
      });

      expect(op1.id).toBe(op2.id);
      const pending = getPendingOperations('checklist', mockStorage);
      expect(pending.length).toBe(1);
    });

    it('rejects payloads that exceed size boundaries', () => {
      const hugeString = 'x'.repeat(600 * 1024);
      expect(() => {
        enqueueOperation({
          entityType: 'saved_note',
          entityId: 'note_large',
          operationType: OPERATION_TYPES.INSERT,
          payload: { text: hugeString },
          storage: mockStorage,
        });
      }).toThrowError(/exceeds maximum allowed size/);
    });
  });

  describe('Three-Way Conflict Detection & Heuristics', () => {
    it('cleanly auto-merges when changes occur in disjoint, independent properties', () => {
      const base = { title: 'Draft Service', notes: 'Initial notes', ward: 'Ward 12' };
      const local = { title: 'Draft Service', notes: 'Initial notes', ward: 'Ward 14' }; // Changed ward
      const remote = { title: 'Draft Service Updated', notes: 'Initial notes', ward: 'Ward 12' }; // Changed title

      const res = detectConflicts(base, local, remote);
      expect(res.hasConflict).toBe(false);
      expect(res.conflictFields).toEqual([]);
      expect(res.autoMergedData).toEqual({
        title: 'Draft Service Updated',
        notes: 'Initial notes',
        ward: 'Ward 14',
      });
    });

    it('cleanly performs deterministic set union for array of checklist labels', () => {
      const base = { items: ['Doc A', 'Doc B'] };
      const local = { items: ['Doc A', 'Doc B', 'Doc C'] }; // Local added Doc C
      const remote = { items: ['Doc A', 'Doc B', 'Doc D'] }; // Remote added Doc D

      const res = detectConflicts(base, local, remote);
      expect(res.hasConflict).toBe(false);
      expect(res.autoMergedData.items).toEqual(['Doc A', 'Doc B', 'Doc D', 'Doc C']);
    });

    it('flags conflicting scalar text fields and produces explainable recommendations', () => {
      const base = { notes: 'Original grievance summary' };
      const local = { notes: 'Citizen modified the summary with personal timeline' };
      const remote = { notes: 'Operator amended the summary with statutory reference' };

      const res = detectConflicts(base, local, remote);
      expect(res.hasConflict).toBe(true);
      expect(res.conflictFields).toContain('notes');
      expect(res.explanation).not.toBeNull();
      expect(res.explanation.rulesetVersion).toBe(RULESET_VERSION);
      expect(res.explanation.influencingFields).toEqual(['notes']);
      expect(res.explanation.rationale).toMatch(/Concurrent modifications detected in \[notes\]/);
      expect(res.explanation.inputFeatureWindow.conflictCount).toBe(1);
    });
  });

  describe('Tombstones & Deletion Propagation', () => {
    it('applies tombstones and prevents deleted records from resurrecting', () => {
      const recordId = 'doc_to_delete';
      expect(isTombstoned(recordId, mockStorage)).toBe(false);

      applyTombstone(recordId, 'application_draft', 'cit_42', 'Withdrawn by applicant', mockStorage);
      expect(isTombstoned(recordId, mockStorage)).toBe(true);

      // Attempting to sync an update on a tombstoned record fails safely
      enqueueOperation({
        entityType: 'application_draft',
        entityId: recordId,
        operationType: OPERATION_TYPES.UPDATE,
        payload: { title: 'Resurrected title' },
        baseRevision: 1,
        storage: mockStorage,
      });

      // Process sync
      return processSyncQueue({ storage: mockStorage }).then((result) => {
        expect(result.appliedCount).toBe(0);
        const ops = readStore(STORAGE_KEYS.OFFLINE_OPERATIONS, mockStorage);
        const failedOp = Object.values(ops).find((o) => o.entityId === recordId);
        expect(failedOp.status).toBe(OP_STATUS.FAILED);
        expect(failedOp.error).toMatch(/deleted/);
      });
    });
  });

  describe('Offline Queueing, Flushes & Conflict Resolution', () => {
    it('handles offline queueing and flushes cleanly on reconnection', async () => {
      // 1. Citizen creates draft offline
      enqueueOperation({
        entityType: 'saved_note',
        entityId: 'note_offline_1',
        operationType: OPERATION_TYPES.INSERT,
        payload: { title: 'Offline Note', content: 'Drafted in flight' },
        baseRevision: 0,
        actorId: 'user_offline',
        storage: mockStorage,
      });

      expect(getPendingOperations(null, mockStorage).length).toBe(1);

      // 2. Network reconnects and processes queue
      const result = await processSyncQueue({
        deviceId: 'device_phone',
        actorId: 'user_offline',
        storage: mockStorage,
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.appliedCount).toBe(1);
      expect(result.conflictsCount).toBe(0);
      expect(result.pendingRemaining).toBe(0);

      // Authoritative revision created
      const rev = getLatestRevision('note_offline_1', mockStorage);
      expect(rev).not.toBeNull();
      expect(rev.snapshotData.title).toBe('Offline Note');
    });

    it('creates ConflictRecord when concurrency conflict occurs and resolves via KEEP_LOCAL and KEEP_REMOTE', async () => {
      const recordId = 'draft_conflict_app';

      // 1. Initial server revision (Rev 1)
      saveRevision({
        recordId,
        entityType: 'application_draft',
        snapshotData: { serviceName: 'Ration Card', notes: 'Server notes v1' },
        authorId: 'user_1',
        storage: mockStorage,
      });

      // 2. Server moves to Rev 2 in the cloud
      saveRevision({
        recordId,
        entityType: 'application_draft',
        snapshotData: { serviceName: 'Ration Card', notes: 'Server notes v2 amended by clerk' },
        authorId: 'clerk_1',
        storage: mockStorage,
      });

      // 3. Client, which only knew of Rev 1, sends local change offline
      enqueueOperation({
        entityType: 'application_draft',
        entityId: recordId,
        operationType: OPERATION_TYPES.UPDATE,
        payload: { serviceName: 'Ration Card', notes: 'Citizen local notes updated offline' },
        baseRevision: 1, // Stale base!
        actorId: 'citizen_1',
        storage: mockStorage,
      });

      // 4. Sync triggers
      const syncResult = await processSyncQueue({
        deviceId: 'citizen_laptop',
        actorId: 'citizen_1',
        storage: mockStorage,
      });

      expect(syncResult.status).toBe('CONFLICTED');
      expect(syncResult.conflictsCount).toBe(1);

      // Conflict record created
      const conflicts = getConflictRecords({ storage: mockStorage });
      expect(conflicts.length).toBe(1);
      const conflict = conflicts[0];
      expect(conflict.recordId).toBe(recordId);
      expect(conflict.conflictFields).toContain('notes');
      expect(conflict.status).toBe(CONFLICT_STATUS.UNRESOLVED);

      // 5. User resolves conflict choosing KEEP_LOCAL
      const resolved = resolveConflict(
        conflict.id,
        {
          strategy: RESOLUTION_STRATEGIES.KEEP_LOCAL,
          resolvedBy: 'citizen_1',
          reason: 'Citizen confirmed local details',
        },
        mockStorage
      );

      expect(resolved.conflict.status).toBe(CONFLICT_STATUS.RESOLVED);
      expect(resolved.revision.revisionNumber).toBe(3);
      expect(resolved.revision.snapshotData.notes).toBe('Citizen local notes updated offline');

      // 6. Verify that resolveConflict properly cleaned up failed operations and updated the draft
      const draftsAfterResolve = readStore(STORAGE_KEYS.CITIZEN_DRAFTS, mockStorage);
      expect(draftsAfterResolve[recordId].syncStatus).toBe('SYNCED');
      expect(draftsAfterResolve[recordId].conflictId).toBeNull();
      expect(draftsAfterResolve[recordId].revision).toBe(3);

      // 7. Follow-up sync run must now find 0 conflicts and 0 pending operations!
      const followUpSync = await processSyncQueue({
        deviceId: 'citizen_laptop',
        actorId: 'citizen_1',
        storage: mockStorage,
      });
      expect(followUpSync.conflictsCount).toBe(0);
      expect(followUpSync.pendingRemaining).toBe(0);

      // 8. Subsequent edit on the resolved draft starts from Rev 3 and cleanly reaches Rev 4 without conflict
      enqueueOperation({
        entityType: 'application_draft',
        entityId: recordId,
        operationType: OPERATION_TYPES.UPDATE,
        payload: { serviceName: 'Ration Card', notes: 'Citizen edited notes after conflict resolution' },
        baseRevision: 3,
        actorId: 'citizen_1',
        storage: mockStorage,
      });

      const nextSync = await processSyncQueue({
        deviceId: 'citizen_laptop',
        actorId: 'citizen_1',
        storage: mockStorage,
      });
      expect(nextSync.status).toBe('COMPLETED');
      expect(nextSync.appliedCount).toBe(1);
      expect(nextSync.conflictsCount).toBe(0);

      const latestRev = getLatestRevision(recordId, mockStorage);
      expect(latestRev.revisionNumber).toBe(4);
      expect(latestRev.snapshotData.notes).toBe('Citizen edited notes after conflict resolution');
    });

    it('resolves conflict using MANUAL_MERGE with custom field payload', async () => {
      const recordId = 'draft_custom_merge';

      // 1. Common Base (Rev 1)
      saveRevision({
        recordId,
        entityType: 'application_draft',
        snapshotData: { applicantName: 'Ravi Kumar', targetJurisdiction: 'Ward 10', notes: 'Base notes' },
        authorId: 'cit_1',
        storage: mockStorage,
      });

      // 2. Remote update (Rev 2)
      saveRevision({
        recordId,
        entityType: 'application_draft',
        snapshotData: { applicantName: 'Ravi Kumar', targetJurisdiction: 'Ward 10', notes: 'Officer remarks added' },
        authorId: 'officer_1',
        storage: mockStorage,
      });

      // 3. Local update based on Rev 1 (stale)
      enqueueOperation({
        entityType: 'application_draft',
        entityId: recordId,
        operationType: OPERATION_TYPES.UPDATE,
        payload: { applicantName: 'Ravi K.', targetJurisdiction: 'Ward 11', notes: 'Applicant notes added' },
        baseRevision: 1,
        actorId: 'cit_1',
        storage: mockStorage,
      });

      // 4. Sync triggers conflict
      const syncResult = await processSyncQueue({ storage: mockStorage });
      expect(syncResult.conflictsCount).toBe(1);

      const conflict = getConflictRecords({ storage: mockStorage })[0];
      expect(conflict.status).toBe(CONFLICT_STATUS.UNRESOLVED);

      // 5. User chooses custom merge combining local jurisdiction with remote notes
      const customMergedPayload = {
        applicantName: 'Ravi Kumar (Verified)',
        targetJurisdiction: 'Ward 11',
        notes: 'Officer remarks added; Applicant notes added',
      };

      const resolved = resolveConflict(
        conflict.id,
        {
          strategy: RESOLUTION_STRATEGIES.MANUAL_MERGE,
          resolvedData: customMergedPayload,
          resolvedBy: 'cit_1',
          reason: 'Manual field-by-field merge by applicant',
        },
        mockStorage
      );

      expect(resolved.conflict.status).toBe(CONFLICT_STATUS.RESOLVED);
      expect(resolved.revision.revisionNumber).toBe(3);
      expect(resolved.revision.snapshotData).toEqual(customMergedPayload);

      // 6. Verify that unresolved conflict list is now empty
      const unresolvedRemaining = getConflictRecords({ status: CONFLICT_STATUS.UNRESOLVED, storage: mockStorage });
      expect(unresolvedRemaining.length).toBe(0);
    });

    it('wipes all local draft and sync stores on account logout / revocation', () => {
      writeStore(STORAGE_KEYS.CITIZEN_DRAFTS, { test: 1 }, mockStorage);
      writeStore(STORAGE_KEYS.OFFLINE_OPERATIONS, { test: 2 }, mockStorage);
      writeStore(STORAGE_KEYS.CONFLICT_RECORDS, { test: 3 }, mockStorage);

      wipeLocalDraftData(mockStorage);

      expect(readStore(STORAGE_KEYS.CITIZEN_DRAFTS, mockStorage)).toEqual({});
      expect(readStore(STORAGE_KEYS.OFFLINE_OPERATIONS, mockStorage)).toEqual({});
      expect(readStore(STORAGE_KEYS.CONFLICT_RECORDS, mockStorage)).toEqual({});
    });
  });

  describe('Domain Service Integration (citizenDraftService)', () => {
    it('validates state transitions strictly', () => {
      expect(validateStateTransition(DRAFT_STATES.DRAFT_LOCAL, DRAFT_STATES.QUEUED)).toBe(true);
      expect(validateStateTransition(DRAFT_STATES.QUEUED, DRAFT_STATES.SYNCING)).toBe(true);
      expect(validateStateTransition(DRAFT_STATES.SYNCING, DRAFT_STATES.SYNCED)).toBe(true);

      // Invalid transition: from DRAFT_LOCAL directly to CONFLICTED
      expect(() => {
        validateStateTransition(DRAFT_STATES.DRAFT_LOCAL, DRAFT_STATES.CONFLICTED);
      }).toThrowError(SyncEngineError);
    });

    it('creates, updates, lists and searches citizen drafts', async () => {
      const draft = await createDraft(
        DRAFT_TYPES.CHECKLIST,
        {
          title: 'Driving Licence Prep',
          items: [{ label: 'Age Proof', completed: true }, { label: 'Address Proof', completed: false }],
          notes: 'Visit RTO on Tuesday',
        },
        { isOnline: true, storage: mockStorage }
      );

      expect(draft.id).toBeDefined();
      expect(draft.items.length).toBe(2);

      // Retrieve
      const fetched = getDraft(draft.id, { storage: mockStorage });
      expect(fetched.title).toBe('Driving Licence Prep');

      // Update
      const updated = await updateDraft(
        draft.id,
        {
          items: [{ label: 'Age Proof', completed: true }, { label: 'Address Proof', completed: true }],
        },
        { isOnline: true, storage: mockStorage }
      );
      expect(updated.items[1].completed).toBe(true);

      // List & Search
      const searchResult = searchDrafts('Driving', {}, mockStorage);
      expect(searchResult.length).toBe(1);
      expect(searchResult[0].title).toBe('Driving Licence Prep');

      // Delete
      await deleteDraft(draft.id, { storage: mockStorage });
      const afterDelete = getDraft(draft.id, { storage: mockStorage });
      expect(afterDelete).toBeNull();
    });
  });
});

