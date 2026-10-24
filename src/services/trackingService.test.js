import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getApplications,
  createApplication,
  addManualApplication,
  resolveApplicationPendingAction,
  getTrackingMetrics,
  getStatusLabel,
  normalizeStatus,
  normalizeDate,
  applyStageFlags,
  DATE_FALLBACK,
} from './trackingService';

const makeStorage = () => {
  const data = new Map();
  return {
    getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
    setItem: vi.fn((k, v) => data.set(k, String(v))),
    removeItem: vi.fn((k) => data.delete(k)),
    clear: vi.fn(() => data.clear()),
  };
};

// [completed, inProgress, actionRequired] per stage
const flags = (app) => app.stages.map((s) => [!!s.completed, !!s.inProgress, !!s.actionRequired]);

describe('trackingService status and stage consistency', () => {
  let storage;
  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('never marks a stage as both completed and active', () => {
    for (const status of ['submitted', 'in-progress', 'action-required', 'completed']) {
      const app = addManualApplication({ referenceId: `ref-${status}`, serviceName: 'Test', status });
      for (const s of app.stages) {
        expect(s.completed && (s.inProgress || s.actionRequired)).toBeFalsy();
      }
    }
  });

  it('builds the right flags for each status', () => {
    const f = (status) => flags(addManualApplication({ referenceId: 'x1', serviceName: 'T', status }));
    expect(f('submitted')).toEqual([[true, false, false], [false, false, false], [false, false, false], [false, false, false]]);
    expect(f('in-progress')).toEqual([[true, false, false], [false, true, false], [false, false, false], [false, false, false]]);
    expect(f('action-required')).toEqual([[true, false, false], [false, false, true], [false, false, false], [false, false, false]]);
    expect(f('completed')).toEqual([[true, false, false], [true, false, false], [true, false, false], [true, false, false]]);
  });

  it('keeps currentStageIndex and pendingAction in line with status', () => {
    expect(addManualApplication({ referenceId: 'a1', serviceName: 'T', status: 'submitted' }).currentStageIndex).toBe(0);
    expect(addManualApplication({ referenceId: 'a2', serviceName: 'T', status: 'in-progress' }).currentStageIndex).toBe(1);
    const act = addManualApplication({ referenceId: 'a3', serviceName: 'T', status: 'action-required' });
    expect(act.currentStageIndex).toBe(1);
    expect(act.pendingAction).not.toBeNull();
    const done = addManualApplication({ referenceId: 'a4', serviceName: 'T', status: 'completed' });
    expect(done.currentStageIndex).toBe(3);
    expect(done.pendingAction).toBeNull();
  });

  it('falls back to submitted for an unknown status', () => {
    const app = addManualApplication({ referenceId: 'bad1', serviceName: 'T', status: 'weird' });
    expect(app.status).toBe('submitted');
    expect(normalizeStatus(undefined)).toBe('submitted');
    expect(getStatusLabel('weird')).toBe('Submitted');
  });

  it('gives a friendly label for every status', () => {
    expect(getStatusLabel('submitted')).toBe('Submitted');
    expect(getStatusLabel('in-progress')).toBe('In Progress');
    expect(getStatusLabel('action-required')).toBe('Action Required');
    expect(getStatusLabel('completed')).toBe('Completed');
  });

  it('creates new applications with consistent submitted stages', () => {
    const app = createApplication({ serviceName: 'Test' });
    expect(app.status).toBe('submitted');
    expect(flags(app)[0]).toEqual([true, false, false]);
    expect(app.stages.some((s) => s.inProgress)).toBe(false);
  });

  it('repairs old stored data with contradicting flags on read', () => {
    const broken = [{
      id: 'SRV-1', serviceName: 'Old', status: 'in-progress', appliedDate: 'Oct 12, 2026', estimatedCompletion: 'soon',
      stages: [
        { title: 'a', completed: true },
        { title: 'b', completed: true, inProgress: true },
        { title: 'c', completed: false },
      ],
    }];
    storage.setItem('civicbridge_applications', JSON.stringify(broken));
    const [app] = getApplications();
    expect(flags(app)).toEqual([[true, false, false], [false, true, false], [false, false, false]]);
    expect(app.estimatedCompletion).toBe(DATE_FALLBACK);
  });

  it('survives a missing stages array and non-array storage', () => {
    storage.setItem('civicbridge_applications', JSON.stringify([{ id: 'SRV-2', status: 'completed' }]));
    expect(getApplications()[0].stages).toEqual([]);
    storage.setItem('civicbridge_applications', JSON.stringify({ nope: true }));
    expect(getApplications().length).toBeGreaterThan(0);
  });

  describe('resolveApplicationPendingAction', () => {
    it('moves the timeline from action required to in progress', () => {
      addManualApplication({ referenceId: 'res1', serviceName: 'T', status: 'action-required' });
      const before = getTrackingMetrics();
      const app = resolveApplicationPendingAction('RES1', 'uploaded');
      expect(app.status).toBe('in-progress');
      expect(app.pendingAction).toBeNull();
      expect(flags(app)[1]).toEqual([false, true, false]);
      expect(app.notes.at(-1).text).toContain('uploaded');
      const after = getTrackingMetrics();
      expect(after.actionRequired).toBe(before.actionRequired - 1);
      expect(after.inProgress).toBe(before.inProgress + 1);
    });

    it('does nothing when the action was already resolved', () => {
      addManualApplication({ referenceId: 'res2', serviceName: 'T', status: 'completed' });
      const app = resolveApplicationPendingAction('RES2', 'again');
      expect(app.status).toBe('completed');
      expect(app.stages.every((s) => s.completed)).toBe(true);
    });

    it('returns null for an unknown id', () => {
      expect(resolveApplicationPendingAction('NOPE')).toBeNull();
    });
  });

  describe('date normalization', () => {
    it('formats parseable dates the same way', () => {
      expect(normalizeDate('2026-11-15')).toMatch(/^Nov 1[45], 2026$/);
      expect(normalizeDate('Nov 15, 2026')).toBe('Nov 15, 2026');
    });

    it('returns the fallback for empty, invalid or year-less input', () => {
      expect(normalizeDate('')).toBe(DATE_FALLBACK);
      expect(normalizeDate(null)).toBe(DATE_FALLBACK);
      expect(normalizeDate('not a date')).toBe(DATE_FALLBACK);
      expect(normalizeDate('Nov 15')).toBe(DATE_FALLBACK);
    });

    it('stores normalized dates for manual applications', () => {
      const app = addManualApplication({ referenceId: 'd1', serviceName: 'T', appliedDate: 'garbage', estimatedCompletion: '2026-12-01' });
      expect(app.appliedDate).toBe(DATE_FALLBACK);
      expect(app.estimatedCompletion).toMatch(/^(Nov 30|Dec 1), 2026$/);
    });
  });

  it('applyStageFlags tolerates non-array input', () => {
    expect(applyStageFlags(undefined, 'completed')).toEqual([]);
  });
});
