import { Router } from 'express';
import { requireAuth, requirePendingPasswordChange } from '../../middlewares/auth.middleware.js';
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
} from '../../middlewares/rateLimit.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import {
  changePasswordController,
  completeFirstLoginPasswordController,
  forgotPasswordController,
  loginController,
  logoutController,
  refreshController,
  resetPasswordController,
} from './auth.controller.js';
import {
  changePasswordValidators,
  completeFirstLoginPasswordValidators,
  forgotPasswordValidators,
  loginValidators,
  resetPasswordValidators,
} from './auth.validators.js';

const router = Router();

router.post('/login', loginRateLimiter, loginValidators, validateRequest, loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  forgotPasswordValidators,
  validateRequest,
  forgotPasswordController,
);
router.post('/reset-password', resetPasswordValidators, validateRequest, resetPasswordController);
router.post(
  '/complete-first-login-password',
  requireAuth,
  requirePendingPasswordChange,
  completeFirstLoginPasswordValidators,
  validateRequest,
  completeFirstLoginPasswordController,
);
router.post(
  '/change-password',
  requireAuth,
  changePasswordValidators,
  validateRequest,
  changePasswordController,
);

export default router;
