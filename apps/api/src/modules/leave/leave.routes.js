import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  approveLeaveRequestController,
  createLeaveRequestController,
  createPublicHolidayController,
  deletePublicHolidayController,
  getMyLeaveBalanceController,
  listAllLeaveRequestsController,
  listMyLeaveRequestsController,
  listPendingApprovalsController,
  listPublicHolidaysController,
  rejectLeaveRequestController,
} from './leave.controller.js';
import {
  approveLeaveValidators,
  createLeaveRequestValidators,
  createPublicHolidayValidators,
  listLeaveRequestValidators,
  publicHolidayIdParamValidators,
  rejectLeaveValidators,
} from './leave.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.post('/', createLeaveRequestValidators, validateRequest, createLeaveRequestController);
router.get('/me', listMyLeaveRequestsController);
router.get('/balance/me', getMyLeaveBalanceController);
router.get(
  '/pending-approvals',
  allowRoles([ROLES.MANAGER]),
  listPendingApprovalsController,
);
router.get(
  '/',
  allowRoles([ROLES.ADMIN]),
  listLeaveRequestValidators,
  validateRequest,
  listAllLeaveRequestsController,
);
router.patch(
  '/:id/approve',
  allowRoles([ROLES.MANAGER]),
  approveLeaveValidators,
  validateRequest,
  approveLeaveRequestController,
);
router.patch(
  '/:id/reject',
  allowRoles([ROLES.MANAGER]),
  rejectLeaveValidators,
  validateRequest,
  rejectLeaveRequestController,
);
router.get('/public-holidays', listPublicHolidaysController);
router.post(
  '/public-holidays',
  allowRoles([ROLES.ADMIN]),
  createPublicHolidayValidators,
  validateRequest,
  createPublicHolidayController,
);
router.delete(
  '/public-holidays/:id',
  allowRoles([ROLES.ADMIN]),
  publicHolidayIdParamValidators,
  validateRequest,
  deletePublicHolidayController,
);

export default router;
