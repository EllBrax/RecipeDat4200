// src/theme.ts
export type Theme = 'light' | 'dark';

export function isTheme(v: unknown): v is Theme {
  return v === 'light' || v === 'dark';
}

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (isTheme(stored)) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
