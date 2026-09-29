'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'bff-theme';

function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Reads and writes the active theme.
 *
 * The initial value is deliberately not part of server rendering: the blocking
 * script in the root layout has already set `data-theme` before first paint, so
 * this hook only has to mirror it into React state and keep the two in sync.
 *
 * Behaviour:
 * - a stored explicit choice always wins;
 * - with no stored choice the OS preference is followed, and kept up to date if
 *   the user changes it while the tab is open;
 * - toggling stores an explicit choice, which stops the OS from overriding it.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored ?? (prefersDark() ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function onSystemChange() {
      // Only follow the system while the user has not made an explicit choice.
      if (readStoredTheme()) return;
      const next: Theme = media.matches ? 'dark' : 'light';
      setThemeState(next);
      applyTheme(next);
    }

    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* private browsing: the choice just will not persist */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
