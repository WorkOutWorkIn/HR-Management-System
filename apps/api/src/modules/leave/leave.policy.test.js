import test from 'node:test';
import assert from 'node:assert/strict';
import { LEAVE_DAY_PORTIONS, LEAVE_TYPES, enumerateDateStrings } from '@hrms/shared';
import { ApiError } from '../../utils/ApiError.js';
import { assertLeaveRequestWithinBalance, assertSickLeaveFullDayOnly } from './leave.policy.js';
import { calculateBusinessLeaveDuration } from './leave.utils.js';
import { singaporePublicHolidays } from '../../database/seeders/data/singapore-public-holidays.js';

test('single-day full leave is calculated inclusively', () => {
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-04-20',
    endDate: '2026-04-20',
    startDayPortion: LEAVE_DAY_PORTIONS.FULL,
    endDayPortion: LEAVE_DAY_PORTIONS.FULL,
    publicHolidaySet: new Set(),
  });

  assert.equal(durationDays, 1);
});

test('half-day AM request on the same date succeeds and duration is 0.5', () => {
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-06-10',
    endDate: '2026-06-10',
    startDayPortion: LEAVE_DAY_PORTIONS.AM,
    endDayPortion: LEAVE_DAY_PORTIONS.AM,
    publicHolidaySet: new Set(),
  });

  assert.equal(durationDays, 0.5);
});

test('half-day PM request on the same date succeeds and duration is 0.5', () => {
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-06-10',
    endDate: '2026-06-10',
    startDayPortion: LEAVE_DAY_PORTIONS.PM,
    endDayPortion: LEAVE_DAY_PORTIONS.PM,
    publicHolidaySet: new Set(),
  });

  assert.equal(durationDays, 0.5);
});

test('half-day request across different dates is rejected', () => {
  assert.throws(
    () =>
      calculateBusinessLeaveDuration({
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        startDayPortion: LEAVE_DAY_PORTIONS.AM,
        endDayPortion: LEAVE_DAY_PORTIONS.AM,
        publicHolidaySet: new Set(),
      }),
    /Half-day leave is only allowed when start date and end date are the same\./,
  );
});

test('full-day leave from 2026-04-20 to 2026-04-24 is 5 working days', () => {
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-04-20',
    endDate: '2026-04-24',
    startDayPortion: LEAVE_DAY_PORTIONS.FULL,
    endDayPortion: LEAVE_DAY_PORTIONS.FULL,
    publicHolidaySet: new Set(),
  });

  assert.equal(durationDays, 5);
});

test('full-day leave from 2026-04-20 to 2026-04-25 remains 5 working days because Saturday is excluded', () => {
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-04-20',
    endDate: '2026-04-25',
    startDayPortion: LEAVE_DAY_PORTIONS.FULL,
    endDayPortion: LEAVE_DAY_PORTIONS.FULL,
    publicHolidaySet: new Set(),
  });

  assert.equal(durationDays, 5);
});

test('full-day leave from 2026-04-20 to 2026-04-27 is 6 working days', () => {
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-04-20',
    endDate: '2026-04-27',
    startDayPortion: LEAVE_DAY_PORTIONS.FULL,
    endDayPortion: LEAVE_DAY_PORTIONS.FULL,
    publicHolidaySet: new Set(),
  });

  assert.equal(durationDays, 6);
});

test('2026-05-01 Labour Day is seeded as a Singapore public holiday', () => {
  const labourDay = singaporePublicHolidays.find((holiday) => holiday.holidayDate === '2026-05-01');

  assert.deepEqual(labourDay, {
    holidayDate: '2026-05-01',
    name: 'Labour Day',
  });
});

test('annual leave excludes Singapore public holidays', () => {
  const publicHolidaySet = new Set(['2026-05-01']);
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-05-01',
    endDate: '2026-05-05',
    startDayPortion: LEAVE_DAY_PORTIONS.FULL,
    endDayPortion: LEAVE_DAY_PORTIONS.FULL,
    publicHolidaySet,
  });

  assert.equal(durationDays, 2);
});

test('annual leave excludes both weekends and public holidays in the same range', () => {
  const publicHolidaySet = new Set(['2026-05-01']);
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-05-01',
    endDate: '2026-05-05',
    startDayPortion: LEAVE_DAY_PORTIONS.FULL,
    endDayPortion: LEAVE_DAY_PORTIONS.FULL,
    publicHolidaySet,
  });

  assert.equal(durationDays, 2);
});

test('date-only inputs do not shift from timezone conversion', () => {
  assert.deepEqual(enumerateDateStrings('2026-04-20', '2026-04-25'), [
    '2026-04-20',
    '2026-04-21',
    '2026-04-22',
    '2026-04-23',
    '2026-04-24',
    '2026-04-25',
  ]);
});

test('annual leave request within remaining balance succeeds', () => {
  assert.doesNotThrow(() =>
    assertLeaveRequestWithinBalance({
      leaveType: LEAVE_TYPES.ANNUAL,
      requestedDurationDays: 4,
      leaveQuota: 14,
      usedLeaveDays: 8,
    }),
  );
});

