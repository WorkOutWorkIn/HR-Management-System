export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const THEME_STORAGE_KEY = 'hrms-theme';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function normalizeTheme(value) {
  return value === THEMES.LIGHT || value === THEMES.DARK ? value : null;
}

export function loadStoredTheme() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
}

export function persistTheme(theme) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function resolveInitialTheme() {
  const storedTheme = loadStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEMES.DARK
      : THEMES.LIGHT;
  }

  return THEMES.DARK;
}

export function applyTheme(theme) {
  const resolvedTheme = normalizeTheme(theme) || THEMES.DARK;

  if (typeof document === 'undefined') {
    return resolvedTheme;
  }

  const roots = [document.documentElement, document.body].filter(Boolean);

  roots.forEach((node) => {
    node.classList.remove(THEMES.LIGHT, THEMES.DARK);
    node.classList.add(resolvedTheme);
    node.setAttribute('data-theme', resolvedTheme);
  });

  document.documentElement.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}
