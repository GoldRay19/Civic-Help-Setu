import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TrafficChallanWorkspace from './TrafficChallanWorkspace.jsx';
import { OFFICIAL_STATUS_DISCLAIMER } from '../services/trafficChallanStorage.js';

const makeStorage = () => {
  const data = new Map();
  return {
    getItem: vi.fn((k) => (data.has(k) ? data.get(k) : null)),
    setItem: vi.fn((k, v) => data.set(k, String(v))),
    removeItem: vi.fn((k) => data.delete(k)),
    clear: vi.fn(() => data.clear()),
    key: vi.fn((i) => [...data.keys()][i] ?? null),
    get length() {
      return data.size;
    },
  };
};

describe('TrafficChallanWorkspace Page (#1340)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage());
  });

  it('renders workspace title, statutory integrity notice, and action buttons', () => {
    const html = renderToStaticMarkup(<TrafficChallanWorkspace />);

    expect(html).toContain('Traffic E-Challan Dispute Workspace');
    expect(html).toContain('New Challan Dispute');
    expect(html).toContain('Export Dossier (JSON)');
    expect(html).toContain(OFFICIAL_STATUS_DISCLAIMER.replace('&', '&amp;'));
  });

  it('renders Rule 167A Auditor and Defect tabs', () => {
    const html = renderToStaticMarkup(<TrafficChallanWorkspace />);

    expect(html).toContain('1. Rule 167A Electronic Evidence Auditor');
    expect(html).toContain('2. Challan Defects &amp; Grounds of Contest');
    expect(html).toContain('Rule 167A Electronic Monitoring Compliance Auditor');
  });
});
