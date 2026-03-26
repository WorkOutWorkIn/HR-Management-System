import { query, body, param } from 'express-validator';
import { ROLES } from '@hrms/shared';
import { ACCOUNT_STATUSES, ADMIN_EDITABLE_STATUSES } from '../../constants/account-statuses.js';

function optionalTrimmedString(field, maxLength) {
  return body(field)
    .optional()
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must be between 1 and ${maxLength} characters`);
}

export const listEmployeesValidators = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('Search must be between 1 and 120 characters'),
  query('role').optional().isIn(Object.values(ROLES)).withMessage('Role filter is invalid'),
  query('status')
    .optional()
    .isIn(Object.values(ACCOUNT_STATUSES))
    .withMessage('Status filter is invalid'),
];

export const employeeIdParamValidators = [
  param('id').isUUID().withMessage('Employee id must be a valid UUID'),
];

export const createEmployeeValidators = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Full name must be between 2 and 120 characters'),
  body('workEmail')
    .trim()
    .notEmpty()
    .withMessage('Work email is required')
    .isEmail()
    .withMessage('Enter a valid work email')
    .normalizeEmail(),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(Object.values(ROLES))
    .withMessage('Role is invalid'),
  body('managerUserId')
    .optional({ nullable: true, values: 'null' })
    .isUUID()
    .withMessage('Manager user id must be a valid UUID'),
  body('annualLeaveQuota')
    .optional()
    .isFloat({ min: 0, max: 365 })
    .withMessage('Annual leave quota must be between 0 and 365 days'),
  body('sickLeaveQuota')
    .optional()
    .isFloat({ min: 0, max: 365 })
    .withMessage('Sick leave quota must be between 0 and 365 days'),
  optionalTrimmedString('department', 100),
  optionalTrimmedString('jobTitle', 100),
];

const adminPatchFields = [
  optionalTrimmedString('fullName', 120),
  optionalTrimmedString('department', 100),
  optionalTrimmedString('jobTitle', 100),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Role is invalid'),
  body('status').optional().isIn(ADMIN_EDITABLE_STATUSES).withMessage('Status is invalid'),
  body('managerUserId')
    .optional({ nullable: true, values: 'null' })
    .isUUID()
    .withMessage('Manager user id must be a valid UUID'),
  body('annualLeaveQuota')
    .optional()
    .isFloat({ min: 0, max: 365 })
    .withMessage('Annual leave quota must be between 0 and 365 days'),
  body('sickLeaveQuota')
    .optional()
    .isFloat({ min: 0, max: 365 })
    .withMessage('Sick leave quota must be between 0 and 365 days'),
];

export const updateEmployeeValidators = [
  ...adminPatchFields,
  body().custom((value) => {
    const hasAnyField = [
      'fullName',
      'department',
      'jobTitle',
      'role',
      'status',
      'managerUserId',
      'annualLeaveQuota',
      'sickLeaveQuota',
    ].some((field) => value[field] !== undefined);

    if (!hasAnyField) {
      throw new Error('Provide at least one employee field to update');
    }

    return true;
  }),
];
