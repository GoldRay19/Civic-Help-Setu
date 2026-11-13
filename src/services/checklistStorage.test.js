import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
  CHECKLIST_STORAGE_KEY,
  createChecklistSession,
  readChecklist,
  writeChecklist,
} from './checklistStorage';
import { setCurrentActor } from './accessControl';

const makeStorage = () => {
  const data = new Map();
  return {
    getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
    setItem: vi.fn((k, v) => data.set(k, String(v))),
  };
};

const ITEMS = ['Aadhaar Card', 'Salary slips', 'Affidavit'];

beforeEach(() => {
  setCurrentActor(null);
});

// Manual scheduler so tests decide when the pending write happens.
const makeSession = (storage, extra = {}) => {
  const queue = [];
  const session = createChecklistSession({
    id: 'SRV-1',
    items: ITEMS,
    storage,
    schedule: (fn) => queue.push(fn),
    ...extra,
  });
  const flush = () => queue.splice(0).forEach((fn) => fn());
  return { session, flush, queue };
};

describe('readChecklist / writeChecklist', () => {
  it('returns an empty list for unknown or corrupted data', () => {
    const storage = makeStorage();
    expect(readChecklist('x', storage)).toEqual({ checked: [], rev: 0 });
    storage.setItem(CHECKLIST_STORAGE_KEY, '{not json');
    expect(readChecklist('x', storage)).toEqual({ checked: [], rev: 0 });
  });

  it('saves, bumps the revision and drops duplicates', () => {
    const storage = makeStorage();
    const res = writeChecklist('x', ['a', 'a', 'b'], 0, storage);
    expect(res.ok).toBe(true);
    expect(readChecklist('x', storage)).toEqual({ checked: ['a', 'b'], rev: 1 });
  });

  it('reports a conflict instead of overwriting a newer revision', () => {
    const storage = makeStorage();
    writeChecklist('x', ['a'], 0, storage);
    const res = writeChecklist('x', ['b'], 0, storage);
    expect(res).toMatchObject({ ok: false, reason: 'conflict' });
    expect(res.state.checked).toEqual(['a']);
    expect(readChecklist('x', storage).checked).toEqual(['a']);
  });

  it('reports an error when storage throws or is missing', () => {
    const storage = makeStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(writeChecklist('x', ['a'], 0, storage)).toEqual({ ok: false, reason: 'error' });
    expect(writeChecklist('x', ['a'], 0, null)).toEqual({ ok: false, reason: 'error' });
  });

  it('binds new checklist progress to the active account and rejects another account writing it', () => {
    const storage = makeStorage();
    setCurrentActor({ id: 'alice' });
    expect(writeChecklist('private-list', ['Task'], 0, storage).ok).toBe(true);
    const stored = JSON.parse(storage.getItem(CHECKLIST_STORAGE_KEY));
    expect(stored['private-list'].ownerUserId).toBe('alice');

    setCurrentActor({ id: 'bob' });
    expect(writeChecklist('private-list', ['Other task'], 1, storage)).toEqual({
      ok: false,
      reason: 'forbidden',
    });
    expect(readChecklist('private-list', storage).checked).toEqual(['Task']);
  });
});

describe('createChecklistSession', () => {
  it('toggles on and off and reports saving then saved', () => {
    const { session, flush } = makeSession(makeStorage());
    session.toggle('Aadhaar Card');
    expect(session.getState()).toEqual({ checked: ['Aadhaar Card'], status: 'saving' });
    flush();
    expect(session.getState().status).toBe('saved');
    session.toggle('Aadhaar Card');
    flush();
    expect(session.getState()).toEqual({ checked: [], status: 'saved' });
  });

  it('restores saved progress and ignores labels that are no longer items', () => {
    const storage = makeStorage();
    writeChecklist('SRV-1', ['Salary slips', 'Old item'], 0, storage);
    const { session } = makeSession(storage);
    expect(session.getState().checked).toEqual(['Salary slips']);
  });

  it('collapses rapid toggles into one write that matches the final UI', () => {
    const storage = makeStorage();
    const { session, flush, queue } = makeSession(storage);
    session.toggle('Affidavit');
    session.toggle('Affidavit');
    session.toggle('Affidavit');
    session.toggle('Salary slips');
    expect(queue).toHaveLength(1);
    expect(storage.setItem).not.toHaveBeenCalled();
    flush();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(session.getState()).toEqual({
      checked: ['Affidavit', 'Salary slips'],
      status: 'saved',
    });
    expect(readChecklist('SRV-1', storage).checked).toEqual(['Affidavit', 'Salary slips']);
  });

  it('ignores unknown labels and never stores duplicates', () => {
    const { session, flush } = makeSession(makeStorage());
    session.toggle('Not a real item');
    expect(session.getState().status).toBe('idle');
    session.toggle('Affidavit');
    flush();
    expect(session.getState().checked).toEqual(['Affidavit']);
  });

  it('shows an error without claiming success, keeps ticks, and retries', () => {
    const storage = makeStorage();
    const { session, flush } = makeSession(storage);
    storage.setItem.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    session.toggle('Aadhaar Card');
    flush();
    expect(session.getState()).toEqual({ checked: ['Aadhaar Card'], status: 'error' });
    session.retry();
    expect(session.getState().status).toBe('saving');
    flush();
    expect(session.getState().status).toBe('saved');
    expect(readChecklist('SRV-1', storage).checked).toEqual(['Aadhaar Card']);
  });

  it('detects a change from another tab and does not overwrite it', () => {
    const storage = makeStorage();
    const { session, flush } = makeSession(storage);
    writeChecklist('SRV-1', ['Salary slips'], 0, storage); // other tab
    session.toggle('Aadhaar Card');
    flush();
    expect(session.getState().status).toBe('conflict');
    expect(readChecklist('SRV-1', storage).checked).toEqual(['Salary slips']);
    session.toggle('Affidavit'); // blocked while in conflict
    expect(session.getState().checked).toEqual(['Aadhaar Card']);
  });

  it('can reload the latest version after a conflict', () => {
    const storage = makeStorage();
    const { session, flush } = makeSession(storage);
    writeChecklist('SRV-1', ['Salary slips'], 0, storage);
    session.toggle('Aadhaar Card');
    flush();
    session.reloadLatest();
    expect(session.getState()).toEqual({ checked: ['Salary slips'], status: 'updated' });
    session.toggle('Affidavit');
    flush();
    expect(readChecklist('SRV-1', storage).checked).toEqual(['Salary slips', 'Affidavit']);
  });

  it('can keep local changes after a conflict', () => {
    const storage = makeStorage();
    const { session, flush } = makeSession(storage);
    writeChecklist('SRV-1', ['Salary slips'], 0, storage);
    session.toggle('Aadhaar Card');
    flush();
    session.overwrite();
    flush();
    expect(session.getState()).toEqual({ checked: ['Aadhaar Card'], status: 'saved' });
    expect(readChecklist('SRV-1', storage)).toMatchObject({ checked: ['Aadhaar Card'], rev: 2 });
  });

  it('picks up another tab quietly when nothing is unsaved', () => {
    const storage = makeStorage();
    const { session } = makeSession(storage);
    writeChecklist('SRV-1', ['Affidavit'], 0, storage);
    session.refresh();
    expect(session.getState()).toEqual({ checked: ['Affidavit'], status: 'updated' });
  });

  it('works in memory without an id', () => {
    const storage = makeStorage();
    const { session, queue } = makeSession(storage, { id: undefined });
    session.toggle('Affidavit');
    expect(session.getState()).toEqual({ checked: ['Affidavit'], status: 'idle' });
    expect(queue).toHaveLength(0);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
