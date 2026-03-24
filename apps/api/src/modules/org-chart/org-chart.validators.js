import { body, param, query } from 'express-validator';

export const employeeIdParamValidators = [
  param('employeeId').isUUID().withMessage('Employee id must be a valid UUID'),
];

export const assignManagerValidators = [
  ...employeeIdParamValidators,
  body('managerUserId')
    .optional({ nullable: true, values: 'null' })
    .isUUID()
    .withMessage('Manager user id must be a valid UUID'),
];

export const directReportsQueryValidators = [
  query('managerUserId')
    .optional()
    .isUUID()
    .withMessage('Manager user id must be a valid UUID'),
];
