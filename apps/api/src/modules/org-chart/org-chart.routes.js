import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  assignEmployeeManagerController,
  getMyReportingLineController,
  listDirectReportsController,
  listReportingRelationshipsController,
} from './org-chart.controller.js';
import { assignManagerValidators, directReportsQueryValidators } from './org-chart.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.get('/me', getMyReportingLineController);
router.get(
  '/direct-reports',
  allowRoles([ROLES.MANAGER]),
  directReportsQueryValidators,
  validateRequest,
  listDirectReportsController,
);
router.get(
  '/relationships',
  allowRoles([ROLES.ADMIN]),
  listReportingRelationshipsController,
);
router.patch(
  '/relationships/:employeeId/manager',
  allowRoles([ROLES.ADMIN]),
  assignManagerValidators,
  validateRequest,
  assignEmployeeManagerController,
);

export default router;
