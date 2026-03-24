import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  approveLeaveRequest,
  createLeaveRequest,
  createPublicHoliday,
  deletePublicHoliday,
  getMyLeaveBalance,
  listAllLeaveRequests,
  listMyLeaveRequests,
  listPendingApprovals,
  listPublicHolidays,
  rejectLeaveRequest,
} from './leave.service.js';

export const createLeaveRequestController = asyncHandler(async (request, response) => {
  const leaveRequest = await createLeaveRequest({
    actorUserId: request.user.id,
    payload: request.body,
    request,
  });

  response.status(201).json({ leaveRequest });
});

export const listMyLeaveRequestsController = asyncHandler(async (request, response) => {
  const result = await listMyLeaveRequests(request.user.id);
  response.status(200).json(result);
});

export const listPendingApprovalsController = asyncHandler(async (request, response) => {
  const result = await listPendingApprovals(request.user.id);
  response.status(200).json(result);
});

export const listAllLeaveRequestsController = asyncHandler(async (request, response) => {
  const result = await listAllLeaveRequests(request.user.id, {
    status: request.query.status,
    leaveType: request.query.leaveType,
  });

  response.status(200).json(result);
});

export const approveLeaveRequestController = asyncHandler(async (request, response) => {
  const leaveRequest = await approveLeaveRequest({
    actorUserId: request.user.id,
    leaveRequestId: request.params.id,
    decisionComment: request.body.decisionComment,
    request,
  });

  response.status(200).json({ leaveRequest });
});

export const rejectLeaveRequestController = asyncHandler(async (request, response) => {
  const leaveRequest = await rejectLeaveRequest({
    actorUserId: request.user.id,
    leaveRequestId: request.params.id,
    decisionComment: request.body.decisionComment,
    request,
  });

  response.status(200).json({ leaveRequest });
});

export const getMyLeaveBalanceController = asyncHandler(async (request, response) => {
  const balance = await getMyLeaveBalance(request.user.id);
  response.status(200).json({ balance });
});

export const listPublicHolidaysController = asyncHandler(async (_request, response) => {
  const result = await listPublicHolidays();
  response.status(200).json(result);
});

export const createPublicHolidayController = asyncHandler(async (request, response) => {
  const holiday = await createPublicHoliday({
    actorUserId: request.user.id,
    payload: request.body,
    request,
  });

  response.status(201).json({ holiday });
});

export const deletePublicHolidayController = asyncHandler(async (request, response) => {
  await deletePublicHoliday({
    actorUserId: request.user.id,
    holidayId: request.params.id,
    request,
  });

  response.status(204).send();
});
