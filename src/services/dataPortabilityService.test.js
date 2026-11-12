import { describe, expect, it } from 'vitest';
import {
  EXPORT_SCHEMA_VERSION,
  assertAuthenticated,
  buildCitizenDataExport,
  convertToCsv,
  escapeCsvValue,
  sanitizeRecord,
} from './dataPortabilityService';

describe('legacy dataPortabilityService', () => {
  it('retains the documented schema version and authentication guard', () => {
    expect(EXPORT_SCHEMA_VERSION).toBe('1.0.0');
    expect(() => assertAuthenticated(null)).toThrow(/Authentication required/);
    expect(() => assertAuthenticated({ id: '  ' })).toThrow(/identifier is missing/);
    expect(assertAuthenticated({ id: ' alice ' })).toBe('alice');
  });

  it('does not expose a direct browser export that bypasses recent authentication and link controls', () => {
    expect(() => buildCitizenDataExport({ id: 'alice' })).toThrow(/authenticated Privacy Centre/);
  });

  it('removes credential and vault file fields from helper records', () => {
    const clean = sanitizeRecord({
      serviceId: 'income-certificate',
      name: 'Income Certificate',
      authToken: 'secret',
      fileBlob: 'base64',
      nested: { sessionToken: 'secret' },
    });
    expect(clean).toEqual({
      serviceId: 'income-certificate',
      name: 'Income Certificate',
      nested: {},
    });
  });

  it('escapes CSV fields and formats flat rows according to RFC 4180 quoting', () => {
    expect(escapeCsvValue('Text, with comma')).toBe('"Text, with comma"');
    expect(escapeCsvValue('Text with "quotes"')).toBe('"Text with ""quotes"""');
    expect(escapeCsvValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    expect(convertToCsv([{ id: 'id-1', title: 'A, B' }], [
      { key: 'id', label: 'Id' },
      { key: 'title', label: 'Title' },
    ])).toBe('Id,Title\nid-1,"A, B"');
  });
});
