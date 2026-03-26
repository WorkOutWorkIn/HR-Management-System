import { Op } from 'sequelize';
import { sequelize } from '../../config/db.js';
import env from '../../config/env.js';
import { writeAuditLog } from '../../audit/audit.service.js';
import {
  ACCOUNT_STATUSES,
  LOGIN_ALLOWED_STATUSES,
  RESET_ALLOWED_STATUSES,
} from '../../constants/account-statuses.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { PASSWORD_TOKEN_PURPOSES } from '../../constants/auth.js';
import {
  PasswordResetTokenModel,
  RefreshTokenModel,
  UserModel,
} from '../../database/models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from '../../utils/password.utils.js';
import {
  generateOpaqueToken,
  generateTokenId,
  hashOpaqueToken,
  signAccessToken,
  signRefreshToken,
  ttlToMilliseconds,
  verifyRefreshToken,
} from '../../utils/token.utils.js';
import { serializeUser } from '../_shared/user-response.js';
import { dispatchPasswordResetEmail } from './auth.notification.service.js';

function getRequestMetadata(request) {
  return {
    ipAddress: request.requestContext?.ipAddress || request.ip || null,
    userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
  };
}

function buildAuditBase(request, overrides = {}) {
  const metadata = getRequestMetadata(request);

  return {
    actorUserId: request.user?.id || null,
    targetUserId: null,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    metadata: {},
    ...overrides,
  };
}

function buildGenericForgotPasswordResponse() {
  return {
    message:
      'If the account exists and is eligible, password reset instructions will be sent shortly.',
  };
}

function createInvalidCredentialsError() {
  return new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
}

function createInvalidRefreshTokenError() {
  return new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
}

async function writeAccountStatusChangeAudit({
  request,
  actorUserId,
  targetUserId,
  previousStatus,
  nextStatus,
  metadata = {},
  transaction,
}) {
  if (!previousStatus || !nextStatus || previousStatus === nextStatus) {
    return;
  }

  await writeAuditLog(
    buildAuditBase(request, {
      actorUserId,
      targetUserId,
      action: AUDIT_ACTIONS.ACCOUNT_STATUS_CHANGED,
      metadata: {
        previousStatus,
        nextStatus,
        ...metadata,
      },
    }),
    { transaction },
  );
}

async function revokeRefreshTokensForUser(userId, reason, transaction) {
  await RefreshTokenModel.update(
    {
      revokedAt: new Date(),
      revokedReason: reason,
    },
    {
      where: {
        userId,
        revokedAt: null,
      },
      transaction,
    },
  );
}

async function revokeRefreshTokenFamily({ userId, familyId, reason, transaction }) {
  await RefreshTokenModel.update(
    {
      revokedAt: new Date(),
      revokedReason: reason,
    },
    {
      where: {
        userId,
        familyId,
        revokedAt: null,
      },
      transaction,
    },
  );
}

