import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeOffice,
  normalizeOffices,
  filterCivicOffices,
  getCachedUserCoordinates,
} from './locationService';

const makeOffice = (over = {}) => ({
  id: 'o1',
  name: 'Test Office',
  category: 'Revenue',
  channels: ['in-person'],
  serviceIds: ['birth-certificate'],
  state: 'Delhi',
  district: 'South Delhi',
  city: 'New Delhi',
  pincode: '110030',
  address: 'Somewhere',
  landmark: 'Near metro',
  coordinates: { lat: 28.52, lng: 77.21 },
  features: [],
  ...over,
});

const makeStorage = () => {
  const data = new Map();
  return {
    getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
    setItem: vi.fn((k, v) => data.set(k, String(v))),
    removeItem: vi.fn((k) => data.delete(k)),
  };
};

describe('normalizeOffice / normalizeOffices', () => {
  it('keeps a valid record', () => {
    expect(normalizeOffice(makeOffice())).toMatchObject({ id: 'o1', name: 'Test Office' });
  });

  it('drops records missing id, name or valid coordinates', () => {
    expect(normalizeOffice(null)).toBeNull();
    expect(normalizeOffice(makeOffice({ id: '' }))).toBeNull();
    expect(normalizeOffice(makeOffice({ name: undefined }))).toBeNull();
    expect(normalizeOffice(makeOffice({ coordinates: undefined }))).toBeNull();
    expect(normalizeOffice(makeOffice({ coordinates: { lat: 'x', lng: 77 } }))).toBeNull();
    expect(normalizeOffice(makeOffice({ coordinates: { lat: NaN, lng: 77 } }))).toBeNull();
    expect(normalizeOffice(makeOffice({ coordinates: { lat: 120, lng: 77 } }))).toBeNull();
  });

  it('keeps a coordinate of 0 (it is a real value)', () => {
    expect(normalizeOffice(makeOffice({ coordinates: { lat: 0, lng: 0 } }))).not.toBeNull();
  });

  it('defaults missing text and list fields', () => {
    const o = normalizeOffice(
      makeOffice({ state: undefined, landmark: null, pincode: 110030, channels: 'online', features: undefined })
    );
    expect(o.state).toBe('');
    expect(o.landmark).toBe('');
    expect(o.pincode).toBe('');
    expect(o.channels).toEqual([]);
    expect(o.features).toEqual([]);
  });

  it('dedupes by id and by name + pincode, first one wins', () => {
    const list = normalizeOffices([
      makeOffice({ id: 'a', name: 'One' }),
      makeOffice({ id: 'a', name: 'Two' }),
      makeOffice({ id: 'b', name: 'one', pincode: '110030' }),
      makeOffice({ id: 'c', name: 'One', pincode: '400001' }),
    ]);
    expect(list.map((o) => o.id)).toEqual(['a', 'c']);
  });

  it('returns an empty list for non-array input', () => {
    expect(normalizeOffices(undefined)).toEqual([]);
  });
});

describe('filterCivicOffices with malformed records', () => {
  const messy = [
    makeOffice({ id: 'good' }),
    makeOffice({ id: 'nostate', name: 'No State Office', state: undefined, landmark: undefined, category: null }),
    makeOffice({ id: 'nocoords', name: 'No Coords Office', coordinates: null }),
    makeOffice({ id: 'nochannels', name: 'No Channels Office', channels: undefined }),
  ];

  it('does not throw and skips unusable records', () => {
    const result = filterCivicOffices({ offices: messy, searchQuery: 'xyz', channel: 'online' });
    expect(result).toEqual([]);
    const all = filterCivicOffices({ offices: messy });
    expect(all.map((o) => o.id).sort()).toEqual(['good', 'nochannels', 'nostate']);
  });

  it('computes distance when the user latitude is 0', () => {
    const [o] = filterCivicOffices({
      offices: [makeOffice({ coordinates: { lat: 1, lng: 1 } })],
      userCoords: { lat: 0, lng: 0 },
      maxRadiusKm: 500,
    });
    expect(o.distanceKm).not.toBeNull();
  });

  it('ignores non-finite user coordinates', () => {
    const [o] = filterCivicOffices({ offices: [makeOffice()], userCoords: { lat: NaN, lng: 77 } });
    expect(o.distanceKm).toBeNull();
  });
});

describe('getCachedUserCoordinates', () => {
  let storage;
  beforeEach(() => {
    storage = makeStorage();
    vi.stubGlobal('sessionStorage', storage);
  });

  it('returns valid cached coordinates', () => {
    storage.setItem('civicbridge_user_coords', JSON.stringify({ lat: 0, lng: 77.1, accuracy: 20 }));
    expect(getCachedUserCoordinates()).toMatchObject({ lat: 0, lng: 77.1 });
  });

  it('returns null for wrong-shaped or corrupt data', () => {
    storage.setItem('civicbridge_user_coords', JSON.stringify({ lat: 'a', lng: 1 }));
    expect(getCachedUserCoordinates()).toBeNull();
    storage.setItem('civicbridge_user_coords', 'null');
    expect(getCachedUserCoordinates()).toBeNull();
    storage.setItem('civicbridge_user_coords', '{not json');
    expect(getCachedUserCoordinates()).toBeNull();
  });
});
