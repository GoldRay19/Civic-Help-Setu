import { describe, it, expect, beforeEach, vi } from 'vitest';

const makeStorage = () => {
  const data = new Map();
  return {
    getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
    setItem: vi.fn((k, v) => data.set(k, String(v))),
    removeItem: vi.fn((k) => data.delete(k)),
  };
};

describe('savedStorage', () => {
  let mod;
  beforeEach(async () => {
    vi.stubGlobal('localStorage', makeStorage());
    mod = await import('./savedStorage');
  });

  it('returns an empty list for a new user', () => {
    expect(mod.getSavedItems()).toEqual([]);
  });

  it('still empty after reading twice (nothing is seeded)', () => {
    mod.getSavedItems();
    expect(mod.getSavedItems()).toEqual([]);
  });

  it('saves and removes an item', () => {
    mod.saveItem('pan-card');
    expect(mod.getSavedItems()).toHaveLength(1);
    mod.removeItem('pan-card');
    expect(mod.getSavedItems()).toEqual([]);
  });

  it('falls back to an empty list on corrupt data', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('civicbridge_saved_rich', '{oops');
    expect(mod.getSavedItems()).toEqual([]);
  });
});
