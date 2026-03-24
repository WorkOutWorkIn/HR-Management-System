let accessToken = null;
let refreshHandler = null;
let refreshPromise = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token || null;
}

export function clearAccessToken() {
  accessToken = null;
}

export function registerRefreshHandler(handler) {
  refreshHandler = handler;
}

export async function refreshAccessToken() {
  if (!refreshHandler) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshHandler().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
