import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validateRequest(request, _response, next) {
  const errors = validationResult(request);

  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', {
      errors: errors.array().map(({ msg, path, value }) => ({
        message: msg,
        field: path,
        value,
      })),
    }),
  );
}
