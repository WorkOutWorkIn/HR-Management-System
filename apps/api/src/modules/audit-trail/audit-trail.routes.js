import { Router } from 'express';
import { ROLES } from '@hrms/shared';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { listAuditTrailController } from './audit-trail.controller.js';
import { listAuditTrailValidators } from './audit-trail.validators.js';

const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted, allowRoles([ROLES.ADMIN]));

router.get('/', listAuditTrailValidators, validateRequest, listAuditTrailController);

export default router;
