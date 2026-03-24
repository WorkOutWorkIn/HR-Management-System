import apiClient from '@/services/api/client';

export async function getMyReportingLine() {
  const response = await apiClient.get('/org-chart/me');
  return response.data;
}

export async function listDirectReports(params = {}) {
  const response = await apiClient.get('/org-chart/direct-reports', { params });
  return response.data;
}

export async function listReportingRelationships() {
  const response = await apiClient.get('/org-chart/relationships');
  return response.data;
}

export async function assignEmployeeManager(employeeId, payload) {
  const response = await apiClient.patch(`/org-chart/relationships/${employeeId}/manager`, payload);
  return response.data;
}
