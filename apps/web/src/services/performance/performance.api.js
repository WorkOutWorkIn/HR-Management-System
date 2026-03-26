import apiClient from '@/services/api/client';

export async function listReviewPeriods(params = {}) {
  const response = await apiClient.get('/review-periods', { params });
  return response.data;
}

export async function createReviewPeriod(payload) {
  const response = await apiClient.post('/review-periods', payload);
  return response.data;
}

export async function updateReviewPeriod(reviewPeriodId, payload) {
  const response = await apiClient.patch(`/review-periods/${reviewPeriodId}`, payload);
  return response.data;
}

export async function openReviewPeriod(reviewPeriodId) {
  const response = await apiClient.patch(`/review-periods/${reviewPeriodId}/open`);
  return response.data;
}

export async function closeReviewPeriod(reviewPeriodId) {
  const response = await apiClient.patch(`/review-periods/${reviewPeriodId}/close`);
  return response.data;
}

export async function listMyPerformanceReviews() {
  const response = await apiClient.get('/performance-reviews/me');
  return response.data;
}

export async function listDirectReportReviewAssignments(params = {}) {
  const response = await apiClient.get('/performance-reviews/direct-reports', { params });
  return response.data;
}

export async function listEmployeePerformanceReviews(employeeId) {
  const response = await apiClient.get(`/performance-reviews/employee/${employeeId}`);
  return response.data;
}

export async function listPerformanceReviews(params = {}) {
  const response = await apiClient.get('/performance-reviews', { params });
  return response.data;
}

export async function createPerformanceReview(payload) {
  const response = await apiClient.post('/performance-reviews', payload);
  return response.data;
}

export async function updatePerformanceReview(reviewId, payload) {
  const response = await apiClient.patch(`/performance-reviews/${reviewId}`, payload);
  return response.data;
}
