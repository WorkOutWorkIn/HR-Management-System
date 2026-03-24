import { body } from 'express-validator';

const profileFields = [
  'fullName',
  'phoneNumber',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
  'emergencyContactName',
  'emergencyContactPhone',
];

function optionalTrimmedString(field, maxLength) {
  return body(field)
    .optional()
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${field} must be between 1 and ${maxLength} characters`);
}

export const updateProfileValidators = [
  ...profileFields.map((field) => optionalTrimmedString(field, field.includes('Phone') ? 30 : 160)),
  body().custom((value) => {
    const hasAnyField = profileFields.some((field) => value[field] !== undefined);

    if (!hasAnyField) {
      throw new Error('Provide at least one profile field to update');
    }

    return true;
  }),
];
