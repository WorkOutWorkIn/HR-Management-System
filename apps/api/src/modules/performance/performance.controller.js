import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  closeReviewPeriod,
  createPerformanceReview,
  createReviewPeriod,
  getPerformanceReviewById,
  getPerformanceValidationConfig,
  listDirectReportReviewAssignments,
  listEmployeePerformanceReviews,
  listMyPerformanceReviews,
  listPerformanceReviews,
  listReviewPeriods,
  openReviewPeriod,
  updatePerformanceReview,
  updateReviewPeriod,
} from './performance.service.js';

export const getPerformanceConfigController = asyncHandler(async (_request, response) => {
  response.status(200).json({
    config: getPerformanceValidationConfig(),
  });
});

export const createReviewPeriodController = asyncHandler(async (request, response) => {
  const reviewPeriod = await createReviewPeriod({
    actorUserId: request.user.id,
    payload: request.body,
    request,
  });

  response.status(201).json({ reviewPeriod });
});

export const listReviewPeriodsController = asyncHandler(async (request, response) => {
  const result = await listReviewPeriods({
    actorUserId: request.user.id,
    filters: {
      status: request.query.status,
    },
  });

  response.status(200).json(result);
});

export const updateReviewPeriodController = asyncHandler(async (request, response) => {
  const reviewPeriod = await updateReviewPeriod({
    actorUserId: request.user.id,
    reviewPeriodId: request.params.id,
    payload: request.body,
    request,
  });

  response.status(200).json({ reviewPeriod });
});

export const openReviewPeriodController = asyncHandler(async (request, response) => {
  const reviewPeriod = await openReviewPeriod({
    actorUserId: request.user.id,
    reviewPeriodId: request.params.id,
    request,
  });

  response.status(200).json({ reviewPeriod });
});

export const closeReviewPeriodController = asyncHandler(async (request, response) => {
  const reviewPeriod = await closeReviewPeriod({
    actorUserId: request.user.id,
    reviewPeriodId: request.params.id,
    request,
  });

  response.status(200).json({ reviewPeriod });
});

export const createPerformanceReviewController = asyncHandler(async (request, response) => {
  const review = await createPerformanceReview({
    actorUserId: request.user.id,
    payload: request.body,
    request,
  });

  response.status(201).json({ review });
});

export const updatePerformanceReviewController = asyncHandler(async (request, response) => {
  const review = await updatePerformanceReview({
    actorUserId: request.user.id,
    reviewId: request.params.id,
    payload: request.body,
    request,
  });

  response.status(200).json({ review });
});

export const listMyPerformanceReviewsController = asyncHandler(async (request, response) => {
  const result = await listMyPerformanceReviews(request.user.id);
  response.status(200).json(result);
});

export const listDirectReportReviewAssignmentsController = asyncHandler(async (request, response) => {
  const result = await listDirectReportReviewAssignments({
    actorUserId: request.user.id,
    reviewPeriodId: request.query.reviewPeriodId,
  });

  response.status(200).json(result);
});

export const listEmployeePerformanceReviewsController = asyncHandler(async (request, response) => {
  const result = await listEmployeePerformanceReviews({
    actorUserId: request.user.id,
    employeeId: request.params.employeeId,
  });

  response.status(200).json(result);
});

export const listPerformanceReviewsController = asyncHandler(async (request, response) => {
  const result = await listPerformanceReviews({
    actorUserId: request.user.id,
    filters: {
      employeeId: request.query.employeeId,
      reviewPeriodId: request.query.reviewPeriodId,
      reviewerId: request.query.reviewerId,
    },
  });

  response.status(200).json(result);
});

export const getPerformanceReviewController = asyncHandler(async (request, response) => {
  const review = await getPerformanceReviewById({
    actorUserId: request.user.id,
    reviewId: request.params.id,
  });

  response.status(200).json({ review });
});
