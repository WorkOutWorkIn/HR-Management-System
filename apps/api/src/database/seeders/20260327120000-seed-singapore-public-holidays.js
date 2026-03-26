import { randomUUID } from 'node:crypto';
import { singaporePublicHolidays } from './data/singapore-public-holidays.js';

const now = new Date();

export async function up(queryInterface) {
  const existingRows = await queryInterface.sequelize.query(
    'SELECT holiday_date FROM public_holidays',
    { type: queryInterface.sequelize.QueryTypes.SELECT },
  );
  const existingDates = new Set(existingRows.map((row) => row.holiday_date));
  const recordsToInsert = singaporePublicHolidays
    .filter((holiday) => !existingDates.has(holiday.holidayDate))
    .map((holiday) => ({
      id: randomUUID(),
      name: holiday.name,
      holiday_date: holiday.holidayDate,
      created_by_user_id: null,
      created_at: now,
      updated_at: now,
    }));

  if (recordsToInsert.length) {
    await queryInterface.bulkInsert('public_holidays', recordsToInsert);
  }
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete(
    'public_holidays',
    {
      holiday_date: singaporePublicHolidays.map((holiday) => holiday.holidayDate),
      created_by_user_id: null,
    },
    {},
  );
}
