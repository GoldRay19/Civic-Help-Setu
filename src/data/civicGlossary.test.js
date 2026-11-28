import { describe, expect, it } from 'vitest';
import { CIVIC_GLOSSARY, GLOSSARY_QUERY_MAX_LENGTH, searchGlossaryWithTypos } from './civicGlossary.js';

const ids = (query) => searchGlossaryWithTypos(query).results.map((item) => item.id);
const idOf = (abbreviation) => CIVIC_GLOSSARY.find((item) => item.abbreviations.includes(abbreviation)).id;

describe('searchGlossaryWithTypos', () => {
  it.each([
    ['affidvit', 'AFF'],
    ['afidavit', 'AFF'],
    ['gazzete', 'Gazette'],
    ['chalan', 'E-Challan'],
    ['Encumberance certificte', 'EC'],
    ['annexrue', 'Annexure'],
  ])('finds the entry for the misspelling "%s"', (query, abbreviation) => {
    expect(ids(query)[0]).toBe(idOf(abbreviation));
    expect(searchGlossaryWithTypos(query).isCloseMatch).toBe(true);
  });

  it('does not mark exact matches as close matches', () => {
    expect(searchGlossaryWithTypos('affidavit').isCloseMatch).toBe(false);
    expect(searchGlossaryWithTypos('').results).toHaveLength(CIVIC_GLOSSARY.length);
  });

  it.each(['zzzzzzzz', 'qq', '???', 'affidvit qqqqqq'])('returns nothing for "%s"', (query) => {
    expect(searchGlossaryWithTypos(query)).toEqual({ results: [], isCloseMatch: false });
  });

  it('does not guess between short acronyms', () => {
    expect(ids('xrc')).toEqual([]);
  });

  it('skips fuzzy matching for over-long or non-text input', () => {
    expect(ids(`affidvit${' '.repeat(GLOSSARY_QUERY_MAX_LENGTH)}x`)).toEqual([]);
    expect(searchGlossaryWithTypos(null).isCloseMatch).toBe(false);
  });
});
