import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  THEME_KEY,
  A11Y_KEY,
  loadTheme,
  saveTheme,
  loadA11yPrefs,
  saveA11yPrefs,
  sanitizeA11yPrefs,
  applyA11yPrefs,
  DEFAULT_A11Y,
} from './preferencesStorage';

const makeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: vi.fn((k) => (k in data ? data[k] : null)),
    setItem: vi.fn((k, v) => { data[k] = String(v); }),
    data,
  };
};

const makeRoot = () => {
  const attrs = {};
  return {
    attrs,
    setAttribute: (k, v) => { attrs[k] = v; },
    removeAttribute: (k) => { delete attrs[k]; },
  };
};

describe('preferencesStorage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('localStorage', makeStorage());
  });

  it('falls back to defaults when nothing is saved', () => {
    expect(loadTheme()).toBe('dark');
    expect(loadA11yPrefs()).toEqual(DEFAULT_A11Y);
  });

  it('round-trips theme and accessibility preferences', () => {
    saveTheme('light');
    saveA11yPrefs({ fontSizeScale: 'xlarge', isHighContrast: true, isDyslexicFont: true });
    expect(loadTheme()).toBe('light');
    expect(loadA11yPrefs()).toEqual({
      fontSizeScale: 'xlarge',
      isHighContrast: true,
      isDyslexicFont: true,
    });
  });

  it('ignores invalid or corrupt saved values', () => {
    vi.stubGlobal('localStorage', makeStorage({
      [THEME_KEY]: 'purple',
      [A11Y_KEY]: '{not json',
    }));
    expect(loadTheme()).toBe('dark');
    expect(loadA11yPrefs()).toEqual(DEFAULT_A11Y);
    expect(sanitizeA11yPrefs({ fontSizeScale: 'huge', isHighContrast: 'yes' })).toEqual(DEFAULT_A11Y);
  });

  it('does not throw when storage is blocked', () => {
    const blocked = {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); },
    };
    vi.stubGlobal('localStorage', blocked);
    expect(loadTheme()).toBe('dark');
    expect(loadA11yPrefs()).toEqual(DEFAULT_A11Y);
    expect(() => saveTheme('light')).not.toThrow();
    expect(() => saveA11yPrefs(DEFAULT_A11Y)).not.toThrow();
  });

  it('applies and clears document attributes', () => {
    const root = makeRoot();
    applyA11yPrefs({ fontSizeScale: 'large', isHighContrast: true, isDyslexicFont: false }, root);
    expect(root.attrs).toEqual({ 'data-font-scale': 'large', 'data-high-contrast': 'true' });
    applyA11yPrefs(DEFAULT_A11Y, root);
    expect(root.attrs).toEqual({ 'data-font-scale': 'normal' });
  });
});
