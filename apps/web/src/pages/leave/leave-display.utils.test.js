import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLeaveDisplayDate,
  formatLeaveDisplayDateRange,
  formatLeaveDurationLabel,
} from './leave-display.utils.js';

test('2026-05-05 displays as 05-MAY-2026', () => {
  assert.equal(formatLeaveDisplayDate('2026-05-05'), '05-MAY-2026');
});

test('2026-05-08 displays as 08-MAY-2026', () => {
  assert.equal(formatLeaveDisplayDate('2026-05-08'), '08-MAY-2026');
});

test('date range renders as 05-MAY-2026 to 08-MAY-2026', () => {
  assert.equal(
    formatLeaveDisplayDateRange({
      startDate: '2026-05-05',
      endDate: '2026-05-08',
    }),
    '05-MAY-2026 to 08-MAY-2026',
  );
});

test('date-only strings do not shift rendered day', () => {
  assert.equal(formatLeaveDisplayDate('2026-01-01'), '01-JAN-2026');
});

test('half-day leave history shows AM in duration label', () => {
  assert.equal(
    formatLeaveDurationLabel({
      durationDays: '0.5',
      startDayPortion: 'AM',
      endDayPortion: 'AM',
    }),
    '0.5 day(s) (AM)',
  );
});

test('half-day leave history shows PM in duration label', () => {
  assert.equal(
    formatLeaveDurationLabel({
      durationDays: '0.5',
      startDayPortion: 'PM',
      endDayPortion: 'PM',
    }),
    '0.5 day(s) (PM)',
  );
});
