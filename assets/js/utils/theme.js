/**
 * KarenFlix — Theme Switcher (Modo Día / Modo Noche)
 * Persists theme preference ('light' | 'dark') in localStorage.
 */

const THEME_STORAGE_KEY = 'kf_theme';

/**
 * Initialize theme from localStorage or system preference.
 */
export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

/**
 * Get current theme.
 * @returns {'light'|'dark'}
 */
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/**
 * Toggle between light and dark themes.
 * @returns {'light'|'dark'} The newly active theme.
 */
export function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    return 'dark';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    return 'light';
  }
}
