// Eco Nojin — theme (colour route) management.
// The two themes A/B are defined by the Design System (themes.css). This module
// only selects which one is active and persists the choice. It never defines
// colours of its own.

export const THEMES = ['A', 'B'];
export const DEFAULT_THEME = 'A';
const STORAGE_KEY = 'eco-nojin-theme';

export function applyTheme(theme, root) {
  const doc = root || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;
  const value = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  doc.documentElement.setAttribute('data-theme', value);
  doc.querySelectorAll('[data-theme-set]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.getAttribute('data-theme-set') === value));
  });
}

export function readStoredTheme(storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const v = s && s.getItem(STORAGE_KEY);
    return THEMES.includes(v) ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme, storage) {
  try {
    const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (s) s.setItem(STORAGE_KEY, THEMES.includes(theme) ? theme : DEFAULT_THEME);
  } catch {
    /* storage unavailable (private mode) — non-fatal */
  }
}

export function initTheme({ storage, root } = {}) {
  const theme = readStoredTheme(storage);
  applyTheme(theme, root);
  return theme;
}