import apiClient from '@/services/api/client';

export async function listEmployees(params = {}) {
  const response = await apiClient.get('/employees', { params });
  return response.data;
}

export async function getEmployee(employeeId) {
  const response = await apiClient.get(`/employees/${employeeId}`);
  return response.data;
}

export async function createEmployee(payload) {
  const response = await apiClient.post('/employees', payload);
  return response.data;
}

export async function updateEmployee(employeeId, payload) {
  const response = await apiClient.patch(`/employees/${employeeId}`, payload);
  return response.data;
}

export async function unlockEmployee(employeeId) {
  const response = await apiClient.patch(`/employees/${employeeId}/unlock`);
  return response.data;
}
