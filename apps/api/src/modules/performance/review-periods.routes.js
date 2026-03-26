import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  closeReviewPeriodController,
  createReviewPeriodController,
  getPerformanceConfigController,
  listReviewPeriodsController,
  openReviewPeriodController,
  updateReviewPeriodController,
} from './performance.controller.js';
import {
  createReviewPeriodValidators,
  listReviewPeriodsValidators,
  openOrCloseReviewPeriodValidators,
  updateReviewPeriodValidators,
} from './performance.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.get('/config', getPerformanceConfigController);
router.get('/', listReviewPeriodsValidators, validateRequest, listReviewPeriodsController);
router.post(
  '/',
  allowRoles([ROLES.ADMIN]),
  createReviewPeriodValidators,
  validateRequest,
  createReviewPeriodController,
);
router.patch(
  '/:id',
  allowRoles([ROLES.ADMIN]),
  updateReviewPeriodValidators,
  validateRequest,
  updateReviewPeriodController,
);
router.patch(
  '/:id/open',
  allowRoles([ROLES.ADMIN]),
  openOrCloseReviewPeriodValidators,
  validateRequest,
  openReviewPeriodController,
);
router.patch(
  '/:id/close',
  allowRoles([ROLES.ADMIN]),
  openOrCloseReviewPeriodValidators,
  validateRequest,
  closeReviewPeriodController,
);

export default router;
