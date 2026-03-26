import { randomUUID } from 'node:crypto';

const DEFAULT_ADMIN_EMAIL = 'admin@hrms.local';
const DEFAULT_ADMIN_BASE_SALARY = '12000.00';
const DEFAULT_ADMIN_EFFECTIVE_DATE = '2026-03-25';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const [admins] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE work_email = ? LIMIT 1',
      {
        replacements: [DEFAULT_ADMIN_EMAIL],
      },
    );

    if (!admins.length) {
      return;
    }

    const adminId = admins[0].id;
    const now = new Date();
    const [existingRecords] = await queryInterface.sequelize.query(
      'SELECT id FROM salary_records WHERE user_id = ? AND effective_date = ? LIMIT 1',
      {
        replacements: [adminId, DEFAULT_ADMIN_EFFECTIVE_DATE],
      },
    );

    if (existingRecords.length) {
      await queryInterface.bulkUpdate(
        'salary_records',
        {
          base_salary: DEFAULT_ADMIN_BASE_SALARY,
          updated_at: now,
        },
        {
          id: existingRecords[0].id,
        },
      );

      return;
    }

    await queryInterface.bulkInsert('salary_records', [
      {
        id: randomUUID(),
        user_id: adminId,
        base_salary: DEFAULT_ADMIN_BASE_SALARY,
        effective_date: DEFAULT_ADMIN_EFFECTIVE_DATE,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const [admins] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE work_email = ? LIMIT 1',
      {
        replacements: [DEFAULT_ADMIN_EMAIL],
      },
    );

    if (!admins.length) {
      return;
    }

    await queryInterface.bulkDelete('salary_records', {
      user_id: admins[0].id,
      effective_date: DEFAULT_ADMIN_EFFECTIVE_DATE,
    });
  },
};
