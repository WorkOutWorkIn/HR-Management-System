import { REFRESH_COOKIE_NAME } from '../../constants/auth.js';
import env from '../../config/env.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ttlToMilliseconds } from '../../utils/token.utils.js';
import {
  changePassword,
  completeFirstLoginPasswordReset,
  login,
  logout,
  refreshSession,
  requestPasswordReset,
  resetPassword,
} from './auth.service.js';

function buildRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: `${env.apiPrefix}/auth`,
    maxAge: ttlToMilliseconds(env.jwt.refreshTokenTtl),
  };
}

export const loginController = asyncHandler(async (request, response) => {
  const result = await login({
    workEmail: request.body.workEmail,
    password: request.body.password,
    request,
  });

  response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());
  response.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const refreshController = asyncHandler(async (request, response) => {
  const result = await refreshSession({
    refreshToken: request.cookies[REFRESH_COOKIE_NAME],
    request,
  });

  response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());
  response.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
});

export const logoutController = asyncHandler(async (request, response) => {
  await logout({
    refreshToken: request.cookies[REFRESH_COOKIE_NAME],
    request,
  });

  response.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions());
  response.status(200).json({ message: 'Logged out successfully' });
});

export const forgotPasswordController = asyncHandler(async (request, response) => {
  const result = await requestPasswordReset({
    workEmail: request.body.workEmail,
    request,
  });

  response.status(200).json(result);
});

export const resetPasswordController = asyncHandler(async (request, response) => {
  const result = await resetPassword({
    token: request.body.token,
    newPassword: request.body.newPassword,
    request,
  });

  response.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions());
  response.status(200).json(result);
});

export const changePasswordController = asyncHandler(async (request, response) => {
  const result = await changePassword({
    userId: request.user.id,
    oldPassword: request.body.oldPassword,
    newPassword: request.body.newPassword,
    request,
  });

  response.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions());
  response.status(200).json(result);
});

export const completeFirstLoginPasswordController = asyncHandler(async (request, response) => {
  const result = await completeFirstLoginPasswordReset({
    userId: request.user.id,
    newPassword: request.body.newPassword,
    request,
  });

  response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, buildRefreshCookieOptions());
  response.status(200).json({
    accessToken: result.accessToken,
    message: result.message,
    user: result.user,
  });
});