test('annual leave request equal to remaining balance succeeds', () => {
  assert.doesNotThrow(() =>
    assertLeaveRequestWithinBalance({
      leaveType: LEAVE_TYPES.ANNUAL,
      requestedDurationDays: 6,
      leaveQuota: 14,
      usedLeaveDays: 8,
    }),
  );
});

test('annual leave balance validation supports 0.5 day deduction correctly', () => {
  assert.doesNotThrow(() =>
    assertLeaveRequestWithinBalance({
      leaveType: LEAVE_TYPES.ANNUAL,
      requestedDurationDays: 0.5,
      leaveQuota: 14,
      usedLeaveDays: 13.5,
    }),
  );
});

test('annual leave request succeeds when remaining balance is 3 and corrected duration is 2', () => {
  assert.doesNotThrow(() =>
    assertLeaveRequestWithinBalance({
      leaveType: LEAVE_TYPES.ANNUAL,
      requestedDurationDays: 2,
      leaveQuota: 14,
      usedLeaveDays: 11,
    }),
  );
});

test('annual leave request exceeding remaining balance fails', () => {
  assert.throws(
    () =>
      assertLeaveRequestWithinBalance({
        leaveType: LEAVE_TYPES.ANNUAL,
        requestedDurationDays: 7,
        leaveQuota: 14,
        usedLeaveDays: 8,
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.statusCode, 400);
      assert.equal(error.code, 'INSUFFICIENT_LEAVE_BALANCE');
      assert.equal(
        error.message,
        'Requested annual leave (7 days) exceeds remaining balance (6 days).',
      );
      return true;
    },
  );
});

test('annual leave request fails when remaining balance is 1 and corrected duration is 2', () => {
  assert.throws(
    () =>
      assertLeaveRequestWithinBalance({
        leaveType: LEAVE_TYPES.ANNUAL,
        requestedDurationDays: 2,
        leaveQuota: 14,
        usedLeaveDays: 13,
      }),
    (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(
        error.message,
        'Requested annual leave (2 days) exceeds remaining balance (1 days).',
      );
      return true;
    },
  );
});

test('sick leave request uses sick leave balance only', () => {
  assert.doesNotThrow(() =>
    assertLeaveRequestWithinBalance({
      leaveType: LEAVE_TYPES.SICK,
      requestedDurationDays: 2,
      leaveQuota: 14,
      usedLeaveDays: 12,
    }),
  );
});

test('zero remaining annual leave rejects any positive annual leave request', () => {
  assert.throws(
    () =>
      assertLeaveRequestWithinBalance({
        leaveType: LEAVE_TYPES.ANNUAL,
        requestedDurationDays: 0.5,
        leaveQuota: 14,
        usedLeaveDays: 14,
      }),
    /Requested annual leave \(0.5 days\) exceeds remaining balance \(0 days\)\./,
  );
});

test('approved annual leave does not reduce sick leave balance', () => {
  assert.doesNotThrow(() =>
    assertLeaveRequestWithinBalance({
      leaveType: LEAVE_TYPES.SICK,
      requestedDurationDays: 1,
      leaveQuota: 14,
      usedLeaveDays: 0,
    }),
  );
});

test('approved sick leave does not reduce annual leave balance', () => {
  assert.doesNotThrow(() =>
    assertLeaveRequestWithinBalance({
      leaveType: LEAVE_TYPES.ANNUAL,
      requestedDurationDays: 1,
      leaveQuota: 16,
      usedLeaveDays: 1,
    }),
  );
});

test('sick leave with full day is valid', () => {
  assert.doesNotThrow(() =>
    assertSickLeaveFullDayOnly({
      leaveType: LEAVE_TYPES.SICK,
      dayPortion: LEAVE_DAY_PORTIONS.FULL,
    }),
  );
});

test('sick leave with half day AM is rejected', () => {
  assert.throws(
    () =>
      assertSickLeaveFullDayOnly({
        leaveType: LEAVE_TYPES.SICK,
        dayPortion: LEAVE_DAY_PORTIONS.AM,
      }),
    /Sick leave can only be applied as full day\./,
  );
});

test('sick leave with half day PM is rejected', () => {
  assert.throws(
    () =>
      assertSickLeaveFullDayOnly({
        leaveType: LEAVE_TYPES.SICK,
        dayPortion: LEAVE_DAY_PORTIONS.PM,
      }),
    /Sick leave can only be applied as full day\./,
  );
});

test('half-day duration calculation is supported for single-day leave', () => {
  const durationDays = calculateBusinessLeaveDuration({
    startDate: '2026-04-01',
    endDate: '2026-04-01',
    startDayPortion: LEAVE_DAY_PORTIONS.AM,
    endDayPortion: LEAVE_DAY_PORTIONS.AM,
    publicHolidaySet: new Set(),
  });

  assert.equal(durationDays, 0.5);
});
