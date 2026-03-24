import apiClient from '@/services/api/client';

export async function createLeaveRequest(payload) {
  const response = await apiClient.post('/leave-requests', payload);
  return response.data;
}

export async function listMyLeaveRequests() {
  const response = await apiClient.get('/leave-requests/me');
  return response.data;
}

export async function listPendingApprovals() {
  const response = await apiClient.get('/leave-requests/pending-approvals');
  return response.data;
}

export async function approveLeaveRequest(leaveRequestId, payload = {}) {
  const response = await apiClient.patch(`/leave-requests/${leaveRequestId}/approve`, payload);
  return response.data;
}

export async function rejectLeaveRequest(leaveRequestId, payload = {}) {
  const response = await apiClient.patch(`/leave-requests/${leaveRequestId}/reject`, payload);
  return response.data;
}

export async function listAllLeaveRequests(params = {}) {
  const response = await apiClient.get('/leave-requests', { params });
  return response.data;
}

export async function getMyLeaveBalance() {
  const response = await apiClient.get('/leave-requests/balance/me');
  return response.data;
}

export async function listPublicHolidays() {
  const response = await apiClient.get('/leave-requests/public-holidays');
  return response.data;
}

export async function createPublicHoliday(payload) {
  const response = await apiClient.post('/leave-requests/public-holidays', payload);
  return response.data;
}

export async function deletePublicHoliday(holidayId) {
  await apiClient.delete(`/leave-requests/public-holidays/${holidayId}`);
}
