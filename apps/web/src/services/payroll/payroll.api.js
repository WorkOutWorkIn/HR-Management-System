import apiClient from '@/services/api/client';

export async function getMyPayroll() {
  const response = await apiClient.get('/payroll/me');
  return response.data;
}

export async function listPayrollUsers(params = {}) {
  const response = await apiClient.get('/payroll/admin/users', { params });
  return response.data;
}

export async function getPayrollForUser(userId) {
  const response = await apiClient.get(`/payroll/admin/users/${userId}`);
  return response.data;
}

export async function generatePayrollForEveryone(payload) {
  const response = await apiClient.post('/payroll/admin/generate', payload);
  return response.data;
}

export async function issuePayrollCorrectionForUser(userId, payrollRecordId, payload) {
  const response = await apiClient.post(
    `/payroll/admin/users/${userId}/${payrollRecordId}/corrections`,
    payload,
  );
  return response.data;
}
