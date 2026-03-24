import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createEmployee,
  getEmployeeById,
  listEmployees,
  unlockEmployee,
  updateEmployee,
} from './employees.service.js';

export const listEmployeesController = asyncHandler(async (request, response) => {
  const result = await listEmployees({
    search: request.query.search,
    role: request.query.role,
    status: request.query.status,
  });

  response.status(200).json(result);
});

export const getEmployeeController = asyncHandler(async (request, response) => {
  const user = await getEmployeeById(request.params.id);
  response.status(200).json({ user });
});

export const createEmployeeController = asyncHandler(async (request, response) => {
  const result = await createEmployee({
    actorUserId: request.user.id,
    payload: request.body,
    request,
  });

  response.status(201).json(result);
});

export const updateEmployeeController = asyncHandler(async (request, response) => {
  const user = await updateEmployee({
    actorUserId: request.user.id,
    employeeId: request.params.id,
    payload: request.body,
    request,
  });

  response.status(200).json({ user });
});

export const unlockEmployeeController = asyncHandler(async (request, response) => {
  const user = await unlockEmployee({
    actorUserId: request.user.id,
    employeeId: request.params.id,
    request,
  });

  response.status(200).json({ user });
});
