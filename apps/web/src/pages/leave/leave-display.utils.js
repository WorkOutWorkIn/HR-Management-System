const MONTH_ABBREVIATIONS = Object.freeze([
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]);

export function formatLeaveDisplayDate(dateString) {
  if (!dateString) {
    return '';
  }

  const [year, month, day] = dateString.split('-');
  const monthIndex = Number(month) - 1;

  if (!year || !month || !day || monthIndex < 0 || monthIndex >= MONTH_ABBREVIATIONS.length) {
    return dateString;
  }

  return `${day}-${MONTH_ABBREVIATIONS[monthIndex]}-${year}`;
}

export function formatLeaveDisplayDateRange({ startDate, endDate }) {
  const formattedStartDate = formatLeaveDisplayDate(startDate);
  const formattedEndDate = formatLeaveDisplayDate(endDate);

  if (!formattedStartDate || !formattedEndDate || startDate === endDate) {
    return formattedStartDate || formattedEndDate;
  }

  return `${formattedStartDate} to ${formattedEndDate}`;
}

export function formatLeaveDurationLabel({
  durationDays,
  startDayPortion,
  endDayPortion,
}) {
  const formattedDuration = `${durationDays} day(s)`;

  if (Number(durationDays) !== 0.5) {
    return formattedDuration;
  }

  const halfDayPortion = startDayPortion === endDayPortion ? startDayPortion : null;

  if (!halfDayPortion) {
    return formattedDuration;
  }

  return `${formattedDuration} (${halfDayPortion})`;
}
