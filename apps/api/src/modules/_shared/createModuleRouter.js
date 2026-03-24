import { ROLES } from '@hrms/shared';
import { Router } from 'express';
import { writeAuditLog } from '../../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { allowRoles } from '../../middlewares/rbac.middleware.js';

export function createModuleRouter({ moduleName, access = 'public' }) {
  const router = Router();
  const middlewares = [];

  if (access === 'authenticated') {
    middlewares.push(requireAuth, requirePasswordChangeCompleted);
  }

  if (access === 'manager') {
    middlewares.push(requireAuth, requirePasswordChangeCompleted, allowRoles([ROLES.MANAGER]));
  }

  router.get('/', ...middlewares, async (request, response) => {
    const audit = await writeAuditLog({
      actorUserId: request.user?.id || null,
      targetUserId: null,
      action: AUDIT_ACTIONS.MODULE_PLACEHOLDER_ACCESSED,
      ipAddress: request.requestContext?.ipAddress || request.ip || null,
      userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
      metadata: {
        moduleName,
        placeholder: true,
        access,
      },
    });

    response.status(501).json({
      message: `${moduleName} module scaffold is ready`,
      module: moduleName,
      implemented: false,
      access,
      audit,
    });
  });

  return router;
}
