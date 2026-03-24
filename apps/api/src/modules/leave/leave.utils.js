import { LEAVE_DAY_PORTIONS } from '@hrms/shared';
import { ApiError } from '../../utils/ApiError.js';

function toUtcDate(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
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
    throw new ApiError(
      400,
      'Selected leave period does not include any working days after weekend and holiday exclusion',
      'NO_WORKING_DAYS_IN_RANGE',
    );
  }

  if (startDate === endDate) {
    if (!businessDates.includes(startDate)) {
      throw new ApiError(
        400,
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

    throw new ApiError(
      400,
      'Single-day half leave must use the same half-day portion for both start and end',
      'INVALID_SINGLE_DAY_HALF_LEAVE',
    );
  }

  if (startDayPortion === LEAVE_DAY_PORTIONS.AM) {
    throw new ApiError(
      400,
      'Multi-day leave can only start as FULL day or PM half-day',
      'INVALID_MULTI_DAY_START_PORTION',
    );
  }

  if (endDayPortion === LEAVE_DAY_PORTIONS.PM) {
    throw new ApiError(
      400,
      'Multi-day leave can only end as FULL day or AM half-day',
      'INVALID_MULTI_DAY_END_PORTION',
    );
  }

  let duration = businessDates.length;

  if (startDayPortion === LEAVE_DAY_PORTIONS.PM) {
    if (!businessDates.includes(startDate)) {
      throw new ApiError(
        400,
        'Start date cannot use a half-day selection on a non-working day',
        'INVALID_START_HALF_DAY',
      );
    }

    duration -= 0.5;
  }

  if (endDayPortion === LEAVE_DAY_PORTIONS.AM) {
    if (!businessDates.includes(endDate)) {
      throw new ApiError(
        400,
        'End date cannot use a half-day selection on a non-working day',
        'INVALID_END_HALF_DAY',
      );
    }

    duration -= 0.5;
  }

  if (duration <= 0) {
    throw new ApiError(400, 'Calculated leave duration must be greater than zero', 'INVALID_DURATION');
  }

  return Number(duration.toFixed(1));
}

export function serializeLeaveRequest(leaveRequest) {
  return {
    id: leaveRequest.id,
    employeeId: leaveRequest.employeeId,
    leaveType: leaveRequest.leaveType,
    startDate: leaveRequest.startDate,
    endDate: leaveRequest.endDate,
    startDayPortion: leaveRequest.startDayPortion,
    endDayPortion: leaveRequest.endDayPortion,
    durationDays: Number(leaveRequest.durationDays),
    reason: leaveRequest.reason,
    status: leaveRequest.status,
    approverId: leaveRequest.approverId,
    decidedAt: leaveRequest.decidedAt,
    decisionComment: leaveRequest.decisionComment,
    createdAt: leaveRequest.createdAt,
    updatedAt: leaveRequest.updatedAt,
    employee: leaveRequest.employee
      ? {
          id: leaveRequest.employee.id,
          fullName: leaveRequest.employee.fullName,
          workEmail: leaveRequest.employee.workEmail,
          role: leaveRequest.employee.role,
          managerUserId: leaveRequest.employee.managerUserId,
        }
      : null,
    approver: leaveRequest.approver
      ? {
          id: leaveRequest.approver.id,
          fullName: leaveRequest.approver.fullName,
          workEmail: leaveRequest.approver.workEmail,
          role: leaveRequest.approver.role,
        }
      : null,
  };
}

export function serializePublicHoliday(holiday) {
  return {
    id: holiday.id,
    name: holiday.name,
    holidayDate: holiday.holidayDate,
    createdByUserId: holiday.createdByUserId,
    createdAt: holiday.createdAt,
    updatedAt: holiday.updatedAt,
  };
}
