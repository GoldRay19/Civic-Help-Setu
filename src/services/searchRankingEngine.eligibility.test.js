import { describe, it, expect } from 'vitest';
import { rankAndFilterServices } from './searchRankingEngine';
import { parseServiceFilters, MAX_ELIGIBILITY_LENGTH } from '../utils/searchParams';

const services = [
  { id: 'a', name: 'A', category: 'X', type: 'Online', eligibility: ['Residents of the state', 'Annual income below the limit'] },
  { id: 'b', name: 'B', category: 'X', type: 'Online / Offline', eligibility: ['Any citizen born in the district'] },
  { id: 'c', name: 'C', category: 'X', type: 'Offline' },
];
const ids = (options) => rankAndFilterServices(services, options).map((s) => s.id);

describe('eligibility filter', () => {
  it('matches all words within a single published line, ignoring case', () => {
    expect(ids({ eligibility: 'INCOME limit' })).toEqual(['a']);
    expect(ids({ eligibility: 'residents income' })).toEqual([]);
  });

  it('keeps everything for blank text and skips guides without eligibility text', () => {
    expect(ids({ eligibility: '   ' })).toEqual(['a', 'b', 'c']);
    expect(ids({ eligibility: 'citizen' })).toEqual(['b']);
  });

  it('combines with the delivery channel filter', () => {
    expect(ids({ eligibility: 'citizen', mode: 'Hybrid' })).toEqual(['b']);
    expect(ids({ eligibility: 'income', mode: 'Offline' })).toEqual([]);
  });

  it('cleans and bounds the address bar value', () => {
    const read = (value) => parseServiceFilters(new URLSearchParams({ elig: value })).eligibility;
    expect(read('born\u0000in')).toBe('born in');
    expect(read('x'.repeat(500))).toHaveLength(MAX_ELIGIBILITY_LENGTH);
    expect(parseServiceFilters(new URLSearchParams()).eligibility).toBe('');
  });
});
