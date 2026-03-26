import {
  PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH,
  PERFORMANCE_REVIEW_RATING_MAX,
  PERFORMANCE_REVIEW_RATING_MIN,
  REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH,
  REVIEW_PERIOD_NAME_MAX_LENGTH,
  REVIEW_PERIOD_STATUSES,
} from '@hrms/shared';
import { body, param, query } from 'express-validator';

const strictIsoDateValidator = (source, field, label, { required = true } = {}) => {
  const validator = source(field);

  if (!required) {
    validator.optional();
  } else {
    validator.notEmpty().withMessage(`${label} is required`).bail();
  }

  return validator
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage(`${label} must be a valid date in YYYY-MM-DD format`);
};

const optionalCommentValidator = body('comment')
  .optional({ nullable: true })
  .trim()
  .isLength({ min: 1, max: PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH })
  .withMessage(
    `Comment must be between 1 and ${PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH} characters`,
  );

export const reviewPeriodIdParamValidators = [
  param('id').isUUID().withMessage('Review period id must be a valid UUID'),
];

export const performanceReviewIdParamValidators = [
  param('id').isUUID().withMessage('Performance review id must be a valid UUID'),
];

export const employeeIdParamValidators = [
  param('employeeId').isUUID().withMessage('Employee id must be a valid UUID'),
];

export const createReviewPeriodValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Review period name is required')
    .isLength({ min: 2, max: REVIEW_PERIOD_NAME_MAX_LENGTH })
    .withMessage(
      `Review period name must be between 2 and ${REVIEW_PERIOD_NAME_MAX_LENGTH} characters`,
    ),
  strictIsoDateValidator(body, 'startDate', 'Start date'),
  strictIsoDateValidator(body, 'endDate', 'End date'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 1, max: REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH })
    .withMessage(
      `Description must be between 1 and ${REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH} characters`,
    ),
];

export const listReviewPeriodsValidators = [
  query('status')
    .optional()
    .isIn(Object.values(REVIEW_PERIOD_STATUSES))
    .withMessage('Review period status filter is invalid'),
];

export const updateReviewPeriodValidators = [
  ...reviewPeriodIdParamValidators,
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Review period name cannot be empty')
    .isLength({ min: 2, max: REVIEW_PERIOD_NAME_MAX_LENGTH })
    .withMessage(
      `Review period name must be between 2 and ${REVIEW_PERIOD_NAME_MAX_LENGTH} characters`,
    ),
  strictIsoDateValidator(body, 'startDate', 'Start date', { required: false }),
  strictIsoDateValidator(body, 'endDate', 'End date', { required: false }),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 1, max: REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH })
    .withMessage(
      `Description must be between 1 and ${REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH} characters`,
    ),
];

export const openOrCloseReviewPeriodValidators = [...reviewPeriodIdParamValidators];

export const createPerformanceReviewValidators = [
  body('employeeId').notEmpty().withMessage('Employee id is required').bail().isUUID().withMessage('Employee id must be a valid UUID'),
  body('reviewPeriodId')
    .notEmpty()
    .withMessage('Review period id is required')
    .bail()
    .isUUID()
    .withMessage('Review period id must be a valid UUID'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .bail()
    .isInt({
      min: PERFORMANCE_REVIEW_RATING_MIN,
      max: PERFORMANCE_REVIEW_RATING_MAX,
    })
    .withMessage(
      `Rating must be an integer between ${PERFORMANCE_REVIEW_RATING_MIN} and ${PERFORMANCE_REVIEW_RATING_MAX}`,
    ),
  optionalCommentValidator,
];

export const updatePerformanceReviewValidators = [
  ...performanceReviewIdParamValidators,
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .bail()
    .isInt({
      min: PERFORMANCE_REVIEW_RATING_MIN,
      max: PERFORMANCE_REVIEW_RATING_MAX,
    })
    .withMessage(
      `Rating must be an integer between ${PERFORMANCE_REVIEW_RATING_MIN} and ${PERFORMANCE_REVIEW_RATING_MAX}`,
    ),
  optionalCommentValidator,
];

export const directReportReviewQueryValidators = [
  query('reviewPeriodId')
    .optional()
    .isUUID()
    .withMessage('Review period id must be a valid UUID'),
];

export const listPerformanceReviewValidators = [
  query('employeeId').optional().isUUID().withMessage('Employee id must be a valid UUID'),
  query('reviewerId').optional().isUUID().withMessage('Reviewer id must be a valid UUID'),
  query('reviewPeriodId').optional().isUUID().withMessage('Review period id must be a valid UUID'),
];
