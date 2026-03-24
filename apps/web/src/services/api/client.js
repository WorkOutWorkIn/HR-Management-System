import axios from 'axios';
import { shouldAttemptSessionRefresh } from '@/services/auth/session';
import { clearAccessToken, getAccessToken, refreshAccessToken } from '@/services/auth/token-manager';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api/v1';
const skipRefreshRoutes = ['/auth/login', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldSkipRefresh = skipRefreshRoutes.some((route) =>
      originalRequest?.url?.includes(route),
    );

    if (error.response?.status === 401 && !originalRequest?._retry && !shouldSkipRefresh) {
      if (!shouldAttemptSessionRefresh()) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const session = await refreshAccessToken();

        if (session?.accessToken) {
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        clearAccessToken();
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
