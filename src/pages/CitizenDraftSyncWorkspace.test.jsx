import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CitizenDraftSyncWorkspace from './CitizenDraftSyncWorkspace';
import { LanguageProvider } from '../context/LanguageContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'citizen_123', email: 'citizen@example.org', role: 'citizen' } }),
}));

vi.mock('../context/NetworkContext', () => ({
  useNetwork: () => ({ isOnline: true }),
}));

const render = (path = '/citizen-drafts') =>
  renderToStaticMarkup(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/citizen-drafts" element={<CitizenDraftSyncWorkspace />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );

const memStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k, v) => memStore.set(k, String(v)),
  removeItem: (k) => memStore.delete(k),
  clear: () => memStore.clear(),
};

describe('CitizenDraftSyncWorkspace (#775)', () => {
  beforeEach(() => {
    memStore.clear();
  });
  it('renders the workspace with title, offline simulator, and sync action', () => {
    const html = render();
    expect(html).toContain('Citizen Drafts &amp; Offline Sync');
    expect(html).toContain('Simulate Airplane Mode');
    expect(html).toContain('Sync Now');
  });

  it('renders the three primary tabs: My Drafts, Conflicts, and Offline Queue', () => {
    const html = render();
    expect(html).toContain('My Drafts');
    expect(html).toContain('Conflicts');
    expect(html).toContain('Offline Queue');
  });

  it('renders search input and draft type filters', () => {
    const html = render();
    expect(html).toContain('Search drafts...');
    expect(html).toContain('All Types');
    expect(html).toContain('Checklists');
    expect(html).toContain('Application Drafts');
    expect(html).toContain('Saved Notes');
  });

  it('renders accessible live region for screen readers', () => {
    const html = render();
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
  });

  it('renders conflict resolution options when conflicts are staged', async () => {
    const { STORAGE_KEYS, RULESET_VERSION } = await import('../services/citizenDraftSyncEngine');
    const mockConflict = {
      id: 'conf_test_1',
      recordId: 'rec_draft_1',
      entityType: 'application_draft',
      baseRevision: 1,
      localRevision: 2,
      remoteRevision: 2,
      localData: { notes: 'Local modified note' },
      remoteData: { notes: 'Remote modified note' },
      conflictFields: ['notes'],
      explanation: {
        rulesetVersion: RULESET_VERSION,
        rationale: 'Concurrent modifications detected in [notes]',
      },
      status: 'UNRESOLVED',
    };

    // Staging conflict in local storage
    localStorage.setItem(STORAGE_KEYS.CONFLICT_RECORDS, JSON.stringify({ conf_test_1: mockConflict }));

    const html = render();
    expect(html).toContain('Conflicts');
    expect(html).toContain('Action Needed');
    expect(html).toContain('Resolve Conflict');
    expect(html).toContain('Three-Way Merge Resolution');
    expect(html).toContain('Resolve Conflict: Keep Local');
    expect(html).toContain('Resolve Conflict: Keep Server');
    expect(html).toContain('Field-by-Field Merge Choices');
    expect(html).toContain('Resolve Conflict &amp; Confirm Merge');

    localStorage.removeItem(STORAGE_KEYS.CONFLICT_RECORDS);
  });

  it('verifies that resolveDraftConflict resolves both conflict record and updates draft to SYNCED', async () => {
    const {
      STORAGE_KEYS,
      resolveConflict,
      readStore,
    } = await import('../services/citizenDraftSyncEngine');
    const { resolveDraftConflict } = await import('../services/citizenDraftService');

    const conflictId = 'conf_verify_resolution_1';
    const recordId = 'draft_verify_1';

    // Staging conflict
    const stagedConflict = {
      id: conflictId,
      recordId,
      entityType: 'saved_note',
      baseRevision: 1,
      localRevision: 2,
      remoteRevision: 2,
      localData: { title: 'Local Note', content: 'Local content' },
      remoteData: { title: 'Remote Note', content: 'Remote content' },
      conflictFields: ['content'],
      status: 'UNRESOLVED',
    };

    localStorage.setItem(STORAGE_KEYS.CONFLICT_RECORDS, JSON.stringify({ [conflictId]: stagedConflict }));
    localStorage.setItem(STORAGE_KEYS.CITIZEN_DRAFTS, JSON.stringify({
      [recordId]: { id: recordId, entityType: 'saved_note', syncStatus: 'CONFLICTED', conflictId }
    }));

    // Resolve using resolveDraftConflict
    const result = resolveDraftConflict(conflictId, 'KEEP_LOCAL');
    expect(result.conflict.status).toBe('RESOLVED');
    expect(result.revision.revisionNumber).toBe(1);

    const drafts = readStore(STORAGE_KEYS.CITIZEN_DRAFTS);
    expect(drafts[recordId].syncStatus).toBe('SYNCED');
    expect(drafts[recordId].conflictId).toBeNull();

    // Also verify resolveConflict accepts recordId directly
    const resultByRecordId = resolveConflict(recordId, 'KEEP_LOCAL');
    expect(resultByRecordId.status).toBe('RESOLVED');
  });

  it('verifies that resolveDraftConflict resolves via KEEP_REMOTE and MANUAL_MERGE', async () => {
    const {
      STORAGE_KEYS,
      readStore,
    } = await import('../services/citizenDraftSyncEngine');
    const { resolveDraftConflict } = await import('../services/citizenDraftService');

    // Test KEEP_REMOTE
    const confRemoteId = 'conf_remote_test';
    const recRemoteId = 'rec_remote_test';
    const stagedRemoteConflict = {
      id: confRemoteId,
      recordId: recRemoteId,
      entityType: 'saved_note',
      baseRevision: 1,
      localRevision: 2,
      remoteRevision: 2,
      localData: { content: 'Local text' },
      remoteData: { content: 'Remote authoritative text' },
      conflictFields: ['content'],
      status: 'UNRESOLVED',
    };
    localStorage.setItem(STORAGE_KEYS.CONFLICT_RECORDS, JSON.stringify({ [confRemoteId]: stagedRemoteConflict }));
    localStorage.setItem(STORAGE_KEYS.CITIZEN_DRAFTS, JSON.stringify({
      [recRemoteId]: { id: recRemoteId, entityType: 'saved_note', syncStatus: 'CONFLICTED', conflictId: confRemoteId }
    }));

    const remoteRes = resolveDraftConflict(confRemoteId, 'KEEP_REMOTE');
    expect(remoteRes.conflict.status).toBe('RESOLVED');
    expect(remoteRes.revision.snapshotData.content).toBe('Remote authoritative text');
    let drafts = readStore(STORAGE_KEYS.CITIZEN_DRAFTS);
    expect(drafts[recRemoteId].syncStatus).toBe('SYNCED');
    expect(drafts[recRemoteId].content).toBe('Remote authoritative text');

    // Test MANUAL_MERGE
    const confMergeId = 'conf_manual_merge_test';
    const recMergeId = 'rec_manual_merge_test';
    const stagedMergeConflict = {
      id: confMergeId,
      recordId: recMergeId,
      entityType: 'saved_note',
      baseRevision: 1,
      localRevision: 2,
      remoteRevision: 2,
      localData: { title: 'Local Title', content: 'Local text' },
      remoteData: { title: 'Server Title', content: 'Server text' },
      conflictFields: ['title', 'content'],
      status: 'UNRESOLVED',
    };
    localStorage.setItem(STORAGE_KEYS.CONFLICT_RECORDS, JSON.stringify({ [confMergeId]: stagedMergeConflict }));
    localStorage.setItem(STORAGE_KEYS.CITIZEN_DRAFTS, JSON.stringify({
      [recMergeId]: { id: recMergeId, entityType: 'saved_note', syncStatus: 'CONFLICTED', conflictId: confMergeId }
    }));

    const manualRes = resolveDraftConflict(confMergeId, {
      strategy: 'MANUAL_MERGE',
      resolvedData: { title: 'Server Title', content: 'Merged synthesized text' },
      resolvedBy: 'citizen_123',
      reason: 'Citizen manually merged title from server and new text',
    });
    expect(manualRes.conflict.status).toBe('RESOLVED');
    expect(manualRes.revision.snapshotData.content).toBe('Merged synthesized text');
    drafts = readStore(STORAGE_KEYS.CITIZEN_DRAFTS);
    expect(drafts[recMergeId].syncStatus).toBe('SYNCED');
    expect(drafts[recMergeId].content).toBe('Merged synthesized text');
    expect(drafts[recMergeId].title).toBe('Server Title');
  });

  it('renders a direct Resolve Conflict action on conflicted draft cards in drafts tab', async () => {
    const { STORAGE_KEYS } = await import('../services/citizenDraftSyncEngine');
    const draftId = 'draft_conflicted_card';

    localStorage.setItem(STORAGE_KEYS.CITIZEN_DRAFTS, JSON.stringify({
      [draftId]: {
        id: draftId,
        title: 'Conflicted Passport Draft',
        entityType: 'application_draft',
        syncStatus: 'CONFLICTED',
        conflictId: 'conf_123',
        notes: 'Needs resolution',
      }
    }));

    const html = render();
    expect(html).toContain('Conflicted Passport Draft');
    expect(html).toContain('Conflicted');
    expect(html).toContain('Resolve Conflict');

    localStorage.removeItem(STORAGE_KEYS.CITIZEN_DRAFTS);
  });
});

