import { describe, it, expect } from 'vitest';
import { compareRequirements } from './requirementComparisonService';

const a = {
  id: 'a',
  name: 'A',
  documents: ['Photo', 'Address proof', 'Photo'],
  documentRequirements: { 'Address proof': { type: 'conditional', condition: 'You moved recently' } },
};
const b = { id: 'b', name: 'B', documents: [' photo ', 'Income proof'] };
const empty = { id: 'c', name: 'C', documents: [] };

describe('compareRequirements', () => {
  it('splits shared documents from the rest, ignoring case, spacing and repeats', () => {
    const { shared, partial } = compareRequirements([a, b]);
    expect(shared.map((r) => r.label)).toEqual(['Photo']);
    expect(shared[0].entries.map((e) => e.serviceId)).toEqual(['a', 'b']);
    expect(partial.map((r) => r.label)).toEqual(['Address proof', 'Income proof']);
  });

  it('keeps the stated requirement type and condition, and never invents one', () => {
    const { partial } = compareRequirements([a, b]);
    expect(partial[0].entries[0]).toMatchObject({ type: 'conditional', condition: 'You moved recently' });
    expect(partial[1].entries[0]).toMatchObject({ type: 'unverified', condition: null });
  });

  it('reports services without a list and does not call a single list shared', () => {
    const result = compareRequirements([a, empty]);
    expect(result.withoutList).toEqual([empty]);
    expect(result.shared).toEqual([]);
  });

  it('copes with missing input', () => {
    expect(compareRequirements()).toEqual({ shared: [], partial: [], withoutList: [] });
    expect(compareRequirements([null]).partial).toEqual([]);
  });
});
