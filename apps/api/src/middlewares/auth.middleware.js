import jwt from 'jsonwebtoken';
import { isKnownRole } from '@hrms/shared';
import env from '../config/env.js';
import { ACCOUNT_STATUSES, LOGIN_ALLOWED_STATUSES } from '../constants/account-statuses.js';
import { UserModel } from '../database/models/index.js';
import { ApiError } from '../utils/ApiError.js';

function extractBearerToken(request) {
  const authorizationHeader = request.header('authorization');

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.replace('Bearer ', '').trim();
}

function buildDevelopmentUser(request) {
  if (env.isProduction || !env.allowDevAuthHeaders) {
    return null;
  }

  const role = request.header('x-demo-role');
  const id = request.header('x-demo-user-id');

  if (!role || !isKnownRole(role)) {
    return null;
  }

  return {
    id: id || 'demo-user',
    role,
    status: ACCOUNT_STATUSES.ACTIVE,
    mustChangePassword: false,
    permissions: [],
  };
}

async function buildAuthenticatedUser(request) {
  const accessToken = extractBearerToken(request);

  if (!accessToken) {
    return buildDevelopmentUser(request);
  }

  try {
    const decoded = jwt.verify(accessToken, env.jwt.accessSecret);
    const user = await UserModel.findByPk(decoded.sub, {
      attributes: ['id', 'role', 'status', 'mustChangePassword'],
    });

    if (!user || !LOGIN_ALLOWED_STATUSES.includes(user.status)) {
      return null;
    }

    return {
      id: user.id,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      permissions: [],
    };
  } catch {
    return null;
  }
}

export async function hydrateAuthContext(request, _response, next) {
  request.user = await buildAuthenticatedUser(request);
  next();
}

export function requireAuth(request, _response, next) {
  if (!request.user) {
    return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
  }

  return next();
}

export function requirePasswordChangeCompleted(request, _response, next) {
  if (!request.user) {
    return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
  }

  if (request.user.mustChangePassword) {
    return next(
      new ApiError(
        403,
        'Password reset is required before accessing this resource',
        'PASSWORD_CHANGE_REQUIRED',
      ),
    );
  }

  return next();
}

export function requirePendingPasswordChange(request, _response, next) {
  if (!request.user) {
    return next(new ApiError(401, 'Authentication required', 'AUTH_REQUIRED'));
  }

  if (!request.user.mustChangePassword) {
    return next(
      new ApiError(
        403,
        'Password reset is only available for users who must change their password',
        'PASSWORD_CHANGE_NOT_REQUIRED',
      ),
    );
  }

  return next();
}
