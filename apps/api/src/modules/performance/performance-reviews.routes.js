import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  createPerformanceReviewController,
  getPerformanceReviewController,
  listDirectReportReviewAssignmentsController,
  listEmployeePerformanceReviewsController,
  listMyPerformanceReviewsController,
  listPerformanceReviewsController,
  updatePerformanceReviewController,
} from './performance.controller.js';
import {
  createPerformanceReviewValidators,
  directReportReviewQueryValidators,
  employeeIdParamValidators,
  listPerformanceReviewValidators,
  performanceReviewIdParamValidators,
  updatePerformanceReviewValidators,
} from './performance.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.get('/me', listMyPerformanceReviewsController);
router.get(
  '/direct-reports',
  allowRoles([ROLES.MANAGER]),
  directReportReviewQueryValidators,
  validateRequest,
  listDirectReportReviewAssignmentsController,
);
router.get(
  '/employee/:employeeId',
  employeeIdParamValidators,
  validateRequest,
  listEmployeePerformanceReviewsController,
);
router.get(
  '/:id',
  performanceReviewIdParamValidators,
  validateRequest,
  getPerformanceReviewController,
);
router.get(
  '/',
  allowRoles([ROLES.ADMIN]),
  listPerformanceReviewValidators,
  validateRequest,
  listPerformanceReviewsController,
);
router.post(
  '/',
  allowRoles([ROLES.MANAGER]),
  createPerformanceReviewValidators,
  validateRequest,
  createPerformanceReviewController,
);
router.patch(
  '/:id',
  allowRoles([ROLES.MANAGER]),
  updatePerformanceReviewValidators,
  validateRequest,
  updatePerformanceReviewController,
);

export default router;
