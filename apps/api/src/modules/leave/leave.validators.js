import { body, param, query } from 'express-validator';
import { LEAVE_DAY_PORTIONS, LEAVE_REQUEST_STATUSES, LEAVE_TYPES } from '@hrms/shared';

const isoDateValidator = (field, label) =>
  body(field)
    .notEmpty()
    .withMessage(`${label} is required`)
    .bail()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage(`${label} must be a valid date in YYYY-MM-DD format`);

const optionalDecisionComment = body('decisionComment')
  .optional()
  .trim()
  .isLength({ min: 1, max: 500 })
  .withMessage('Decision comment must be between 1 and 500 characters');

export const createLeaveRequestValidators = [
  body('leaveType')
    .notEmpty()
    .withMessage('Leave type is required')
    .isIn(Object.values(LEAVE_TYPES))
    .withMessage('Leave type is invalid'),
  isoDateValidator('startDate', 'Start date'),
  isoDateValidator('endDate', 'End date'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
  body('startDayPortion')
    .optional()
    .isIn(Object.values(LEAVE_DAY_PORTIONS))
    .withMessage('Start day portion is invalid'),
  body('endDayPortion')
    .optional()
    .isIn(Object.values(LEAVE_DAY_PORTIONS))
    .withMessage('End day portion is invalid'),
];

export const leaveRequestIdParamValidators = [
  param('id').isUUID().withMessage('Leave request id must be a valid UUID'),
];

export const approveLeaveValidators = [...leaveRequestIdParamValidators, optionalDecisionComment];

export const rejectLeaveValidators = [...leaveRequestIdParamValidators, optionalDecisionComment];

export const listLeaveRequestValidators = [
  query('status')
    .optional()
    .isIn(Object.values(LEAVE_REQUEST_STATUSES))
    .withMessage('Status filter is invalid'),
  query('leaveType')
    .optional()
    .isIn(Object.values(LEAVE_TYPES))
    .withMessage('Leave type filter is invalid'),
];

export const publicHolidayIdParamValidators = [
  param('id').isUUID().withMessage('Public holiday id must be a valid UUID'),
];

export const createPublicHolidayValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Holiday name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('Holiday name must be between 2 and 120 characters'),
  isoDateValidator('holidayDate', 'Holiday date'),
];
