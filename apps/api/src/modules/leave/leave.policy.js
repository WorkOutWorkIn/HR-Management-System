import {
  LeaveValidationError,
  calculateRemainingLeaveDays,
  validateLeaveBalance,
  validateSickLeaveFullDayOnly,
} from '@hrms/shared';
import { ApiError } from '../../utils/ApiError.js';

export const ANNUAL_LEAVE_DEDUCTION_POLICY =
  'Annual leave is deducted only after approval. Pending annual leave is not reserved. Sick leave does not reduce quota.';
export const SICK_LEAVE_DEDUCTION_POLICY =
  'Sick leave is deducted only after approval. Pending sick leave is not reserved. Sick leave can only be applied as full day.';

export function assertLeaveRequestWithinBalance({
  leaveType,
  requestedDurationDays,
  leaveQuota,
  usedLeaveDays,
  errorMessage,
}) {
  const remainingLeaveDays = calculateRemainingLeaveDays({
    leaveQuota,
    usedLeaveDays,
  });

  try {
    validateLeaveBalance({
      leaveType,
      requestedDurationDays,
      remainingLeaveDays,
    });
  } catch (error) {
    if (error instanceof LeaveValidationError) {
      throw new ApiError(
        400,
        errorMessage || error.message,
        'INSUFFICIENT_LEAVE_BALANCE',
        {
          leaveQuota: Number(leaveQuota),
          usedLeaveDays: Number(usedLeaveDays),
          requestedDurationDays: Number(requestedDurationDays),
          remainingLeaveDays,
        },
      );
    }

    throw error;
  }

  return {
    remainingLeaveDays,
  };
}

export function assertSickLeaveFullDayOnly({ leaveType, dayPortion }) {
  try {
    validateSickLeaveFullDayOnly({ leaveType, dayPortion });
  } catch (error) {
    if (error instanceof LeaveValidationError) {
      throw new ApiError(400, error.message, error.code);
    }

    throw error;
  }
}
