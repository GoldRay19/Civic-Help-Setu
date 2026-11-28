import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RbiOmbudsmanWorkspace from './RbiOmbudsmanWorkspace.jsx';
import { OFFICIAL_STATUS_DISCLAIMER } from '../services/rbiOmbudsmanStorage.js';

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

describe('RbiOmbudsmanWorkspace Page (#1341)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage());
  });

  it('renders workspace title, statutory integrity notice, and action buttons', () => {
    const html = renderToStaticMarkup(<RbiOmbudsmanWorkspace />);

    expect(html).toContain('RBI Banking Ombudsman Workspace');
    expect(html).toContain('New Banking Dispute');
    expect(html).toContain('Export Dossier (JSON)');
    expect(html).toContain(OFFICIAL_STATUS_DISCLAIMER.replace('&', '&amp;'));
  });

  it('renders Zero Liability and TAT tabs', () => {
    const html = renderToStaticMarkup(<RbiOmbudsmanWorkspace />);

    expect(html).toContain('1. Zero Liability Auditor (Unauthorized Debits)');
    expect(html).toContain('2. Failed Transaction TAT &amp; Delay Compensation');
    expect(html).toContain('RBI Zero Liability &amp; Customer Protection Auditor');
  });
});
