import { getCurrentActor } from './accessControl';

// Persistence + save-state handling for checklists (used by Checklist.jsx).
//
// Everything lives under one localStorage key, keyed by checklist id (for the
// Track page that is the application reference ID):
//   { [id]: { checked: string[], rev: number, updatedAt: string } }
// `checked` holds the item labels that are ticked. `rev` is bumped on every
// successful write so a second tab holding an older copy can be detected
// instead of silently overwritten. Application records themselves
// (civicbridge_applications) are not touched.

export const CHECKLIST_STORAGE_KEY = 'civicbridge_checklists';

const getDefaultStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const readMap = (storage) => {
  try {
    const raw = storage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const cleanLabels = (value) =>
  Array.isArray(value)
    ? [...new Set(value.filter((v) => typeof v === 'string'))]
    : [];

export const readChecklist = (id, storage = getDefaultStorage()) => {
  if (!id || !storage) return { checked: [], rev: 0 };
  const entry = readMap(storage)[id];
  const rev = Number.isInteger(entry?.rev) && entry.rev >= 0 ? entry.rev : 0;
  return { checked: cleanLabels(entry?.checked), rev };
};

// Returns { ok: true, state } on success, { ok: false, reason: 'conflict',
// state: latest } when another tab saved since `expectedRev`, or
// { ok: false, reason: 'error' } when storage is unavailable or rejects it.
export const writeChecklist = (
  id,
  checked,
  expectedRev,
  storage = getDefaultStorage()
) => {
  if (!id || !storage) return { ok: false, reason: 'error' };
  try {
    const map = readMap(storage);
    const actorId = getCurrentActor()?.id || null;
    const existing = map[id];
    const existingOwner = existing?.ownerUserId || existing?.userId || null;
    if (existingOwner && existingOwner !== actorId) {
      return { ok: false, reason: 'forbidden' };
    }
    const current = readChecklist(id, storage);
    if (current.rev !== expectedRev) {
      return { ok: false, reason: 'conflict', state: current };
    }
    const state = { checked: cleanLabels(checked), rev: current.rev + 1 };
    map[id] = {
      ...state,
      ...(existingOwner ? { ownerUserId: existingOwner } : !existing && actorId ? { ownerUserId: actorId } : {}),
      updatedAt: new Date().toISOString(),
    };
    storage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(map));
    return { ok: true, state };
  } catch {
    return { ok: false, reason: 'error' };
  }
};

const sameLabels = (a, b) =>
  a.length === b.length && a.every((label) => b.includes(label));

/**
 * Small state machine around a checklist.
 * status: idle | saving | saved | error | conflict | updated
 *  - toggles are applied to the UI immediately and written together on the
 *    next scheduled tick, so rapid clicks collapse into one write and the
 *    final status always describes the final state;
 *  - error keeps the user's ticks on screen and `retry()` writes them again;
 *  - conflict (another tab saved first) blocks further toggles until the
 *    user picks `reloadLatest()` or `overwrite()`.
 * With no `id` the list is in-memory only and never reports a save state.
 */
export const createChecklistSession = ({
  id,
  items = [],
  storage = getDefaultStorage(),
  schedule = (fn) => setTimeout(fn, 0),
} = {}) => {
  const valid = new Set(items);
  const persisted = Boolean(id);
  const listeners = new Set();

  const initial = persisted
    ? readChecklist(id, storage)
    : { checked: [], rev: 0 };

  let desired = initial.checked.filter((l) => valid.has(l));
  let rev = initial.rev;
  let latest = null;
  let scheduled = false;
  let snapshot;

  const publish = (status) => {
    snapshot = { checked: [...desired], status };
    listeners.forEach((fn) => fn());
  };
  publish('idle');

  const flush = () => {
    scheduled = false;
    if (snapshot.status !== 'saving') return;
    const result = writeChecklist(id, desired, rev, storage);
    if (result.ok) {
      rev = result.state.rev;
      publish('saved');
    } else if (result.reason === 'conflict') {
      latest = result.state;
      publish('conflict');
    } else {
      publish('error');
    }
  };

  const requestSave = () => {
    publish('saving');
    if (!scheduled) {
      scheduled = true;
      schedule(flush);
    }
  };

  const adopt = (state, status) => {
    rev = state.rev;
    desired = state.checked.filter((l) => valid.has(l));
    latest = null;
    publish(status);
  };

  return {
    getState: () => snapshot,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    toggle: (label) => {
      if (!valid.has(label) || snapshot.status === 'conflict') return;
      desired = desired.includes(label)
        ? desired.filter((l) => l !== label)
        : [...desired, label];
      if (persisted) requestSave();
      else publish('idle');
    },
    retry: () => {
      if (persisted && snapshot.status === 'error') requestSave();
    },
    reloadLatest: () => {
      if (snapshot.status === 'conflict') adopt(latest, 'updated');
    },
    overwrite: () => {
      if (snapshot.status !== 'conflict') return;
      rev = latest.rev;
      latest = null;
      requestSave();
    },
    // Called when another tab changed storage. Only adopts the newer copy
    // when there is nothing unsaved here; otherwise the next save reports it.
    refresh: () => {
      if (!persisted || !['idle', 'saved', 'updated'].includes(snapshot.status)) {
        return;
      }
      const stored = readChecklist(id, storage);
      if (stored.rev !== rev && !sameLabels(stored.checked, desired)) {
        adopt(stored, 'updated');
      } else {
        rev = stored.rev;
      }
    },
  };
};
