import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import FoodSafetyWorkspace from './FoodSafetyWorkspace.jsx';
import { OFFICIAL_STATUS_DISCLAIMER } from '../services/foodSafetyStorage.js';

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

describe('FoodSafetyWorkspace Page (#1339)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage());
  });

  it('renders workspace title, statutory integrity notice, and new complaint button', () => {
    const html = renderToStaticMarkup(<FoodSafetyWorkspace />);

    expect(html).toContain('Food Safety (FSSAI) Redressal Workspace');
    expect(html).toContain('New Food Complaint');
    expect(html).toContain('Export Dossier (JSON)');
    expect(html).toContain(OFFICIAL_STATUS_DISCLAIMER.replace('&', '&amp;'));
  });

  it('renders Schedule 4 Auditor and Penalty tabs', () => {
    const html = renderToStaticMarkup(<FoodSafetyWorkspace />);

    expect(html).toContain('1. Schedule 4 Sanitary Auditor');
    expect(html).toContain('2. Adulteration Penalties &amp; Compensation');
    expect(html).toContain('FSSAI Schedule 4 Sanitary &amp; Hygiene Auditor');
  });
});
