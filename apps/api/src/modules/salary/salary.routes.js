import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  getMySalaryController,
  getSalaryForUserController,
  listUsersForSalaryAdminController,
  upsertSalaryForUserController,
} from './salary.controller.js';
import { salaryUserIdParamValidators, upsertSalaryValidators } from './salary.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.get('/me', getMySalaryController);
router.get('/admin/users', allowRoles([ROLES.ADMIN]), listUsersForSalaryAdminController);
router.get(
  '/admin/users/:userId',
  allowRoles([ROLES.ADMIN]),
  salaryUserIdParamValidators,
  validateRequest,
  getSalaryForUserController,
);
router.put(
  '/admin/users/:userId',
  allowRoles([ROLES.ADMIN]),
  [...salaryUserIdParamValidators, ...upsertSalaryValidators],
  validateRequest,
  upsertSalaryForUserController,
);

export default router;
