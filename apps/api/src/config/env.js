import dotenv from 'dotenv';

dotenv.config();

function getString(name, fallback = '') {
  const value = process.env[name];

  if (value === undefined || value === '') {
    return fallback;
  }

  return value;
}

function getNumber(name, fallback) {
  const value = Number(process.env[name]);

  if (Number.isNaN(value)) {
    return fallback;
  }

  return value;
}

function getBoolean(name, fallback = false) {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

const nodeEnv = getString('NODE_ENV', 'development');
const appOrigins = getString('APP_ORIGIN', 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: getNumber('PORT', 5050),
  appOrigins,
  apiPrefix: getString('API_PREFIX', '/api/v1'),
  bodyLimit: getString('BODY_LIMIT', '1mb'),
  requestIdHeaderName: getString('REQUEST_ID_HEADER_NAME', 'x-request-id'),
  allowDevAuthHeaders: getBoolean('ALLOW_DEV_AUTH_HEADERS', false),
  rateLimit: {
    windowMs: getNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: getNumber('RATE_LIMIT_MAX', 100),
    authWindowMs: getNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    loginMax: getNumber('AUTH_LOGIN_RATE_LIMIT_MAX', 10),
    forgotPasswordMax: getNumber('AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX', 5),
  },
  db: {
    host: getString('DB_HOST', '127.0.0.1'),
    port: getNumber('DB_PORT', 3306),
    name: getString('DB_NAME', 'secure_hrms'),
    user: getString('DB_USER', 'root'),
    password: getString('DB_PASSWORD', ''),
    logging: getBoolean('DB_LOGGING', false),
    connectOnBoot: getBoolean('DB_CONNECT_ON_BOOT', false),
    pool: {
      min: getNumber('DB_POOL_MIN', 0),
      max: getNumber('DB_POOL_MAX', 10),
      idle: getNumber('DB_POOL_IDLE_MS', 10000),
      acquire: getNumber('DB_POOL_ACQUIRE_MS', 30000),
    },
  },
  jwt: {
    accessSecret: getString('JWT_ACCESS_SECRET', 'replace-me'),
    refreshSecret: getString('JWT_REFRESH_SECRET', 'replace-me'),
    accessTokenTtl: getString('ACCESS_TOKEN_TTL', '15m'),
    refreshTokenTtl: getString('REFRESH_TOKEN_TTL', '7d'),
  },
  security: {
    bcryptSaltRounds: getNumber('BCRYPT_SALT_ROUNDS', 12),
    maxFailedLoginAttempts: getNumber('MAX_FAILED_LOGIN_ATTEMPTS', 5),
    passwordResetTokenTtlMinutes: getNumber('PASSWORD_RESET_TOKEN_TTL_MINUTES', 30),
  },
  frontendUrl: getString('FRONTEND_URL', appOrigins[0] || 'http://localhost:5173'),
  portalUrl: getString('PORTAL_URL', ''),
  mail: {
    transport: getString('MAIL_TRANSPORT', 'mock'),
    secure: getBoolean('MAIL_SECURE', false),
    host: getString('SMTP_HOST', ''),
    port: getNumber('SMTP_PORT', 587),
    user: getString('SMTP_USER', ''),
    pass: getString('SMTP_PASS', ''),
    from: getString('SMTP_FROM', 'Secure HRMS <no-reply@hrms.local>'),
  },
};

env.portalUrl = env.portalUrl || new URL('/dashboard', env.frontendUrl).toString();

if (env.isProduction) {
  if (
    !env.jwt.accessSecret ||
    !env.jwt.refreshSecret ||
    env.jwt.accessSecret === 'replace-me' ||
    env.jwt.refreshSecret === 'replace-me'
  ) {
    throw new Error('JWT secrets must be set to strong values in production');
  }

  if (!env.db.password) {
    throw new Error('DB_PASSWORD must be configured in production');
  }

  if (env.mail.transport === 'smtp' && (!env.mail.host || !env.mail.user || !env.mail.pass)) {
    throw new Error('SMTP mail configuration must be set in production when MAIL_TRANSPORT=smtp');
  }
}

export default env;
