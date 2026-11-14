// Persistence and client-side isolation for Rental Move-In/Move-Out Civic Records (#726).
// Stores checklist items, dated meter readings, fixture inventory notes, and optional local photo references
// strictly inside client-side localStorage. No citizen data is sent to external servers.

export const RENTAL_CHECKLIST_KEY = 'civic_rental_transition_checklists_v1';

const getDefaultStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const readMap = (storage) => {
  try {
    const raw = storage.getItem(RENTAL_CHECKLIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

/**
 * Reads the stored rental checklist state for a specific transition record.
 */
export const readRentalChecklist = (transitionId, storage = getDefaultStorage()) => {
  if (!transitionId || !storage) {
    return {
      transitionId: transitionId || '',
      completedInstructions: {},
      meterReadings: [],
      inventoryStatus: {},
      privatePhotoReferences: [],
      notes: '',
      rev: 0,
      updatedAt: null,
    };
  }

  const map = readMap(storage);
  const entry = map[transitionId];
  if (!entry || typeof entry !== 'object') {
    return {
      transitionId,
      completedInstructions: {},
      meterReadings: [],
      inventoryStatus: {},
      privatePhotoReferences: [],
      notes: '',
      rev: 0,
      updatedAt: null,
    };
  }

  const rev = Number.isInteger(entry.rev) && entry.rev >= 0 ? entry.rev : 0;
  return {
    transitionId,
    completedInstructions: entry.completedInstructions && typeof entry.completedInstructions === 'object' ? entry.completedInstructions : {},
    meterReadings: Array.isArray(entry.meterReadings) ? entry.meterReadings : [],
    inventoryStatus: entry.inventoryStatus && typeof entry.inventoryStatus === 'object' ? entry.inventoryStatus : {},
    privatePhotoReferences: Array.isArray(entry.privatePhotoReferences) ? entry.privatePhotoReferences : [],
    notes: typeof entry.notes === 'string' ? entry.notes : '',
    rev,
    updatedAt: entry.updatedAt || null,
  };
};

/**
 * Saves a full rental checklist state with optimistic concurrency check (expectedRev).
 */
export const saveRentalChecklist = (
  transitionId,
  state,
  expectedRev = null,
  storage = getDefaultStorage()
) => {
  if (!transitionId || !storage) {
    return { success: false, reason: 'invalid_params' };
  }

  try {
    const map = readMap(storage);
    const existing = map[transitionId];
    const currentRev = existing && Number.isInteger(existing.rev) ? existing.rev : 0;

    if (expectedRev !== null && expectedRev !== currentRev) {
      return { success: false, reason: 'rev_conflict', currentRev };
    }

    const nextRev = currentRev + 1;
    const payload = {
      transitionId,
      completedInstructions: state?.completedInstructions || {},
      meterReadings: Array.isArray(state?.meterReadings) ? state.meterReadings : [],
      inventoryStatus: state?.inventoryStatus || {},
      privatePhotoReferences: Array.isArray(state?.privatePhotoReferences) ? state.privatePhotoReferences : [],
      notes: typeof state?.notes === 'string' ? state.notes.slice(0, 5000) : '',
      rev: nextRev,
      updatedAt: new Date().toISOString(),
    };

    map[transitionId] = payload;
    storage.setItem(RENTAL_CHECKLIST_KEY, JSON.stringify(map));
    return { success: true, rev: nextRev, data: payload };
  } catch (err) {
    return { success: false, reason: err.message };
  }
};

/**
 * Records or updates a dated utility meter reading.
 */
export const recordMeterReading = (
  transitionId,
  readingData,
  storage = getDefaultStorage()
) => {
  if (!transitionId || !readingData || !storage) return false;
  const current = readRentalChecklist(transitionId, storage);

  const cleanReading = {
    id: readingData.id || `meter-${Date.now()}`,
    meterType: readingData.meterType || 'electricity',
    readingValue: String(readingData.readingValue || '').trim(),
    unit: readingData.unit || 'kWh',
    readingDate: readingData.readingDate || new Date().toISOString().slice(0, 10),
    jointConfirmed: Boolean(readingData.jointConfirmed),
    notes: typeof readingData.notes === 'string' ? readingData.notes.slice(0, 500) : '',
    recordedAt: new Date().toISOString(),
  };

  const existingIndex = current.meterReadings.findIndex((m) => m.id === cleanReading.id);
  const updatedReadings = [...current.meterReadings];
  if (existingIndex >= 0) {
    updatedReadings[existingIndex] = cleanReading;
  } else {
    updatedReadings.push(cleanReading);
  }

  return saveRentalChecklist(
    transitionId,
    { ...current, meterReadings: updatedReadings },
    current.rev,
    storage
  );
};

/**
 * Updates a handover inventory item check state and optional local photo filename reference.
 */
export const updateInventoryItem = (
  transitionId,
  itemId,
  isChecked,
  localPhotoRef = null,
  storage = getDefaultStorage()
) => {
  if (!transitionId || !itemId || !storage) return false;
  const current = readRentalChecklist(transitionId, storage);

  const updatedStatus = {
    ...current.inventoryStatus,
    [itemId]: {
      checked: Boolean(isChecked),
      photoReference: typeof localPhotoRef === 'string' ? localPhotoRef.slice(0, 255) : (current.inventoryStatus[itemId]?.photoReference || null),
      verifiedAt: isChecked ? new Date().toISOString() : null,
    },
  };

  return saveRentalChecklist(
    transitionId,
    { ...current, inventoryStatus: updatedStatus },
    current.rev,
    storage
  );
};

/**
 * Deletes a stored rental transition checklist completely (#726 requirement 10).
 */
export const deleteRentalChecklist = (transitionId, storage = getDefaultStorage()) => {
  if (!transitionId || !storage) return false;
  try {
    const map = readMap(storage);
    if (map[transitionId]) {
      delete map[transitionId];
      storage.setItem(RENTAL_CHECKLIST_KEY, JSON.stringify(map));
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Calculates transition readiness score (0 - 100%) based on official instructions and meter readings.
 */
export const calculateTransitionReadiness = (transition, checklistState) => {
  if (!transition) {
    return { score: 0, totalItems: 0, completedCount: 0, missingItems: [] };
  }

  const instructions = Array.isArray(transition.officialInstructions) ? transition.officialInstructions : [];
  const completedInstructions = checklistState?.completedInstructions || {};
  const meterReadings = Array.isArray(checklistState?.meterReadings) ? checklistState.meterReadings : [];
  const inventoryStatus = checklistState?.inventoryStatus || {};

  let totalItems = instructions.length;
  let completedCount = 0;
  const missingItems = [];

  // Check official instructions
  instructions.forEach((inst, idx) => {
    const key = `inst-${idx}`;
    if (completedInstructions[key]) {
      completedCount += 1;
    } else {
      missingItems.push({
        type: 'instruction',
        id: key,
        label: inst,
      });
    }
  });

  // Check meter reading if applicable
  if (transition.meterReadingConfig?.isApplicable) {
    totalItems += 1;
    const hasReading = meterReadings.some((r) => r.readingValue && r.readingValue.length > 0);
    if (hasReading) {
      completedCount += 1;
    } else {
      missingItems.push({
        type: 'meter_reading',
        id: 'meter-reading-required',
        label: `Record dated ${transition.meterReadingConfig.meterType} meter reading (${transition.meterReadingConfig.unit})`,
      });
    }
  }

  // Check mandatory handover inventory items
  const inventory = Array.isArray(transition.handoverInventory) ? transition.handoverInventory : [];
  inventory.forEach((item) => {
    if (item.requiredForMoveOut && transition.stage === 'move_out') {
      totalItems += 1;
      if (inventoryStatus[item.id]?.checked) {
        completedCount += 1;
      } else {
        missingItems.push({
          type: 'inventory',
          id: item.id,
          label: item.label,
        });
      }
    }
  });

  const score = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 100;

  return {
    score,
    totalItems,
    completedCount,
    missingItems,
  };
};

