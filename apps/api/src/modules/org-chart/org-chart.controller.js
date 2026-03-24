import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  assignEmployeeManager,
  getMyReportingLine,
  listDirectReports,
  listReportingRelationships,
} from './org-chart.service.js';

export const getMyReportingLineController = asyncHandler(async (request, response) => {
  const result = await getMyReportingLine(request.user.id);
  response.status(200).json(result);
});

export const listDirectReportsController = asyncHandler(async (request, response) => {
  const result = await listDirectReports({
    actorUserId: request.user.id,
    managerUserId: request.query.managerUserId,
  });

  response.status(200).json(result);
});

export const listReportingRelationshipsController = asyncHandler(async (request, response) => {
  const result = await listReportingRelationships(request.user.id);
  response.status(200).json(result);
});

export const assignEmployeeManagerController = asyncHandler(async (request, response) => {
  const result = await assignEmployeeManager({
    actorUserId: request.user.id,
    employeeId: request.params.employeeId,
    managerUserId: request.body.managerUserId || null,
    request,
  });

  response.status(200).json(result);
});
