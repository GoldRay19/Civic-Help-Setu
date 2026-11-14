import { describe, it, expect, beforeEach } from 'vitest';
import {
  readRentalChecklist,
  saveRentalChecklist,
  recordMeterReading,
  updateInventoryItem,
  deleteRentalChecklist,
  calculateTransitionReadiness,
  RENTAL_CHECKLIST_KEY,
} from './rentalChecklistStorage';

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('rentalChecklistStorage (#726)', () => {
  let storage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  it('reads empty default state for uninitialized transitionId', () => {
    const state = readRentalChecklist('bescom-move-in', storage);
    expect(state).toEqual({
      transitionId: 'bescom-move-in',
      completedInstructions: {},
      meterReadings: [],
      inventoryStatus: {},
      privatePhotoReferences: [],
      notes: '',
      rev: 0,
      updatedAt: null,
    });
  });

  it('saves state and increments revision correctly', () => {
    const res1 = saveRentalChecklist('bescom-move-in', { notes: 'First note' }, 0, storage);
    expect(res1.success).toBe(true);
    expect(res1.rev).toBe(1);

    const saved = readRentalChecklist('bescom-move-in', storage);
    expect(saved.notes).toBe('First note');
    expect(saved.rev).toBe(1);

    // Conflict detection on stale revision
    const resConflict = saveRentalChecklist('bescom-move-in', { notes: 'Stale' }, 0, storage);
    expect(resConflict.success).toBe(false);
    expect(resConflict.reason).toBe('rev_conflict');
  });

  it('records and updates dated utility meter readings', () => {
    const reading = {
      id: 'meter-101',
      meterType: 'electricity',
      readingValue: '14520.5',
      unit: 'kWh',
      readingDate: '2026-02-14',
      jointConfirmed: true,
      notes: 'Read with building manager present',
    };

    const res = recordMeterReading('bescom-move-in', reading, storage);
    expect(res.success).toBe(true);

    const state = readRentalChecklist('bescom-move-in', storage);
    expect(state.meterReadings.length).toBe(1);
    expect(state.meterReadings[0].readingValue).toBe('14520.5');
    expect(state.meterReadings[0].jointConfirmed).toBe(true);

    // Update same reading
    recordMeterReading('bescom-move-in', { ...reading, readingValue: '14525.0' }, storage);
    const updated = readRentalChecklist('bescom-move-in', storage);
    expect(updated.meterReadings.length).toBe(1);
    expect(updated.meterReadings[0].readingValue).toBe('14525.0');
  });

  it('updates inventory items and private photo file references', () => {
    const res = updateInventoryItem('bescom-move-in', 'inv-keys', true, 'keys_photo_ref.jpg', storage);
    expect(res.success).toBe(true);

    const state = readRentalChecklist('bescom-move-in', storage);
    expect(state.inventoryStatus['inv-keys'].checked).toBe(true);
    expect(state.inventoryStatus['inv-keys'].photoReference).toBe('keys_photo_ref.jpg');
  });

  it('deletes stored checklist completely', () => {
    saveRentalChecklist('bescom-move-in', { notes: 'Temporary data' }, 0, storage);
    expect(storage.getItem(RENTAL_CHECKLIST_KEY)).toContain('Temporary data');

    const deleted = deleteRentalChecklist('bescom-move-in', storage);
    expect(deleted).toBe(true);

    const state = readRentalChecklist('bescom-move-in', storage);
    expect(state.notes).toBe('');
    expect(state.rev).toBe(0);
  });

  it('accurately computes transition readiness score', () => {
    const transition = {
      stage: 'move_in',
      officialInstructions: ['Step 1', 'Step 2'],
      meterReadingConfig: {
        isApplicable: true,
        meterType: 'electricity',
        unit: 'kWh',
      },
      handoverInventory: [],
    };

    const emptyScore = calculateTransitionReadiness(transition, null);
    expect(emptyScore.score).toBe(0);
    expect(emptyScore.totalItems).toBe(3); // 2 steps + 1 meter reading

    const partialState = {
      completedInstructions: { 'inst-0': true },
      meterReadings: [{ readingValue: '1000' }],
    };
    const partialScore = calculateTransitionReadiness(transition, partialState);
    expect(partialScore.completedCount).toBe(2);
    expect(partialScore.score).toBe(67);

    const fullState = {
      completedInstructions: { 'inst-0': true, 'inst-1': true },
      meterReadings: [{ readingValue: '1000' }],
    };
    const fullScore = calculateTransitionReadiness(transition, fullState);
    expect(fullScore.completedCount).toBe(3);
    expect(fullScore.score).toBe(100);
  });
});

