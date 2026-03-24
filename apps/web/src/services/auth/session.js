const AUTH_STORAGE_KEY = 'secure_hrms_auth_session';
const REFRESH_SESSION_HINT_KEY = 'secure_hrms_refresh_session_hint';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

function getPersistentStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function loadStoredSession() {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawSession = storage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function persistSession(session) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (!session) {
    storage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_STORAGE_KEY);
}

export function hasRefreshSessionHint() {
  const storage = getPersistentStorage();

  if (!storage) {
    return false;
  }

  return storage.getItem(REFRESH_SESSION_HINT_KEY) === 'true';
}

export function markRefreshSessionExpected() {
  const storage = getPersistentStorage();

  if (!storage) {
    return;
  }

  storage.setItem(REFRESH_SESSION_HINT_KEY, 'true');
}

export function clearRefreshSessionHint() {
  const storage = getPersistentStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(REFRESH_SESSION_HINT_KEY);
}

export function shouldAttemptSessionRefresh(session) {
  return Boolean(session?.user) || hasRefreshSessionHint();
}
