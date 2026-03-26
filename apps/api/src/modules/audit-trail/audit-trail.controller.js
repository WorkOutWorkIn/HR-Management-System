import { asyncHandler } from '../../utils/asyncHandler.js';
import { listAuditTrailEntries } from './audit-trail.service.js';

function parseActionsQueryParam(value) {
  if (!value) {
    return undefined;
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const listAuditTrailController = asyncHandler(async (request, response) => {
  const result = await listAuditTrailEntries({
    actions: parseActionsQueryParam(request.query.actions),
    limit: request.query.limit ? Number(request.query.limit) : undefined,
    page: request.query.page ? Number(request.query.page) : undefined,
  });

  response.status(200).json(result);
});
