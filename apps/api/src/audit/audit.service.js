import { AuditLogModel } from '../database/models/index.js';

export function buildAuditPayload(request, overrides = {}) {
  return {
    actorUserId: request.user?.id || null,
    targetUserId: null,
    action: 'UNSPECIFIED',
    ipAddress: request.requestContext?.ipAddress || request.ip || null,
    userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
    metadata: {},
    ...overrides,
  };
}

export async function writeAuditLog(payload, options = {}) {
  return AuditLogModel.create(payload, options);
}
