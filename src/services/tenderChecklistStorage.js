// Persistence and state management for Tender Participation Readiness Workspace (#722).
// Stores vendor checklist items, evidence tracking notes, and MSME exemption preferences
// strictly inside client-side localStorage. No vendor data is sent to external servers.

export const TENDER_CHECKLIST_KEY = 'civic_tender_readiness_checklists_v1';

export const CHECKLIST_STATUSES = ['not_started', 'in_progress', 'ready', 'exempt'];

const getDefaultStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const readMap = (storage) => {
  try {
    const raw = storage.getItem(TENDER_CHECKLIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

/**
 * Reads the stored vendor checklist state for a specific tender.
 */
export const readTenderChecklist = (tenderId, storage = getDefaultStorage()) => {
  if (!tenderId || !storage) {
    return {
      tenderId: tenderId || '',
      items: {},
      msmeStatus: {
        isClaimingMsmeExemption: false,
        isDpiitStartup: false,
        isClass1LocalSupplier: false,
      },
      vendorNotes: '',
      rev: 0,
    };
  }

  const map = readMap(storage);
  const entry = map[tenderId];
  if (!entry || typeof entry !== 'object') {
    return {
      tenderId,
      items: {},
      msmeStatus: {
        isClaimingMsmeExemption: false,
        isDpiitStartup: false,
        isClass1LocalSupplier: false,
      },
      vendorNotes: '',
      rev: 0,
    };
  }

  const rev = Number.isInteger(entry.rev) && entry.rev >= 0 ? entry.rev : 0;
  return {
    tenderId,
    items: entry.items && typeof entry.items === 'object' ? entry.items : {},
    msmeStatus: {
      isClaimingMsmeExemption: Boolean(entry.msmeStatus?.isClaimingMsmeExemption),
      isDpiitStartup: Boolean(entry.msmeStatus?.isDpiitStartup),
      isClass1LocalSupplier: Boolean(entry.msmeStatus?.isClass1LocalSupplier),
    },
    vendorNotes: typeof entry.vendorNotes === 'string' ? entry.vendorNotes : '',
    rev,
    updatedAt: entry.updatedAt || null,
  };
};

/**
 * Saves a full tender checklist state with optimistic concurrency check (expectedRev).
 */
export const saveTenderChecklist = (
  tenderId,
  data,
  expectedRev,
  storage = getDefaultStorage()
) => {
  if (!tenderId || !storage) return { ok: false, reason: 'error' };

  try {
    const current = readTenderChecklist(tenderId, storage);
    if (current.rev !== expectedRev) {
      return { ok: false, reason: 'conflict', state: current };
    }

    const map = readMap(storage);
    const nextRev = current.rev + 1;
    const nextState = {
      tenderId,
      items: data.items && typeof data.items === 'object' ? data.items : {},
      msmeStatus: {
        isClaimingMsmeExemption: Boolean(data.msmeStatus?.isClaimingMsmeExemption),
        isDpiitStartup: Boolean(data.msmeStatus?.isDpiitStartup),
        isClass1LocalSupplier: Boolean(data.msmeStatus?.isClass1LocalSupplier),
      },
      vendorNotes: typeof data.vendorNotes === 'string' ? data.vendorNotes.slice(0, 1000) : '',
      rev: nextRev,
      updatedAt: new Date().toISOString(),
    };

    map[tenderId] = nextState;
    storage.setItem(TENDER_CHECKLIST_KEY, JSON.stringify(map));
    return { ok: true, state: nextState };
  } catch {
    return { ok: false, reason: 'error' };
  }
};

/**
 * Updates a single requirement item status or document reference note.
 */
export const updateChecklistItem = (
  tenderId,
  itemId,
  updates,
  expectedRev,
  storage = getDefaultStorage()
) => {
  const current = readTenderChecklist(tenderId, storage);
  if (current.rev !== expectedRev) {
    return { ok: false, reason: 'conflict', state: current };
  }

  const existingItem = current.items[itemId] || { status: 'not_started', notes: '', documentRef: '' };
  const updatedItems = {
    ...current.items,
    [itemId]: {
      ...existingItem,
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  };

  return saveTenderChecklist(
    tenderId,
    {
      items: updatedItems,
      msmeStatus: current.msmeStatus,
      vendorNotes: current.vendorNotes,
    },
    expectedRev,
    storage
  );
};

/**
 * Deletes a stored vendor checklist completely (#722 requirement 10).
 */
export const deleteTenderChecklist = (tenderId, storage = getDefaultStorage()) => {
  if (!tenderId || !storage) return false;
  try {
    const map = readMap(storage);
    if (map[tenderId]) {
      delete map[tenderId];
      storage.setItem(TENDER_CHECKLIST_KEY, JSON.stringify(map));
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Calculates a vendor readiness score (0 - 100%) based on tender mandatory criteria.
 */
export const calculateReadinessScore = (tender, checklistState) => {
  if (!tender || !tender.eligibilityCriteria || !Array.isArray(tender.eligibilityCriteria.mandatory)) {
    return { score: 0, totalMandatory: 0, completedCount: 0, missingItems: [] };
  }

  const mandatory = tender.eligibilityCriteria.mandatory;
  const items = checklistState?.items || {};
  const isClaimingMsme = Boolean(checklistState?.msmeStatus?.isClaimingMsmeExemption);

  let completed = 0;
  const missing = [];

  mandatory.forEach((req) => {
    const saved = items[req.id];
    // If it's the UDYAM certificate item but user is not claiming MSME exemption, it is not mandatory
    if (req.id === 'req-udyam' && !isClaimingMsme && !tender.financials?.emd?.isExemptForMsme) {
      completed += 1;
      return;
    }

    if (saved?.status === 'ready' || saved?.status === 'exempt') {
      completed += 1;
    } else {
      missing.push({
        id: req.id,
        label: req.label,
        evidenceRequired: req.evidenceRequired,
        status: saved?.status || 'not_started',
      });
    }
  });

  const total = mandatory.length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 100;

  return {
    score,
    totalMandatory: total,
    completedCount: completed,
    missingItems: missing,
  };
};

