const SENSITIVE_KEY_PATTERNS = [
  'password',
  'newpassword',
  'oldpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'cookies',
  'secret',
  'resettoken',
];

function isSensitiveKey(key) {
  const normalizedKey = String(key)
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalizedKey.includes(pattern));
}

function sanitizeValue(value, seen) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Buffer.isBuffer(value)) {
    return `[Buffer length=${value.length}]`;
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : sanitizeValue(nestedValue, seen),
    ]),
  );
}

export function sanitizeLogData(value) {
  return sanitizeValue(value, new WeakSet());
}
