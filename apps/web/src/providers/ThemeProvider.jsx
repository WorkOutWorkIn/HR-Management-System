import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from '@/contexts/theme-context';
import {
  THEME_STORAGE_KEY,
  THEMES,
  applyTheme,
  loadStoredTheme,
  persistTheme,
  resolveInitialTheme,
} from '@/theme/theme';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = loadStoredTheme();

      if (nextTheme) {
        setThemeState(nextTheme);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    setThemeState((currentTheme) => {
      if (typeof nextTheme === 'function') {
        return nextTheme(currentTheme);
      }

      return nextTheme === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) =>
      currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK,
    );
  }, []);

  const value = useMemo(
    () => ({
      isDark: theme === THEMES.DARK,
      isLight: theme === THEMES.LIGHT,
      setTheme,
      theme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
