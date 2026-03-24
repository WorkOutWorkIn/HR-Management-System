import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

function createAuthLimiter(max) {
  return rateLimit({
    windowMs: env.rateLimit.authWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
  });
}

export const loginRateLimiter = createAuthLimiter(env.rateLimit.loginMax);
export const forgotPasswordRateLimiter = createAuthLimiter(env.rateLimit.forgotPasswordMax);
