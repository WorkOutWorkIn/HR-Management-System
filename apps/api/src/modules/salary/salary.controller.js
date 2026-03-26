import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createSalaryRecordForUser,
  getMySalaryRecord,
  getSalaryRecordForUser,
  listUsersForSalaryAdmin,
} from './salary.service.js';

export const getMySalaryController = asyncHandler(async (request, response) => {
  const result = await getMySalaryRecord({
    actorUserId: request.user.id,
    request,
  });
  response.status(200).json(result);
});

export const listUsersForSalaryAdminController = asyncHandler(async (request, response) => {
  const result = await listUsersForSalaryAdmin({
    search: request.query.search,
  });

  response.status(200).json(result);
});

export const getSalaryForUserController = asyncHandler(async (request, response) => {
  const result = await getSalaryRecordForUser({
    actorUserId: request.user.id,
    userId: request.params.userId,
    request,
  });
  response.status(200).json(result);
});

export const upsertSalaryForUserController = asyncHandler(async (request, response) => {
  const result = await createSalaryRecordForUser({
    actorUserId: request.user.id,
    userId: request.params.userId,
    payload: request.body,
    request,
  });

  response.status(201).json(result);
});
