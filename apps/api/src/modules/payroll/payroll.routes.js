import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  generatePayrollForEveryoneController,
  issuePayrollCorrectionForUserController,
  getPayrollForUserController,
  listMyPayrollController,
  listPayrollUsersController,
} from './payroll.controller.js';
import {
  payrollCorrectionValidators,
  payrollMonthValidators,
  payrollUserIdParamValidators,
} from './payroll.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.get('/me', listMyPayrollController);
router.get('/admin/users', allowRoles([ROLES.ADMIN]), listPayrollUsersController);
router.get(
  '/admin/users/:userId',
  allowRoles([ROLES.ADMIN]),
  payrollUserIdParamValidators,
  validateRequest,
  getPayrollForUserController,
);
router.post(
  '/admin/generate',
  allowRoles([ROLES.ADMIN]),
  payrollMonthValidators,
  validateRequest,
  generatePayrollForEveryoneController,
);
router.post(
  '/admin/users/:userId/:payrollRecordId/corrections',
  allowRoles([ROLES.ADMIN]),
  payrollCorrectionValidators,
  validateRequest,
  issuePayrollCorrectionForUserController,
);

export default router;
