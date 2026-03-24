import apiClient from '@/services/api/client';

export async function login(payload) {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
}

export async function refresh() {
  const response = await apiClient.post('/auth/refresh');
  return response.data;
}

export async function logout() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

export async function forgotPassword(payload) {
  const response = await apiClient.post('/auth/forgot-password', payload);
  return response.data;
}

export async function resetPassword(payload) {
  const response = await apiClient.post('/auth/reset-password', payload);
  return response.data;
}

export async function changePassword(payload) {
  const response = await apiClient.post('/auth/change-password', payload);
  return response.data;
}

export async function completeFirstLoginPassword(payload) {
  const response = await apiClient.post('/auth/complete-first-login-password', payload);
  return response.data;
}
