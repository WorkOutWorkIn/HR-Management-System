import { LEAVE_DAY_PORTIONS, LEAVE_TYPES } from '../constants/leave.js';

export class LeaveValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'LeaveValidationError';
    this.code = code;
  }
}

function toUtcDate(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

export function enumerateDateStrings(startDate, endDate) {
  const dates = [];
  const current = toUtcDate(startDate);
  const last = toUtcDate(endDate);

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function isWeekend(dateString) {
  const day = toUtcDate(dateString).getUTCDay();
  return day === 0 || day === 6;
}

export function isHalfDayPortion(dayPortion) {
  return dayPortion === LEAVE_DAY_PORTIONS.AM || dayPortion === LEAVE_DAY_PORTIONS.PM;
}

export function calculateBusinessLeaveDuration({
  startDate,
  endDate,
  startDayPortion = LEAVE_DAY_PORTIONS.FULL,
  endDayPortion = LEAVE_DAY_PORTIONS.FULL,
  publicHolidaySet = new Set(),
}) {
  const calendarDates = enumerateDateStrings(startDate, endDate);
  const businessDates = calendarDates.filter(
    (dateString) => !isWeekend(dateString) && !publicHolidaySet.has(dateString),
  );

  if (!businessDates.length) {
    throw new LeaveValidationError(
      'Selected leave period does not include any working days after weekend and holiday exclusion',
      'NO_WORKING_DAYS_IN_RANGE',
    );
  }

  if (startDate === endDate) {
    if (!businessDates.includes(startDate)) {
      throw new LeaveValidationError(
        'Selected leave date falls on a weekend or public holiday',
        'NON_WORKING_SINGLE_DAY_LEAVE',
      );
    }

    if (
      startDayPortion === LEAVE_DAY_PORTIONS.FULL &&
      endDayPortion === LEAVE_DAY_PORTIONS.FULL
    ) {
      return 1;
    }

    if (
      startDayPortion === LEAVE_DAY_PORTIONS.AM &&
      endDayPortion === LEAVE_DAY_PORTIONS.AM
    ) {
      return 0.5;
    }

    if (
      startDayPortion === LEAVE_DAY_PORTIONS.PM &&
      endDayPortion === LEAVE_DAY_PORTIONS.PM
    ) {
      return 0.5;
    }

    throw new LeaveValidationError(
      'Single-day half leave must use the same half-day portion for both start and end',
      'INVALID_SINGLE_DAY_HALF_LEAVE',
    );
  }

  if (isHalfDayPortion(startDayPortion) || isHalfDayPortion(endDayPortion)) {
    throw new LeaveValidationError(
      'Half-day leave is only allowed when start date and end date are the same.',
      'INVALID_MULTI_DAY_HALF_LEAVE',
    );
  }

  if (startDayPortion === LEAVE_DAY_PORTIONS.AM) {
    throw new LeaveValidationError(
      'Multi-day leave can only start as FULL day or PM half-day',
      'INVALID_MULTI_DAY_START_PORTION',
    );
  }

  if (endDayPortion === LEAVE_DAY_PORTIONS.PM) {
    throw new LeaveValidationError(
      'Multi-day leave can only end as FULL day or AM half-day',
      'INVALID_MULTI_DAY_END_PORTION',
    );
  }

  let duration = businessDates.length;

  if (startDayPortion === LEAVE_DAY_PORTIONS.PM) {
    if (!businessDates.includes(startDate)) {
      throw new LeaveValidationError(
        'Start date cannot use a half-day selection on a non-working day',
        'INVALID_START_HALF_DAY',
      );
    }

    duration -= 0.5;
  }

  if (endDayPortion === LEAVE_DAY_PORTIONS.AM) {
    if (!businessDates.includes(endDate)) {
      throw new LeaveValidationError(
        'End date cannot use a half-day selection on a non-working day',
        'INVALID_END_HALF_DAY',
      );
    }

    duration -= 0.5;
  }

  if (duration <= 0) {
    throw new LeaveValidationError(
      'Calculated leave duration must be greater than zero',
      'INVALID_DURATION',
    );
  }

  return Number(duration.toFixed(1));
}

export function calculateRemainingAnnualLeaveDays({ annualLeaveQuota, usedAnnualLeaveDays }) {
  return calculateRemainingLeaveDays({
    leaveQuota: annualLeaveQuota,
    usedLeaveDays: usedAnnualLeaveDays,
  });
}

export function calculateRemainingLeaveDays({ leaveQuota, usedLeaveDays }) {
  return Number((Number(leaveQuota) - Number(usedLeaveDays)).toFixed(1));
}

export function buildLeaveExceededMessage({
  leaveType,
  requestedDurationDays,
  remainingLeaveDays,
}) {
  const leaveTypeLabel =
    leaveType === LEAVE_TYPES.ANNUAL
      ? 'annual leave'
      : leaveType === LEAVE_TYPES.SICK
        ? 'sick leave'
        : String(leaveType || 'leave').toLowerCase().replace(/_/g, ' ');
  return `Requested ${leaveTypeLabel} (${requestedDurationDays} days) exceeds remaining balance (${remainingLeaveDays} days).`;
}

export function buildAnnualLeaveExceededMessage({
  requestedDurationDays,
  remainingAnnualLeaveDays,
}) {
  return buildLeaveExceededMessage({
    leaveType: LEAVE_TYPES.ANNUAL,
    requestedDurationDays,
    remainingLeaveDays: remainingAnnualLeaveDays,
  });
}

export function validateLeaveBalance({
  leaveType,
  requestedDurationDays,
  remainingLeaveDays,
}) {
  if (Number(requestedDurationDays) > Number(remainingLeaveDays)) {
    throw new LeaveValidationError(
      buildLeaveExceededMessage({
        leaveType,
        requestedDurationDays: Number(requestedDurationDays),
        remainingLeaveDays: Number(remainingLeaveDays),
      }),
      'LEAVE_BALANCE_EXCEEDED',
    );
  }
}

export function validateAnnualLeaveBalance({
  leaveType,
  requestedDurationDays,
  remainingAnnualLeaveDays,
}) {
  if (leaveType !== LEAVE_TYPES.ANNUAL) {
    return;
  }

  validateLeaveBalance({
    leaveType,
    requestedDurationDays,
    remainingLeaveDays: remainingAnnualLeaveDays,
  });
}

export function validateSickLeaveFullDayOnly({ leaveType, dayPortion }) {
  if (leaveType !== LEAVE_TYPES.SICK || dayPortion === LEAVE_DAY_PORTIONS.FULL) {
    return;
  }

  throw new LeaveValidationError(
    'Sick leave can only be applied as full day.',
    'INVALID_SICK_LEAVE_DAY_PORTION',
  );
}