async function invalidateOutstandingPasswordTokens(userId, purpose, transaction) {
  await PasswordResetTokenModel.update(
    {
      invalidatedAt: new Date(),
    },
    {
      where: {
        userId,
        purpose,
        usedAt: null,
        invalidatedAt: null,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      transaction,
    },
  );
}

async function createRefreshSession(user, request, transaction, options = {}) {
  const tokenId = generateTokenId();
  const familyId = options.familyId || generateTokenId();
  const refreshToken = signRefreshToken({ user, tokenId });
  const refreshTokenHash = hashOpaqueToken(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + ttlToMilliseconds(env.jwt.refreshTokenTtl));

  await RefreshTokenModel.create(
    {
      userId: user.id,
      tokenId,
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt: refreshTokenExpiresAt,
      lastUsedAt: null,
      revokedAt: null,
      revokedReason: null,
      replacedByTokenId: null,
      createdByIp: request.requestContext?.ipAddress || request.ip || null,
      userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
    },
    { transaction },
  );

  return {
    accessToken: signAccessToken(user),
    tokenId,
    refreshToken,
  };
}

async function markLoginFailure(user, request, reason) {
  const transaction = await sequelize.transaction();

  try {
    const lockedUser = await UserModel.findByPk(user.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!lockedUser) {
      await transaction.commit();
      return;
    }

    if (lockedUser.status === ACCOUNT_STATUSES.LOCKED) {
      await writeAuditLog(
        buildAuditBase(request, {
          actorUserId: lockedUser.id,
          targetUserId: lockedUser.id,
          action: AUDIT_ACTIONS.LOGIN_FAILURE,
          metadata: { reason: 'ACCOUNT_LOCKED' },
        }),
        { transaction },
      );

      await transaction.commit();
      return;
    }

    const nextAttempts = lockedUser.failedLoginAttempts + 1;
    const shouldLock = nextAttempts >= env.security.maxFailedLoginAttempts;
    const previousStatus = lockedUser.status;

    await lockedUser.update(
      {
        failedLoginAttempts: nextAttempts,
        ...(shouldLock
          ? {
              status: ACCOUNT_STATUSES.LOCKED,
              lockedAt: new Date(),
            }
          : {}),
      },
      { transaction },
    );

    await writeAuditLog(
      buildAuditBase(request, {
        actorUserId: user.id,
        targetUserId: user.id,
        action: AUDIT_ACTIONS.LOGIN_FAILURE,
        metadata: { reason, failedLoginAttempts: nextAttempts },
      }),
      { transaction },
    );

    if (shouldLock) {
      await writeAuditLog(
        buildAuditBase(request, {
          actorUserId: lockedUser.id,
          targetUserId: lockedUser.id,
          action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
          metadata: { reason: 'MAX_FAILED_LOGIN_ATTEMPTS' },
        }),
        { transaction },
      );

      await writeAccountStatusChangeAudit({
        request,
        actorUserId: lockedUser.id,
        targetUserId: lockedUser.id,
        previousStatus,
        nextStatus: ACCOUNT_STATUSES.LOCKED,
        metadata: { reason: 'MAX_FAILED_LOGIN_ATTEMPTS' },
        transaction,
      });
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function logBlockedLoginAttempt(user, request, reason) {
  await writeAuditLog(
    buildAuditBase(request, {
      actorUserId: user.id,
      targetUserId: user.id,
      action: AUDIT_ACTIONS.LOGIN_FAILURE,
      metadata: { reason },
    }),
  );
}

async function createPasswordTokenForUser({ user, request, transaction }) {
  await invalidateOutstandingPasswordTokens(
    user.id,
    PASSWORD_TOKEN_PURPOSES.PASSWORD_RESET,
    transaction,
  );

  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + env.security.passwordResetTokenTtlMinutes * 60 * 1000);

  await PasswordResetTokenModel.create(
    {
      userId: user.id,
      purpose: PASSWORD_TOKEN_PURPOSES.PASSWORD_RESET,
      tokenHash: hashOpaqueToken(rawToken),
      expiresAt,
      requestedByIp: request.requestContext?.ipAddress || request.ip || null,
      userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
    },
    { transaction },
  );

  return rawToken;
}

async function updateUserPassword({ user, newPassword, status, mustChangePassword, transaction }) {
  await user.update(
    {
      passwordHash: await hashPassword(newPassword),
      status,
      mustChangePassword,
      failedLoginAttempts: 0,
      lockedAt: null,
      passwordChangedAt: new Date(),
    },
    { transaction },
  );
}

export async function login({ workEmail, password, request }) {
  const normalizedEmail = workEmail.trim().toLowerCase();
  const user = await UserModel.findOne({
    where: { workEmail: normalizedEmail },
  });

  if (!user) {
    await writeAuditLog(
      buildAuditBase(request, {
        action: AUDIT_ACTIONS.LOGIN_FAILURE,
        metadata: { reason: 'UNKNOWN_EMAIL', workEmail: normalizedEmail },
      }),
    );

    throw createInvalidCredentialsError();
  }

  if (user.status === ACCOUNT_STATUSES.DISABLED) {
    await logBlockedLoginAttempt(user, request, 'ACCOUNT_DISABLED');
    throw createInvalidCredentialsError();
  }

  if (user.status === ACCOUNT_STATUSES.LOCKED) {
    await logBlockedLoginAttempt(user, request, 'ACCOUNT_LOCKED');
    throw createInvalidCredentialsError();
  }

  if (!LOGIN_ALLOWED_STATUSES.includes(user.status)) {
    await logBlockedLoginAttempt(user, request, 'STATUS_NOT_ALLOWED');
    throw createInvalidCredentialsError();
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    await markLoginFailure(user, request, 'INVALID_CREDENTIALS');
    throw createInvalidCredentialsError();
  }

  const transaction = await sequelize.transaction();

  try {
    await user.update(
      {
        failedLoginAttempts: 0,
        lockedAt: null,
        lastLoginAt: new Date(),
      },
      { transaction },
    );

    const tokens = await createRefreshSession(user, request, transaction);

    await writeAuditLog(
      buildAuditBase(request, {
        actorUserId: user.id,
        targetUserId: user.id,
        action: AUDIT_ACTIONS.LOGIN_SUCCESS,
        metadata: {
          mustChangePassword: user.mustChangePassword,
          status: user.status,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return {
      ...tokens,
      user: serializeUser(user),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function refreshSession({ refreshToken, request }) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required', 'REFRESH_REQUIRED');
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw createInvalidRefreshTokenError();
  }
  const tokenHash = hashOpaqueToken(refreshToken);
  const now = new Date();
  const transaction = await sequelize.transaction();

  try {
    const tokenRecord = await RefreshTokenModel.findOne({
      where: {
        tokenId: decoded.jti,
      },
      include: [{ model: UserModel, as: 'user' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!tokenRecord?.user || tokenRecord.userId !== decoded.sub || tokenRecord.tokenHash !== tokenHash) {
      throw createInvalidRefreshTokenError();
    }

    if (tokenRecord.revokedAt) {
      if (
        tokenRecord.replacedByTokenId ||
        tokenRecord.revokedReason === 'ROTATED' ||
        tokenRecord.revokedReason === 'TOKEN_REUSE_DETECTED'
      ) {
        await revokeRefreshTokenFamily({
          userId: tokenRecord.userId,
          familyId: tokenRecord.familyId,
          reason: 'TOKEN_REUSE_DETECTED',
          transaction,
        });
      }

      await transaction.commit();
      throw createInvalidRefreshTokenError();
    }

    if (tokenRecord.expiresAt <= now) {
      await tokenRecord.update(
        {
          revokedAt: now,
          revokedReason: 'EXPIRED',
        },
        { transaction },
      );

      await transaction.commit();
      throw createInvalidRefreshTokenError();
    }

    if (!LOGIN_ALLOWED_STATUSES.includes(tokenRecord.user.status)) {
      throw createInvalidRefreshTokenError();
    }

    const nextSession = await createRefreshSession(tokenRecord.user, request, transaction, {
      familyId: tokenRecord.familyId,
    });

    await tokenRecord.update(
      {
        lastUsedAt: now,
        revokedAt: now,
        revokedReason: 'ROTATED',
        replacedByTokenId: nextSession.tokenId,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      accessToken: nextSession.accessToken,
      refreshToken: nextSession.refreshToken,
      user: serializeUser(tokenRecord.user),
    };
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
}

export async function logout({ refreshToken, request }) {
  if (!refreshToken) {
    return { success: true };
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenRecord = await RefreshTokenModel.findOne({
      where: {
        tokenId: decoded.jti,
        tokenHash: hashOpaqueToken(refreshToken),
      },
    });

    if (tokenRecord && !tokenRecord.revokedAt) {
      await tokenRecord.update({
        revokedAt: new Date(),
        revokedReason: 'USER_LOGOUT',
      });
    }

    if (request.user?.id) {
      await writeAuditLog(
        buildAuditBase(request, {
          actorUserId: request.user.id,
          targetUserId: request.user.id,
          action: AUDIT_ACTIONS.LOGOUT,
        }),
      );
    }
  } catch {
    // Intentionally swallow invalid refresh token errors during logout.
  }

  return { success: true };
}

export async function requestPasswordReset({ workEmail, request }) {
  const normalizedEmail = workEmail.trim().toLowerCase();
  const user = await UserModel.findOne({
    where: { workEmail: normalizedEmail },
  });

  if (!user || user.status === ACCOUNT_STATUSES.DISABLED) {
    return buildGenericForgotPasswordResponse();
  }

  if (!RESET_ALLOWED_STATUSES.includes(user.status)) {
    return buildGenericForgotPasswordResponse();
  }

  const transaction = await sequelize.transaction();

  try {
    const rawToken = await createPasswordTokenForUser({
      user,
      request,
      transaction,
    });

    await writeAuditLog(
      buildAuditBase(request, {
        actorUserId: user.id,
        targetUserId: user.id,
        action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      }),
      { transaction },
    );

    await dispatchPasswordResetEmail({ user, token: rawToken });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return buildGenericForgotPasswordResponse();
}

export async function resetPassword({ token, newPassword, request }) {
  const tokenHash = hashOpaqueToken(token);
  const transaction = await sequelize.transaction();

  try {
    const passwordToken = await PasswordResetTokenModel.findOne({
      where: {
        tokenHash,
        usedAt: null,
        invalidatedAt: null,
        purpose: PASSWORD_TOKEN_PURPOSES.PASSWORD_RESET,
        expiresAt: {
          [Op.gt]: new Date(),
        },
      },
      include: [{ model: UserModel, as: 'user' }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!passwordToken?.user) {
      throw new ApiError(400, 'Reset token is invalid or expired', 'INVALID_RESET_TOKEN');
    }

    const previousStatus = passwordToken.user.status;

    if (passwordToken.user.passwordHash) {
      const isReusedPassword = await verifyPassword(newPassword, passwordToken.user.passwordHash);

      if (isReusedPassword) {
        throw new ApiError(
          400,
          'New password must be different from the current password',
          'PASSWORD_REUSE',
        );
      }
    }

    await updateUserPassword({
      user: passwordToken.user,
      newPassword,
      status: ACCOUNT_STATUSES.ACTIVE,
      mustChangePassword: false,
      transaction,
    });

    await passwordToken.update(
      {
        usedAt: new Date(),
      },
      { transaction },
    );

    await PasswordResetTokenModel.update(
      {
        invalidatedAt: new Date(),
      },
      {
        where: {
          userId: passwordToken.user.id,
          id: {
            [Op.ne]: passwordToken.id,
          },
          usedAt: null,
          invalidatedAt: null,
        },
        transaction,
      },
    );

    await revokeRefreshTokensForUser(passwordToken.user.id, 'PASSWORD_RESET', transaction);

    await writeAccountStatusChangeAudit({
      request,
      actorUserId: passwordToken.user.id,
      targetUserId: passwordToken.user.id,
      previousStatus,
      nextStatus: passwordToken.user.status,
      metadata: { reason: 'PASSWORD_RESET' },
      transaction,
    });

    await writeAuditLog(
      buildAuditBase(request, {
        actorUserId: passwordToken.user.id,
        targetUserId: passwordToken.user.id,
        action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
      }),
      { transaction },
    );

    await transaction.commit();

    return { message: 'Password has been updated successfully' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function changePassword({ userId, oldPassword, newPassword, request }) {
  const user = await UserModel.findByPk(userId);

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  if (user.mustChangePassword) {
    throw new ApiError(
      403,
      'Complete the first-login password reset before using the standard change-password flow',
      'FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED',
    );
  }

  const isCurrentPasswordValid = await verifyPassword(oldPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }

  const isSamePassword = await verifyPassword(newPassword, user.passwordHash);

  if (isSamePassword) {
    throw new ApiError(
      400,
      'New password must be different from the current password',
      'PASSWORD_REUSE',
    );
  }

  const transaction = await sequelize.transaction();

  try {
    const previousStatus = user.status;

    await updateUserPassword({
      user,
      newPassword,
      status: ACCOUNT_STATUSES.ACTIVE,
      mustChangePassword: false,
      transaction,
    });

    await invalidateOutstandingPasswordTokens(
      user.id,
      PASSWORD_TOKEN_PURPOSES.PASSWORD_RESET,
      transaction,
    );
    await revokeRefreshTokensForUser(user.id, 'PASSWORD_CHANGE', transaction);

    await writeAccountStatusChangeAudit({
      request,
      actorUserId: user.id,
      targetUserId: user.id,
      previousStatus,
      nextStatus: user.status,
      metadata: { reason: 'PASSWORD_CHANGE' },
      transaction,
    });

    await writeAuditLog(
      buildAuditBase(request, {
        actorUserId: user.id,
        targetUserId: user.id,
        action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      }),
      { transaction },
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return {
    message: 'Password changed successfully. Please sign in again.',
    reauthenticate: true,
  };
}

export async function completeFirstLoginPasswordReset({ userId, newPassword, request }) {
  const user = await UserModel.findByPk(userId);

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  if (!user.mustChangePassword) {
    throw new ApiError(
      403,
      'This account is not waiting for a first-login password reset',
      'PASSWORD_CHANGE_NOT_REQUIRED',
    );
  }

  if (user.status !== ACCOUNT_STATUSES.PENDING_FIRST_LOGIN) {
    throw new ApiError(
      403,
      'This account is not in a first-login state',
      'ACCOUNT_NOT_PENDING_FIRST_LOGIN',
    );
  }

  if (user.passwordHash) {
    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);

    if (isSamePassword) {
      throw new ApiError(
        400,
        'New password must be different from the current password',
        'PASSWORD_REUSE',
      );
    }
  }

  const transaction = await sequelize.transaction();

  try {
    const previousStatus = user.status;

    await updateUserPassword({
      user,
      newPassword,
      status: ACCOUNT_STATUSES.ACTIVE,
      mustChangePassword: false,
      transaction,
    });

    await invalidateOutstandingPasswordTokens(
      user.id,
      PASSWORD_TOKEN_PURPOSES.PASSWORD_RESET,
      transaction,
    );
    await revokeRefreshTokensForUser(user.id, 'FIRST_LOGIN_PASSWORD_RESET', transaction);
    const refreshedUser = await user.reload({ transaction });
    const tokens = await createRefreshSession(refreshedUser, request, transaction);

    await writeAccountStatusChangeAudit({
      request,
      actorUserId: refreshedUser.id,
      targetUserId: refreshedUser.id,
      previousStatus,
      nextStatus: refreshedUser.status,
      metadata: { reason: 'FIRST_LOGIN_PASSWORD_RESET' },
      transaction,
    });

    await writeAuditLog(
      buildAuditBase(request, {
        actorUserId: refreshedUser.id,
        targetUserId: refreshedUser.id,
        action: AUDIT_ACTIONS.FIRST_LOGIN_PASSWORD_RESET_COMPLETED,
        metadata: {
          status: refreshedUser.status,
          mustChangePassword: refreshedUser.mustChangePassword,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return {
      ...tokens,
      message: 'Password updated successfully. Welcome to Secure HRMS.',
      user: serializeUser(refreshedUser),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function createTemporaryPasswordForUser() {
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  return {
    temporaryPassword,
    passwordHash,
  };
}
