import { body, param } from 'express-validator';

export const salaryUserIdParamValidators = [
  param('userId').isUUID().withMessage('User id must be a valid UUID'),
];

export const upsertSalaryValidators = [
  body('baseSalary')
    .notEmpty()
    .withMessage('Base salary is required')
    .isFloat({ min: 0 })
    .withMessage('Base salary must be 0 or more'),
  body('effectiveDate')
    .notEmpty()
    .withMessage('Effective date is required')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Effective date must be a valid date in YYYY-MM-DD format'),
];
