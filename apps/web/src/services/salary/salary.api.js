import apiClient from '@/services/api/client';

export async function getMySalary() {
  const response = await apiClient.get('/salary/me');
  return response.data;
}

export async function listSalaryUsers(params = {}) {
  const response = await apiClient.get('/salary/admin/users', { params });
  return response.data;
}

export async function getSalaryForUser(userId) {
  const response = await apiClient.get(`/salary/admin/users/${userId}`);
  return response.data;
}

export async function updateSalaryForUser(userId, payload) {
  const response = await apiClient.put(`/salary/admin/users/${userId}`, payload);
  return response.data;
}
