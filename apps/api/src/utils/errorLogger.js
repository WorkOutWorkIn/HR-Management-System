import { sanitizeLogData } from './sanitizeLogData.js';

function serializeLogValue(value) {
  if (value === null || value === undefined) {
    return 'n/a';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(sanitizeLogData(value), null, 2);
  } catch {
    return '[Unserializable]';
  }
}

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unexpected non-error rejection');
}

export function logApiError({ error, request, statusCode }) {
  const normalizedError = normalizeError(error);
  const timestamp = new Date().toISOString();
  const requestId = request.requestContext?.requestId || 'n/a';
  const userId = request.user?.id || 'anonymous';
  const safeBody = sanitizeLogData(request.body);
  const safeParams = sanitizeLogData(request.params);
  const safeQuery = sanitizeLogData(request.query);

  const lines = [
    '========== API ERROR ==========',
    `Time: ${timestamp}`,
    `Request ID: ${requestId}`,
    `User ID: ${userId}`,
    `Method: ${request.method}`,
    `URL: ${request.originalUrl}`,
    `Status: ${statusCode}`,
    `Message: ${normalizedError.message}`,
    `Params: ${serializeLogValue(safeParams)}`,
    `Query: ${serializeLogValue(safeQuery)}`,
    `Body: ${serializeLogValue(safeBody)}`,
    'Stack:',
    normalizedError.stack || 'n/a',
    '===============================',
  ];

  console.error(lines.join('\n'));
}

export function logProcessError(type, error) {
  const normalizedError = normalizeError(error);
  const lines = [
    `========== ${type} ==========`,
    `Time: ${new Date().toISOString()}`,
    `Message: ${normalizedError.message}`,
    'Stack:',
    normalizedError.stack || 'n/a',
    '===============================',
  ];

  console.error(lines.join('\n'));
}
