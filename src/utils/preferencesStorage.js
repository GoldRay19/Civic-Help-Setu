// Safe load/save/apply helpers for theme and accessibility preferences.
// Kept free of React so they can run before first paint and be unit tested.

export const THEME_KEY = 'civicbridge_theme';
export const A11Y_KEY = 'civicbridge_a11y_prefs';

export const THEMES = ['dark', 'light'];
export const FONT_SCALES = ['normal', 'large', 'xlarge'];

export const DEFAULT_THEME = 'dark';
export const DEFAULT_A11Y = {
  fontSizeScale: 'normal',
  isHighContrast: false,
  isDyslexicFont: false,
};

const getStorage = () => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
};

export const loadTheme = () => {
  try {
    const saved = getStorage()?.getItem(THEME_KEY);
    return THEMES.includes(saved) ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export const saveTheme = (theme) => {
  try {
    getStorage()?.setItem(THEME_KEY, theme);
  } catch {
    // storage may be blocked or full; the in-memory choice still applies
  }
};

export const sanitizeA11yPrefs = (raw) => {
  const prefs = raw && typeof raw === 'object' ? raw : {};
  return {
    fontSizeScale: FONT_SCALES.includes(prefs.fontSizeScale)
      ? prefs.fontSizeScale
      : DEFAULT_A11Y.fontSizeScale,
    isHighContrast: prefs.isHighContrast === true,
    isDyslexicFont: prefs.isDyslexicFont === true,
  };
};

export const loadA11yPrefs = () => {
  try {
    const raw = getStorage()?.getItem(A11Y_KEY);
    return sanitizeA11yPrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_A11Y };
  }
};

export const saveA11yPrefs = (prefs) => {
  try {
    getStorage()?.setItem(A11Y_KEY, JSON.stringify(sanitizeA11yPrefs(prefs)));
  } catch {
    // ignore, see saveTheme
  }
};

export const applyTheme = (theme, root = document.documentElement) => {
  root.setAttribute('data-theme', theme);
};

export const applyA11yPrefs = (prefs, root = document.documentElement) => {
  root.setAttribute('data-font-scale', prefs.fontSizeScale);
  if (prefs.isHighContrast) root.setAttribute('data-high-contrast', 'true');
  else root.removeAttribute('data-high-contrast');
  if (prefs.isDyslexicFont) root.setAttribute('data-dyslexic-font', 'true');
  else root.removeAttribute('data-dyslexic-font');
};

// Called once before React renders so saved settings show on first paint.
export const applySavedPreferences = (root = document.documentElement) => {
  applyTheme(loadTheme(), root);
  applyA11yPrefs(loadA11yPrefs(), root);
};
