import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  STATUS_META,
  buildStages,
  getStatusMeta,
  normalizeStatus,
  formatDisplayDate,
  getApplications,
  getApplicationById,
  createApplication,
  addManualApplication,
  DUPLICATE_APPLICATION,
  resolveApplicationPendingAction,
  getTrackingMetrics,
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

const flags = (stages) =>
  stages.map((s) => [!!s.completed, !!s.inProgress, !!s.actionRequired]);

const blank = [{ title: 'a' }, { title: 'b' }, { title: 'c' }, { title: 'd' }];

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
});

describe('buildStages', () => {
  it('submitted: only the first stage is done', () => {
    expect(flags(buildStages('submitted', blank))).toEqual([
      [true, false, false],
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ]);
  });

  it('in-progress: stage 1 is active and not completed', () => {
    expect(flags(buildStages('in-progress', blank))).toEqual([
      [true, false, false],
      [false, true, false],
      [false, false, false],
      [false, false, false],
    ]);
  });

  it('action-required: stage 1 needs action and not completed', () => {
    expect(flags(buildStages('action-required', blank))).toEqual([
      [true, false, false],
      [false, false, true],
      [false, false, false],
      [false, false, false],
    ]);
  });

  it('completed: every stage is done', () => {
    expect(flags(buildStages('completed', blank))).toEqual([
      [true, false, false],
      [true, false, false],
      [true, false, false],
      [true, false, false],
    ]);
  });

  it('unknown status behaves like submitted', () => {
    expect(buildStages('banana', blank)).toEqual(buildStages('submitted', blank));
  });

  it('handles a missing stages array and keeps titles', () => {
    expect(buildStages('completed', undefined)).toEqual([]);
    expect(buildStages('completed', blank).map((s) => s.title)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('clears stale flags passed in', () => {
    const [, second] = buildStages('in-progress', [
      { completed: true, inProgress: true },
      { completed: true, inProgress: true, actionRequired: true },
    ]);
    expect(flags([second])).toEqual([[false, true, false]]);
  });
});

describe('status labels', () => {
  it('has the expected label for every status', () => {
    expect(getStatusMeta('submitted').label).toBe('Submitted');
    expect(getStatusMeta('in-progress').label).toBe('In Progress');
    expect(getStatusMeta('action-required').label).toBe('Action Required');
    expect(getStatusMeta('completed').label).toBe('Completed');
  });

  it('gives each status a colour', () => {
    Object.values(STATUS_META).forEach((m) => {
      expect(m.color).toBeTruthy();
      expect(m.background).toBeTruthy();
    });
  });

  it('falls back to Submitted for unknown or missing status', () => {
    expect(getStatusMeta('weird').label).toBe('Submitted');
    expect(getStatusMeta(undefined).label).toBe('Submitted');
    expect(normalizeStatus(null)).toBe('submitted');
  });
});

describe('formatDisplayDate', () => {
  it('shows Not available for bad values', () => {
    ['', '   ', undefined, null, 'Invalid Date', 'undefined', 42].forEach((v) => {
      expect(formatDisplayDate(v)).toBe('Not available');
    });
  });

  it('keeps readable text', () => {
    expect(formatDisplayDate('Oct 12, 2026')).toBe('Oct 12, 2026');
    expect(formatDisplayDate('Within 15 days')).toBe('Within 15 days');
  });
});

describe('addManualApplication', () => {
  const add = (status) =>
    addManualApplication({ referenceId: `ref-${status}`, serviceName: 'Test', status });

  it.each([
    ['submitted', 0],
    ['in-progress', 1],
    ['action-required', 1],
    ['completed', 3],
  ])('%s gives consistent flags and stage index', (status, index) => {
    const app = add(status);
    expect(app.currentStageIndex).toBe(index);
    expect(flags(app.stages)).toEqual(flags(buildStages(status, app.stages)));
    app.stages.forEach((s) => {
      expect(s.completed && (s.inProgress || s.actionRequired)).toBeFalsy();
    });
  });

  it('in-progress is no longer completed and in progress at once', () => {
    const app = add('in-progress');
    expect(app.stages[1].completed).toBe(false);
    expect(app.stages[1].inProgress).toBe(true);
  });

  it('only action-required gets a pending action', () => {
    expect(add('action-required').pendingAction).not.toBeNull();
    expect(add('in-progress').pendingAction).toBeNull();
  });

  it('stores an unknown status as submitted', () => {
    expect(add('nonsense').status).toBe('submitted');
  });
});

describe('addManualApplication with an id that is already tracked', () => {
  const stored = () => JSON.parse(localStorage.getItem('civicbridge_applications'));

  it('throws DUPLICATE_APPLICATION and keeps the old record untouched', () => {
    addManualApplication({ referenceId: 'SRV-1', serviceName: 'Test A', initialNote: 'first note' });
    const before = stored();

    let error;
    try {
      addManualApplication({ referenceId: 'SRV-1', serviceName: 'Test B' });
    } catch (err) {
      error = err;
    }

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(DUPLICATE_APPLICATION);
    expect(error.message).toContain('SRV-1');
    expect(stored()).toEqual(before);
    const kept = getApplicationById('SRV-1');
    expect(kept.serviceName).toBe('Test A');
    expect(kept.notes).toHaveLength(1);
  });

  it('treats case and surrounding spaces as the same id', () => {
    addManualApplication({ referenceId: 'SRV-1', serviceName: 'Test A' });
    expect(() => addManualApplication({ referenceId: '  srv-1 ', serviceName: 'Test B' })).toThrow(
      /already tracking SRV-1/
    );
    expect(stored().filter((app) => app.id === 'SRV-1')).toHaveLength(1);
  });

  it('refuses an id that clashes with a seeded demo application', () => {
    expect(() => addManualApplication({ referenceId: 'srv-98234710', serviceName: 'Mine' })).toThrow(
      expect.objectContaining({ code: DUPLICATE_APPLICATION })
    );
    const seeded = getApplicationById('SRV-98234710');
    expect(seeded.serviceName).toBe('Income Certificate');
    expect(seeded.notes.length).toBeGreaterThan(0);
  });

  it('still adds an application with a new id on top of the list', () => {
    addManualApplication({ referenceId: 'SRV-1', serviceName: 'Test A' });
    const second = addManualApplication({ referenceId: 'SRV-2', serviceName: 'Test B' });
    const ids = stored().map((app) => app.id);
    expect(ids[0]).toBe(second.id);
    expect(ids).toEqual(expect.arrayContaining(['SRV-1', 'SRV-2']));
  });
});

describe('createApplication', () => {
  it('creates a submitted application with matching flags', () => {
    const app = createApplication({ serviceName: 'Passport' });
    expect(app.status).toBe('submitted');
    expect(flags(app.stages)).toEqual(flags(buildStages('submitted', app.stages)));
    expect(getApplicationById(app.id).status).toBe('submitted');
  });
});

describe('resolveApplicationPendingAction', () => {
  it('moves an action-required application back to in-progress', () => {
    const app = addManualApplication({ referenceId: 'ACT-1', serviceName: 'X', status: 'action-required' });
    const result = resolveApplicationPendingAction(app.id, 'Uploaded copy');
    expect(result.status).toBe('in-progress');
    expect(result.pendingAction).toBeNull();
    expect(flags(result.stages)).toEqual(flags(buildStages('in-progress', result.stages)));
    expect(result.stages[1].actionRequired).toBe(false);
    expect(result.stages[1].inProgress).toBe(true);
    expect(result.notes.at(-1).text).toContain('Uploaded copy');
    expect(getApplicationById('ACT-1').status).toBe('in-progress');
  });

  it('resolving twice changes nothing the second time', () => {
    const app = addManualApplication({ referenceId: 'ACT-2', serviceName: 'X', status: 'action-required' });
    resolveApplicationPendingAction(app.id, 'first');
    const before = JSON.stringify(getApplicationById('ACT-2'));
    const again = resolveApplicationPendingAction(app.id, 'second');
    expect(again.status).toBe('in-progress');
    expect(JSON.stringify(getApplicationById('ACT-2'))).toBe(before);
  });

  it('does not touch a completed application', () => {
    const app = addManualApplication({ referenceId: 'DONE-1', serviceName: 'X', status: 'completed' });
    resolveApplicationPendingAction(app.id);
    expect(getApplicationById('DONE-1').status).toBe('completed');
  });

  it('returns null for an unknown id', () => {
    expect(resolveApplicationPendingAction('NOPE')).toBeNull();
  });
});

describe('reading saved data', () => {
  it('fixes old records whose flags disagree with the status', () => {
    localStorage.setItem(
      'civicbridge_applications',
      JSON.stringify([
        {
          id: 'OLD-1',
          serviceName: 'Old',
          status: 'in-progress',
          stages: [
            { title: 'a', completed: true },
            { title: 'b', completed: true, inProgress: true },
            { title: 'c', completed: false },
          ],
        },
        { id: 'OLD-2', serviceName: 'Odd', status: 'mystery' },
      ])
    );
    const [one, two] = getApplications();
    expect(flags(one.stages)).toEqual([
      [true, false, false],
      [false, true, false],
      [false, false, false],
    ]);
    expect(two.status).toBe('submitted');
    expect(two.stages).toEqual([]);
  });

  it('falls back to demo data for broken or non-list storage', () => {
    localStorage.setItem('civicbridge_applications', '{not json');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(getApplications().length).toBeGreaterThan(0);
    localStorage.setItem('civicbridge_applications', '{"a":1}');
    expect(getApplications().length).toBeGreaterThan(0);
  });

  it('counts every application in exactly one metric', () => {
    addManualApplication({ referenceId: 'M-1', serviceName: 'X', status: 'completed' });
    const m = getTrackingMetrics();
    expect(m.inProgress + m.actionRequired + m.completed + m.submitted).toBe(m.total);
  });
});
