import { describe, it, expect, beforeEach } from 'vitest';
import {
  readTenderChecklist,
  saveTenderChecklist,
  updateChecklistItem,
  deleteTenderChecklist,
  calculateReadinessScore,
} from './tenderChecklistStorage';

class MemoryStorage {
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

describe('tenderChecklistStorage (#722)', () => {
  let storage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('reads empty default state when no saved data exists', () => {
    const res = readTenderChecklist('tender-123', storage);
    expect(res.tenderId).toBe('tender-123');
    expect(res.items).toEqual({});
    expect(res.rev).toBe(0);
    expect(res.msmeStatus.isClaimingMsmeExemption).toBe(false);
  });

  it('saves checklist state and increments revision', () => {
    const initial = readTenderChecklist('tender-123', storage);
    const saveRes = saveTenderChecklist(
      'tender-123',
      {
        items: {
          'req-gstin': { status: 'ready', notes: 'GSTR-3B filed', documentRef: 'gst_oct26.pdf' },
        },
        msmeStatus: { isClaimingMsmeExemption: true },
        vendorNotes: 'Need to check bank guarantee template',
      },
      initial.rev,
      storage
    );

    expect(saveRes.ok).toBe(true);
    expect(saveRes.state.rev).toBe(1);

    const reloaded = readTenderChecklist('tender-123', storage);
    expect(reloaded.items['req-gstin'].status).toBe('ready');
    expect(reloaded.msmeStatus.isClaimingMsmeExemption).toBe(true);
    expect(reloaded.rev).toBe(1);
  });

  it('detects concurrency conflict when expectedRev is stale', () => {
    const initial = readTenderChecklist('tender-123', storage);
    saveTenderChecklist('tender-123', { items: {} }, initial.rev, storage);

    // Stale write attempt with rev 0
    const conflictRes = saveTenderChecklist('tender-123', { items: {} }, 0, storage);
    expect(conflictRes.ok).toBe(false);
    expect(conflictRes.reason).toBe('conflict');
    expect(conflictRes.state.rev).toBe(1);
  });

  it('updates single checklist item cleanly', () => {
    const initial = readTenderChecklist('tender-123', storage);
    const res1 = updateChecklistItem(
      'tender-123',
      'req-pan',
      { status: 'ready', documentRef: 'pan_card.pdf' },
      initial.rev,
      storage
    );
    expect(res1.ok).toBe(true);

    const reloaded = readTenderChecklist('tender-123', storage);
    expect(reloaded.items['req-pan'].status).toBe('ready');
    expect(reloaded.items['req-pan'].documentRef).toBe('pan_card.pdf');
  });

  it('allows users to permanently delete their saved checklist data (#722 req 10)', () => {
    saveTenderChecklist('tender-123', { items: { 'req-1': { status: 'ready' } } }, 0, storage);
    expect(readTenderChecklist('tender-123', storage).rev).toBe(1);

    const delRes = deleteTenderChecklist('tender-123', storage);
    expect(delRes).toBe(true);

    const afterDel = readTenderChecklist('tender-123', storage);
    expect(afterDel.rev).toBe(0);
    expect(afterDel.items).toEqual({});
  });

  it('calculates readiness score accurately against mandatory criteria', () => {
    const mockTender = {
      eligibilityCriteria: {
        mandatory: [
          { id: 'req-gstin', label: 'GSTIN', evidenceRequired: 'GST cert' },
          { id: 'req-pan', label: 'PAN', evidenceRequired: 'PAN cert' },
        ],
      },
    };

    const emptyScore = calculateReadinessScore(mockTender, { items: {} });
    expect(emptyScore.score).toBe(0);
    expect(emptyScore.totalMandatory).toBe(2);
    expect(emptyScore.completedCount).toBe(0);
    expect(emptyScore.missingItems.length).toBe(2);

    const partialScore = calculateReadinessScore(mockTender, {
      items: {
        'req-gstin': { status: 'ready' },
      },
    });
    expect(partialScore.score).toBe(50);
    expect(partialScore.completedCount).toBe(1);

    const fullScore = calculateReadinessScore(mockTender, {
      items: {
        'req-gstin': { status: 'ready' },
        'req-pan': { status: 'exempt' },
      },
    });
    expect(fullScore.score).toBe(100);
    expect(fullScore.missingItems.length).toBe(0);
  });
});
