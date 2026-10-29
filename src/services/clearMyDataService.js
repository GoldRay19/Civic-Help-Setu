/**
 * "Clear my data" (#223): delete the records this app keeps in the browser, by category.
 *
 * Which keys the app owns is decided in one place, the registry in privacyConsentService.js
 * (USER_DATA_STORES, USER_DATA_PREFIX_STORES, USER_DATA_SESSION_STORES). This file never builds a key
 * name of its own and never calls storage.clear(), so theme, language, the demo sign-in and the admin
 * portal data are not touched.
 *
 * There is no server or database behind the app (see docs/DATA_RETENTION.md), so everything here is
 * local to this browser. Nothing is sent anywhere and nothing remote is deleted.
 */
import {
  DATA_CATEGORIES,
  USER_DATA_STORES,
  USER_DATA_PREFIX_STORES,
  USER_DATA_SESSION_STORES,
  recordPrivacyAuditLog,
} from './privacyConsentService.js';

const safeStorage = (name) => {
  try {
    return globalThis[name] ?? null;
  } catch {
    return null;
  }
};

const CATEGORY_IDS = DATA_CATEGORIES.map((c) => c.id);

/** True only for a localStorage key the app owns (exact key or journey-progress style prefix). */
export function isOwnedLocalKey(key) {
  if (typeof key !== 'string' || !key) return false;
  return (
    USER_DATA_STORES.some((s) => s.key === key) ||
    USER_DATA_PREFIX_STORES.some((s) => key.startsWith(s.prefix) && key.length > s.prefix.length)
  );
}

export function isOwnedSessionKey(key) {
  return typeof key === 'string' && USER_DATA_SESSION_STORES.some((s) => s.key === key);
}

/**
 * Removes one key and checks that it is really gone. Throws for a key the app does not own, so a
 * bug or a crafted category list can never delete someone else's storage.
 */
export function removeOwnedKey(storage, key, { session = false } = {}) {
  const owned = session ? isOwnedSessionKey(key) : isOwnedLocalKey(key);
  if (!owned) {
    throw new Error(`Refused: "${String(key)}" is not a key this app owns.`);
  }
  storage.removeItem(key);
  if (storage.getItem(key) !== null) {
    throw new Error('The browser did not remove this item.');
  }
}

// Keys currently stored for one category, as { key, session } entries.
function keysForCategory(categoryId, local, session) {
  const entries = [];
  for (const store of USER_DATA_STORES) {
    if (store.category === categoryId && local && local.getItem(store.key) !== null) {
      entries.push({ key: store.key, session: false });
    }
  }
  for (const { prefix, category } of USER_DATA_PREFIX_STORES) {
    if (category !== categoryId || !local) continue;
    const found = [];
    for (let i = 0; i < (local.length || 0); i += 1) {
      const key = local.key(i);
      if (key && isOwnedLocalKey(key) && key.startsWith(prefix)) found.push(key);
    }
    found.forEach((key) => entries.push({ key, session: false }));
  }
  for (const store of USER_DATA_SESSION_STORES) {
    if (store.category === categoryId && session && session.getItem(store.key) !== null) {
      entries.push({ key: store.key, session: true });
    }
  }
  return entries;
}

// A rough "how many records" number for the screen: array length, object key count, else 1.
function countRecords(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).length;
  } catch {
    // not JSON, counts as one stored value
  }
  return 1;
}

/**
 * What is stored right now, per category, so the screen can show it before anything is deleted.
 * @returns {{id: string, label: string, copiesOf: string[], keyCount: number, recordCount: number}[]}
 */
export function getStoredDataSummary({ local = safeStorage('localStorage'), session = safeStorage('sessionStorage') } = {}) {
  return DATA_CATEGORIES.map((category) => {
    let keyCount = 0;
    let recordCount = 0;
    try {
      for (const { key, session: inSession } of keysForCategory(category.id, local, session)) {
        const raw = (inSession ? session : local).getItem(key);
        keyCount += 1;
        recordCount += countRecords(raw);
      }
    } catch {
      // storage unreadable: show what was counted so far
    }
    return { ...category, keyCount, recordCount };
  });
}

/**
 * Category ids that will really be cleared for a request: the chosen ones plus any copy-only
 * category that duplicates them (offline cache follows tracking and saved).
 * @returns {{ids: string[], auto: string[]}}
 */
export function expandCategories(requested) {
  const chosen = [...new Set(requested)];
  const unknown = chosen.filter((id) => !CATEGORY_IDS.includes(id));
  if (unknown.length) throw new Error(`Unknown data category: ${unknown.join(', ')}`);
  const auto = DATA_CATEGORIES.filter(
    (c) => !chosen.includes(c.id) && c.copiesOf.some((id) => chosen.includes(id))
  ).map((c) => c.id);
  return { ids: DATA_CATEGORIES.map((c) => c.id).filter((id) => chosen.includes(id) || auto.includes(id)), auto };
}

/**
 * Deletes the chosen categories and reports what happened for each one.
 * A failure in one key or category never stops the others and is never hidden: the matching
 * result row has status "partial" or "failed" with the key names and the error.
 *
 * @param {Object} options
 * @param {string[]} options.categories - ids from DATA_CATEGORIES
 * @param {string} options.actorId - who asks for the deletion (signed-in user id, or "device")
 * @param {string} [options.ownerId] - whose data it is, defaults to actorId. Different from actorId = rejected.
 * @returns {{ok: boolean, clearedAt: string, results: Object[]}}
 */
export function clearUserData({
  categories,
  actorId,
  ownerId = actorId,
  local = safeStorage('localStorage'),
  session = safeStorage('sessionStorage'),
} = {}) {
  if (!actorId) {
    throw new Error('Authorization Error: Missing user context.');
  }
  // Unlike enforceAuthorization() there is no admin override: nobody deletes another person's records.
  if (actorId !== ownerId) {
    recordPrivacyAuditLog('UNAUTHORIZED_DELETE_BLOCKED', { attemptedAccessOn: ownerId }, actorId);
    throw new Error(`Access Denied: "${actorId}" cannot delete records owned by "${ownerId}".`);
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    throw new Error('Choose at least one category to clear.');
  }
  const { ids, auto } = expandCategories(categories);

  const results = ids.map((id) => {
    const category = DATA_CATEGORIES.find((c) => c.id === id);
    const row = { id, label: category.label, auto: auto.includes(id), status: 'nothing', removed: 0, failed: [] };
    let entries;
    try {
      entries = keysForCategory(id, local, session);
    } catch (err) {
      row.status = 'failed';
      row.failed.push({ key: '(storage)', error: err?.message || 'Storage is not readable.' });
      return row;
    }
    for (const { key, session: inSession } of entries) {
      try {
        removeOwnedKey(inSession ? session : local, key, { session: inSession });
        row.removed += 1;
      } catch (err) {
        row.failed.push({ key, error: err?.message || 'Could not remove this item.' });
      }
    }
    if (row.failed.length) row.status = row.removed ? 'partial' : 'failed';
    else if (row.removed) row.status = 'cleared';
    return row;
  });

  recordPrivacyAuditLog(
    'USER_DATA_CLEARED',
    {
      categories: ids,
      clearedCategories: results.filter((r) => r.status === 'cleared').map((r) => r.id),
      failedKeysCount: results.reduce((sum, r) => sum + r.failed.length, 0),
    },
    actorId
  );

  return {
    ok: results.every((r) => r.status !== 'partial' && r.status !== 'failed'),
    clearedAt: new Date().toISOString(),
    results,
  };
}
