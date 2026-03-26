import test from 'node:test';
import assert from 'node:assert/strict';
import { LEAVE_DAY_PORTIONS, LEAVE_TYPES } from '@hrms/shared';
import {
  getDayPortionOptions,
  getLeaveRequestFormState,
  normalizeDayPortionForDateRange,
} from './leave-form.utils.js';

test('form shows a validation error when annual leave exceeds remaining balance', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-04-06',
    endDate: '2026-04-10',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 3,
    publicHolidays: [],
  });

  assert.equal(
    result.balanceError,
    'Requested annual leave (5 days) exceeds remaining balance (3 days).',
  );
  assert.equal(result.isSubmitBlocked, true);
});

test('duration recalculates immediately when end date changes to the next working day', () => {
  const beforeChange = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-04-20',
    endDate: '2026-04-24',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 10,
    publicHolidays: [],
  });
  const afterChange = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-04-20',
    endDate: '2026-04-27',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 10,
    publicHolidays: [],
  });

  assert.equal(beforeChange.durationDays, 5);
  assert.equal(afterChange.durationDays, 6);
  assert.equal(afterChange.isSubmitBlocked, false);
});

test('selecting half-day AM requires end date to match start date', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-06-10',
    endDate: '2026-06-11',
    dayPortion: LEAVE_DAY_PORTIONS.AM,
    remainingAnnualLeaveDays: 10,
    publicHolidays: [],
  });

  assert.equal(result.durationError, 'Half-day leave is only allowed when start date and end date are the same.');
  assert.equal(result.isSubmitBlocked, true);
});

test('selecting half-day PM requires end date to match start date', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    dayPortion: LEAVE_DAY_PORTIONS.PM,
    remainingAnnualLeaveDays: 10,
    publicHolidays: [],
  });

  assert.equal(result.durationError, 'Half-day leave is only allowed when start date and end date are the same.');
  assert.equal(result.isSubmitBlocked, true);
});

test('weekend end date does not inflate duration', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-04-20',
    endDate: '2026-04-25',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 10,
    publicHolidays: [],
  });

  assert.equal(result.durationDays, 5);
  assert.equal(result.isSubmitBlocked, false);
});

test('duration display excludes Singapore public holidays', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-05-01',
    endDate: '2026-05-05',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 3,
    publicHolidays: [{ holidayDate: '2026-05-01', name: 'Labour Day' }],
  });

  assert.equal(result.durationDays, 2);
  assert.equal(result.balanceError, null);
  assert.equal(result.isSubmitBlocked, false);
});

test('valid half-day request shows duration 0.5', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-06-10',
    endDate: '2026-06-10',
    dayPortion: LEAVE_DAY_PORTIONS.AM,
    remainingAnnualLeaveDays: 10,
    publicHolidays: [],
  });

  assert.equal(result.durationDays, 0.5);
  assert.equal(result.durationError, null);
  assert.equal(result.isSubmitBlocked, false);
});

test('submit stays blocked for invalid annual leave requests', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-04-06',
    endDate: '2026-04-06',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 0,
    publicHolidays: [],
  });

  assert.equal(
    result.balanceError,
    'Requested annual leave (1 days) exceeds remaining balance (0 days).',
  );
  assert.equal(result.isSubmitBlocked, true);
});

test('valid leave request remains submittable', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-04-06',
    endDate: '2026-04-08',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 5,
    publicHolidays: [],
  });

  assert.equal(result.durationDays, 3);
  assert.equal(result.balanceError, null);
  assert.equal(result.durationError, null);
  assert.equal(result.isSubmitBlocked, false);
});

test('sick leave request is not blocked by annual leave balance', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.SICK,
    startDate: '2026-04-06',
    endDate: '2026-04-10',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 14,
    publicHolidays: [],
  });

  assert.equal(result.durationDays, 5);
  assert.equal(result.balanceError, null);
  assert.equal(result.isSubmitBlocked, false);
});

