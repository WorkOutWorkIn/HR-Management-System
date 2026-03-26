import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  generatePayrollForEveryone,
  issuePayrollCorrectionForUser,
  getPayrollForUser,
  listMyPayroll,
  listPayrollUsers,
} from './payroll.service.js';

export const listMyPayrollController = asyncHandler(async (request, response) => {
  const result = await listMyPayroll({
    actorUserId: request.user.id,
    request,
  });
  response.status(200).json(result);
});

export const listPayrollUsersController = asyncHandler(async (request, response) => {
  const result = await listPayrollUsers({
    search: request.query.search,
  });

  response.status(200).json(result);
});

export const getPayrollForUserController = asyncHandler(async (request, response) => {
  const result = await getPayrollForUser({
    actorUserId: request.user.id,
    userId: request.params.userId,
    request,
  });
  response.status(200).json(result);
});

export const generatePayrollForEveryoneController = asyncHandler(async (request, response) => {
  const result = await generatePayrollForEveryone({
    actorUserId: request.user.id,
    payrollMonth: request.body.payrollMonth,
    request,
  });

  response.status(201).json(result);
});

export const issuePayrollCorrectionForUserController = asyncHandler(async (request, response) => {
  const result = await issuePayrollCorrectionForUser({
    actorUserId: request.user.id,
    userId: request.params.userId,
    payrollRecordId: request.params.payrollRecordId,
    payload: request.body,
    request,
  });

  response.status(201).json(result);
});
