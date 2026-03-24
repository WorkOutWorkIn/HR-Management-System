import { body } from 'express-validator';
import { validatePasswordPolicy } from '../../utils/password.utils.js';

const emailValidator = body('workEmail')
  .trim()
  .notEmpty()
  .withMessage('Work email is required')
  .isEmail()
  .withMessage('Enter a valid work email')
  .normalizeEmail();

const passwordValidator = body('password')
  .notEmpty()
  .withMessage('Password is required')
  .bail()
  .isString()
  .withMessage('Password must be a string');

const newPasswordValidator = body('newPassword')
  .notEmpty()
  .withMessage('New password is required')
  .bail()
  .custom((value) => {
    const policyError = validatePasswordPolicy(value);

    if (policyError) {
      throw new Error(policyError);
    }

    return true;
  });

export const loginValidators = [emailValidator, passwordValidator];

export const forgotPasswordValidators = [emailValidator];

export const resetPasswordValidators = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  newPasswordValidator,
];

export const changePasswordValidators = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required')
    .bail()
    .isString()
    .withMessage('Current password must be a string'),
  newPasswordValidator,
];

export const completeFirstLoginPasswordValidators = [newPasswordValidator];
