import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NfsaRationWorkspace from './NfsaRationWorkspace';

describe('NfsaRationWorkspace', () => {
  beforeEach(() => {
    let mockStore = {};
    const mockStorage = {
      getItem: vi.fn((key) => (key in mockStore ? mockStore[key] : null)),
      setItem: vi.fn((key, val) => {
        mockStore[key] = String(val);
      }),
      removeItem: vi.fn((key) => {
        delete mockStore[key];
      }),
      clear: vi.fn(() => {
        mockStore = {};
      }),
      get length() {
        return Object.keys(mockStore).length;
      },
      key: vi.fn((i) => Object.keys(mockStore)[i] || null)
    };
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('renders the workspace hero heading, tabs, and statutory disclaimer', () => {
    const html = renderToStaticMarkup(<NfsaRationWorkspace />);
    expect(html).toContain('National Food Security (NFSA 2013) Ration Entitlement');
    expect(html).toContain('Statutory Advisory &amp; Legal Notice');
    expect(html).toContain('Quota &amp; Weighment Auditor');
    expect(html).toContain('Biometric Fallback &amp; Section 8 FSA');
    expect(html).toContain('Grievance Vault');
    expect(html).toContain('Section 15 DGRO &amp; Section 16 Food Commission');
  });

  it('renders default tab content (Quota & Weighment Auditor)', () => {
    const html = renderToStaticMarkup(<NfsaRationWorkspace />);
    expect(html).toContain('NFSA Quota Entitlement &amp; Weighment Auditor');
    expect(html).toContain('Statutory Entitlement Breakdown');
    expect(html).toContain('Actual Distribution at Fair Price Shop');
  });
});
