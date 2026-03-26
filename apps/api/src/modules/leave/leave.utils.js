import {
  LEAVE_DAY_PORTIONS,
  LeaveValidationError,
  calculateBusinessLeaveDuration as calculateSharedBusinessLeaveDuration,
} from '@hrms/shared';
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
  try {
    return calculateSharedBusinessLeaveDuration({
      startDate,
      endDate,
      startDayPortion,
      endDayPortion,
      publicHolidaySet,
    });
  } catch (error) {
    if (error instanceof LeaveValidationError) {
      throw new ApiError(400, error.message, error.code);
    }

    throw error;
  }
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
