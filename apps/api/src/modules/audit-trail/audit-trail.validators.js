import { query } from 'express-validator';
import { getSupportedAuditTrailActions } from './audit-trail.service.js';

const supportedActions = getSupportedAuditTrailActions();

export const listAuditTrailValidators = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be 1 or greater'),
  query('actions')
    .optional()
    .custom((value) => {
      const actions = String(value)
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (!actions.length) {
        throw new Error('Actions filter must include at least one event type');
      }

      const hasInvalidAction = actions.some((action) => !supportedActions.includes(action));

      if (hasInvalidAction) {
        throw new Error('Actions filter contains an invalid event type');
      }

      return true;
    }),
];
