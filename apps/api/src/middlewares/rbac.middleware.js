import { hasAnyRole } from '@hrms/shared';
import { ApiError } from '../utils/ApiError.js';

export function allowRoles(roles = []) {
  return (request, _response, next) => {
    if (!request.user) {
      return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
    }

    if (!hasAnyRole(request.user.role, roles)) {
      return next(
        new ApiError(403, 'You do not have access to this resource', 'FORBIDDEN', {
          requiredRoles: roles,
        }),
      );
    }

    return next();
  };
}