test('sick leave rejects half day AM in the frontend state', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.SICK,
    startDate: '2026-06-10',
    endDate: '2026-06-10',
    dayPortion: LEAVE_DAY_PORTIONS.AM,
    remainingAnnualLeaveDays: 14,
    publicHolidays: [],
  });

  assert.equal(result.durationError, 'Sick leave can only be applied as full day.');
  assert.equal(result.isSubmitBlocked, true);
});

test('validation message updates based on corrected duration', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-04-20',
    endDate: '2026-04-27',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 3,
    publicHolidays: [],
  });

  assert.equal(
    result.balanceError,
    'Requested annual leave (6 days) exceeds remaining balance (3 days).',
  );
  assert.equal(result.isSubmitBlocked, true);
});

test('frontend validation message uses corrected public-holiday-adjusted duration', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-05-01',
    endDate: '2026-05-05',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 1,
    publicHolidays: [{ holidayDate: '2026-05-01', name: 'Labour Day' }],
  });

  assert.equal(
    result.balanceError,
    'Requested annual leave (2 days) exceeds remaining balance (1 days).',
  );
  assert.equal(result.isSubmitBlocked, true);
});

test('same-day annual leave allows full day, half day AM, and half day PM', () => {
  assert.deepEqual(
    getDayPortionOptions({
      leaveType: LEAVE_TYPES.ANNUAL,
      startDate: '2026-06-10',
      endDate: '2026-06-10',
    }),
    [
      { value: LEAVE_DAY_PORTIONS.FULL, label: 'Full day', disabled: false },
      { value: LEAVE_DAY_PORTIONS.AM, label: 'Half day (AM)', disabled: false },
      { value: LEAVE_DAY_PORTIONS.PM, label: 'Half day (PM)', disabled: false },
    ],
  );
});

test('multi-day annual leave allows only full day', () => {
  assert.deepEqual(
    getDayPortionOptions({
      leaveType: LEAVE_TYPES.ANNUAL,
      startDate: '2026-06-10',
      endDate: '2026-06-11',
    }),
    [{ value: LEAVE_DAY_PORTIONS.FULL, label: 'Full day', disabled: false }],
  );
});

test('sick leave day portion dropdown only allows full day', () => {
  assert.deepEqual(
    getDayPortionOptions({
      leaveType: LEAVE_TYPES.SICK,
      startDate: '2026-06-10',
      endDate: '2026-06-10',
    }),
    [{ value: LEAVE_DAY_PORTIONS.FULL, label: 'Full day', disabled: false }],
  );
});

test('changing from same-day to multi-day resets invalid half-day selection to full day', () => {
  assert.equal(
    normalizeDayPortionForDateRange({
      leaveType: LEAVE_TYPES.ANNUAL,
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      dayPortion: LEAVE_DAY_PORTIONS.PM,
    }),
    LEAVE_DAY_PORTIONS.FULL,
  );
});

test('end date remains editable because normalization does not overwrite the date', () => {
  assert.equal(
    normalizeDayPortionForDateRange({
      leaveType: LEAVE_TYPES.ANNUAL,
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      dayPortion: LEAVE_DAY_PORTIONS.AM,
    }),
    LEAVE_DAY_PORTIONS.FULL,
  );
});

test('switching from annual half-day to sick leave resets day portion to full day', () => {
  assert.equal(
    normalizeDayPortionForDateRange({
      leaveType: LEAVE_TYPES.SICK,
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      dayPortion: LEAVE_DAY_PORTIONS.AM,
    }),
    LEAVE_DAY_PORTIONS.FULL,
  );
});

test('same-day full-day request shows duration 1 day', () => {
  const result = getLeaveRequestFormState({
    leaveType: LEAVE_TYPES.ANNUAL,
    startDate: '2026-06-10',
    endDate: '2026-06-10',
    dayPortion: LEAVE_DAY_PORTIONS.FULL,
    remainingAnnualLeaveDays: 10,
    publicHolidays: [],
  });

  assert.equal(result.durationDays, 1);
  assert.equal(result.isSubmitBlocked, false);
});
