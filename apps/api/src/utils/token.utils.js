import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AUTH_TOKEN_TYPES } from '../constants/auth.js';

export function hashOpaqueToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken() {
  return randomBytes(48).toString('hex');
}

export function generateTokenId() {
  return randomUUID();
}

export function ttlToMilliseconds(ttl) {
  const match = /^(\d+)([mhd])$/.exec(ttl);

  if (!match) {
    throw new Error(`Unsupported TTL format: ${ttl}`);
  }

  const [, amount, unit] = match;
  const value = Number(amount);

  if (unit === 'm') {
    return value * 60 * 1000;
  }

  if (unit === 'h') {
    return value * 60 * 60 * 1000;
  }

  return value * 24 * 60 * 60 * 1000;
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: AUTH_TOKEN_TYPES.ACCESS,
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessTokenTtl },
  );
}

export function signRefreshToken({ user, tokenId }) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      jti: tokenId,
      type: AUTH_TOKEN_TYPES.REFRESH,
    },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshTokenTtl },
  );
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
