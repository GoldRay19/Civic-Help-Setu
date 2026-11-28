import { describe, it, expect } from 'vitest';
import { privacyExportToCsv } from './privacyExportCsv';

const payload = (data) => ({ exportVersion: '1.0.0', generatedAt: '2026-11-28T00:00:00.000Z', data });
const lines = (data) => privacyExportToCsv(payload(data)).trimEnd().split('\r\n');

describe('privacyExportToCsv', () => {
  it('writes a header, export details and one row per value', () => {
    const result = lines({
      profile: { name: 'Asha' },
      checklistProgress: [{ checklistId: 'c1', checked: ['Photo', 'Form'], rev: 2 }],
    });
    expect(result[0]).toBe('"category","record","field","value"');
    expect(result).toContain('"export","1","exportVersion","1.0.0"');
    expect(result).toContain('"profile","1","name","Asha"');
    expect(result).toContain('"checklistProgress","1","checked","Photo"');
    expect(result).toContain('"checklistProgress","1","checked","Form"');
    expect(result).toContain('"checklistProgress","1","rev","2"');
  });

  it('escapes quotes, keeps commas and new lines inside the cell, and blanks null', () => {
    const csv = privacyExportToCsv(payload({ savedServices: [{ notes: 'a, "b"\nc', priority: null }] }));
    expect(csv).toContain('"notes","a, ""b""\nc"');
    expect(csv).toContain('"priority",""');
  });

  it('stops text from running as a spreadsheet formula', () => {
    for (const hostile of ['=1+1', '+cmd', '-2+3', '@SUM(A1)', '  =HYPERLINK("x")', '\t=1']) {
      const csv = privacyExportToCsv(payload({ savedServices: [{ notes: hostile }] }));
      expect(csv).toContain(`"notes","'${hostile.replace(/"/g, '""')}"`);
    }
  });

  it('marks an empty category and rejects an unexpected file', () => {
    expect(lines({ consentHistory: [] })).toContain('"consentHistory","","","No records"');
    expect(() => privacyExportToCsv({ error: 'nope' })).toThrow(TypeError);
    expect(() => privacyExportToCsv(null)).toThrow(TypeError);
  });
});
