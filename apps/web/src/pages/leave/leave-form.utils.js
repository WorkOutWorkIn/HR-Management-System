import {
  LEAVE_DAY_PORTIONS,
  LeaveValidationError,
  calculateBusinessLeaveDuration,
  isHalfDayPortion,
  LEAVE_TYPES,
  validateLeaveBalance,
  validateSickLeaveFullDayOnly,
} from '@hrms/shared';

export function getLeaveRequestFormState({
  leaveType,
  startDate,
  endDate,
  dayPortion,
  startDayPortion = dayPortion,
  endDayPortion = dayPortion,
  remainingAnnualLeaveDays,
  publicHolidays = [],
}) {
  if (!startDate || !endDate || endDate < startDate) {
    return {
      durationDays: null,
      durationError: null,
      balanceError: null,
      isSubmitBlocked: false,
    };
  }

  const publicHolidaySet = new Set(publicHolidays.map((holiday) => holiday.holidayDate));
  const isHalfDayRequest = isHalfDayPortion(startDayPortion) || isHalfDayPortion(endDayPortion);

  try {
    validateSickLeaveFullDayOnly({
      leaveType,
      dayPortion: startDayPortion,
    });
  } catch (error) {
    if (error instanceof LeaveValidationError) {
      return {
        durationDays: null,
        durationError: error.message,
        balanceError: null,
        isSubmitBlocked: true,
      };
    }

    throw error;
  }

  if (isHalfDayRequest && startDate !== endDate) {
    return {
      durationDays: null,
      durationError: 'Half-day leave is only allowed when start date and end date are the same.',
      balanceError: null,
      isSubmitBlocked: true,
    };
  }

  try {
    const durationDays = calculateBusinessLeaveDuration({
      startDate,
      endDate,
      startDayPortion,
      endDayPortion,
      publicHolidaySet,
    });

    try {
      if (remainingAnnualLeaveDays !== null && remainingAnnualLeaveDays !== undefined) {
        validateLeaveBalance({
          leaveType,
          requestedDurationDays: durationDays,
          remainingLeaveDays: remainingAnnualLeaveDays,
        });
      }
    } catch (error) {
      if (error instanceof LeaveValidationError) {
        return {
          durationDays,
          durationError: null,
          balanceError: error.message,
          isSubmitBlocked: true,
        };
      }

      throw error;
    }

    return {
      durationDays,
      durationError: null,
      balanceError: null,
      isSubmitBlocked: false,
    };
  } catch (error) {
    if (error instanceof LeaveValidationError) {
      return {
        durationDays: null,
        durationError: error.message,
        balanceError: null,
        isSubmitBlocked: true,
      };
    }

    throw error;
  }
}

export function getDayPortionOptions({ leaveType, startDate, endDate }) {
  if (leaveType === LEAVE_TYPES.SICK) {
    return [{ value: LEAVE_DAY_PORTIONS.FULL, label: 'Full day', disabled: false }];
  }

  const isSameDayLeave = Boolean(startDate) && Boolean(endDate) && startDate === endDate;

  return isSameDayLeave
    ? [
        { value: LEAVE_DAY_PORTIONS.FULL, label: 'Full day', disabled: false },
        { value: LEAVE_DAY_PORTIONS.AM, label: 'Half day (AM)', disabled: false },
        { value: LEAVE_DAY_PORTIONS.PM, label: 'Half day (PM)', disabled: false },
      ]
    : [{ value: LEAVE_DAY_PORTIONS.FULL, label: 'Full day', disabled: false }];
}

export function normalizeDayPortionForDateRange({
  leaveType,
  startDate,
  endDate,
  dayPortion,
}) {
  if (leaveType === LEAVE_TYPES.SICK) {
    return LEAVE_DAY_PORTIONS.FULL;
  }

  if (!startDate || !endDate || startDate === endDate || !isHalfDayPortion(dayPortion)) {
    return dayPortion;
  }

  return LEAVE_DAY_PORTIONS.FULL;
}
