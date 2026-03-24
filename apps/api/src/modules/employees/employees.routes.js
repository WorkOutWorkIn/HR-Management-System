import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  createEmployeeController,
  getEmployeeController,
  listEmployeesController,
  unlockEmployeeController,
  updateEmployeeController,
} from './employees.controller.js';
import {
  createEmployeeValidators,
  employeeIdParamValidators,
  listEmployeesValidators,
  updateEmployeeValidators,
} from './employees.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.get(
  '/',
  allowRoles([ROLES.MANAGER]),
  listEmployeesValidators,
  validateRequest,
  listEmployeesController,
);
router.get(
  '/:id',
  allowRoles([ROLES.MANAGER]),
  employeeIdParamValidators,
  validateRequest,
  getEmployeeController,
);
router.post(
  '/',
  allowRoles([ROLES.ADMIN]),
  createEmployeeValidators,
  validateRequest,
  createEmployeeController,
);
router.patch(
  '/:id',
  allowRoles([ROLES.ADMIN]),
  [...employeeIdParamValidators, ...updateEmployeeValidators],
  validateRequest,
  updateEmployeeController,
);
router.patch(
  '/:id/unlock',
  allowRoles([ROLES.ADMIN]),
  employeeIdParamValidators,
  validateRequest,
  unlockEmployeeController,
);

export default router;
