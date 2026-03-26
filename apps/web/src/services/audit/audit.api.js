import apiClient from '@/services/api/client';

export async function listAuditTrail(params = {}) {
  const response = await apiClient.get('/audit-trail', { params });
  return response.data;
}
