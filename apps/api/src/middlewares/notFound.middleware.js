import { ApiError } from '../utils/ApiError.js';

export function notFoundMiddleware(request, _response, next) {
  next(
    new ApiError(
      404,
      `Route not found: ${request.method} ${request.originalUrl}`,
      'ROUTE_NOT_FOUND',
      {
        method: request.method,
        url: request.originalUrl,
      },
    ),
  );
}
