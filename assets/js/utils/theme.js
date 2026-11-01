const THEME_STORAGE_KEY = 'kf_theme';

export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'matrix') {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

export function toggleTheme() {
  const nextTheme = {
    dark: 'light',
    light: 'matrix',
    matrix: 'dark',
  }[getTheme()] || 'dark';

  if (nextTheme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', nextTheme);
  }

  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  return nextTheme;
}
