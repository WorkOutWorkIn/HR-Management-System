import { randomUUID } from 'node:crypto';
import env from '../config/env.js';

export function requestContextMiddleware(request, response, next) {
  const requestId = request.header(env.requestIdHeaderName) || randomUUID();

  request.requestContext = {
    requestId,
    startedAt: Date.now(),
    ipAddress: request.ip,
    userAgent: request.get('user-agent') || 'unknown',
  };

  response.setHeader(env.requestIdHeaderName, requestId);
  next();
}
