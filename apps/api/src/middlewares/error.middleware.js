import env from '../config/env.js';
import { logApiError } from '../utils/errorLogger.js';

function normalizeError(error) {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unexpected server error');
}

export function errorMiddleware(error, request, response, next) {
  const normalizedError = normalizeError(error);
  const statusCode = normalizedError.statusCode || 500;
  const code = normalizedError.code || 'INTERNAL_ERROR';
  const requestId = request.requestContext?.requestId;
  const isServerError = statusCode >= 500;
  const message =
    isServerError && env.isProduction
      ? 'Internal server error'
      : normalizedError.message || 'Internal server error';

  if (response.headersSent) {
    return next(normalizedError);
  }

  logApiError({
    error: normalizedError,
    request,
    statusCode,
  });

  response.status(statusCode).json({
    code,
    message,
    ...(requestId ? { requestId } : {}),
    ...(env.nodeEnv !== 'production' && normalizedError.details
      ? { details: normalizedError.details }
      : {}),
    ...(env.nodeEnv !== 'production' && normalizedError.stack
      ? { stack: normalizedError.stack }
      : {}),
  });
}
