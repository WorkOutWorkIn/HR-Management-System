import apiClient from '@/services/api/client';

export async function getMyProfile() {
  const response = await apiClient.get('/profile/me');
  return response.data;
}

export async function updateMyProfile(payload) {
  const response = await apiClient.patch('/profile/me', payload);
  return response.data;
}
