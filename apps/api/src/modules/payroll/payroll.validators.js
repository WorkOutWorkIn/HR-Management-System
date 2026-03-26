import { body, param } from 'express-validator';

export const payrollUserIdParamValidators = [
  param('userId').isUUID().withMessage('User id must be a valid UUID'),
];

export const payrollMonthValidators = [
  body('payrollMonth')
    .notEmpty()
    .withMessage('Payroll month is required')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Payroll month must use YYYY-MM format'),
];

export const payrollCorrectionValidators = [
  ...payrollUserIdParamValidators,
  param('payrollRecordId').isUUID().withMessage('Payroll record id must be a valid UUID'),
  body('baseSalary')
    .notEmpty()
    .withMessage('Corrected base salary is required')
    .isFloat({ min: 0 })
    .withMessage('Corrected base salary must be 0 or more'),
  body('deductionAmount')
    .notEmpty()
    .withMessage('Corrected deduction amount is required')
    .isFloat({ min: 0 })
    .withMessage('Corrected deduction amount must be 0 or more'),
  body('correctionReason')
    .trim()
    .notEmpty()
    .withMessage('Correction reason is required')
    .isLength({ max: 255 })
    .withMessage('Correction reason must be 255 characters or fewer'),
];
