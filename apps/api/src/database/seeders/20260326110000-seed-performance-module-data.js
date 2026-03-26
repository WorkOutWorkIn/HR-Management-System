import { randomUUID } from 'node:crypto';
import { QueryTypes } from 'sequelize';
import { REVIEW_PERIOD_STATUSES } from '@hrms/shared';

const REVIEW_PERIOD_NAMES = ['Q4 2025', 'Q1 2026'];

async function getSeedUsers(queryInterface) {
  const users = await queryInterface.sequelize.query(
    `
      SELECT id, work_email AS workEmail
      FROM users
      WHERE work_email IN (:emails)
    `,
    {
      replacements: {
        emails: ['admin@hrms.local', 'manager@hrms.local', 'employee@hrms.local'],
      },
      type: QueryTypes.SELECT,
    },
  );

  const usersByEmail = new Map(users.map((user) => [user.workEmail, user.id]));

  return {
    adminId: usersByEmail.get('admin@hrms.local'),
    managerId: usersByEmail.get('manager@hrms.local'),
    employeeId: usersByEmail.get('employee@hrms.local'),
  };
}

async function getSeedPeriodIds(queryInterface) {
  const reviewPeriods = await queryInterface.sequelize.query(
    `
      SELECT id
      FROM review_periods
      WHERE name IN (:names)
    `,
    {
      replacements: {
        names: REVIEW_PERIOD_NAMES,
      },
      type: QueryTypes.SELECT,
    },
  );

  return reviewPeriods.map((reviewPeriod) => reviewPeriod.id);
}

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const now = new Date();
    const { adminId, managerId, employeeId } = await getSeedUsers(queryInterface);

    if (!adminId || !managerId || !employeeId) {
      throw new Error(
        'Performance review seeds require the default admin, manager, and employee users to exist.',
      );
    }

    await queryInterface.bulkUpdate(
      'users',
      {
        manager_user_id: managerId,
        updated_at: now,
      },
      {
        id: employeeId,
      },
    );

    const existingReviewPeriodIds = await getSeedPeriodIds(queryInterface);

    if (existingReviewPeriodIds.length) {
      await queryInterface.bulkDelete('performance_reviews', {
        review_period_id: existingReviewPeriodIds,
      });
    }

    await queryInterface.bulkDelete('review_periods', {
      name: REVIEW_PERIOD_NAMES,
    });

    const historicalReviewPeriodId = randomUUID();
    const activeReviewPeriodId = randomUUID();
    const historicalReviewId = randomUUID();

    await queryInterface.bulkInsert('review_periods', [
      {
        id: historicalReviewPeriodId,
        name: 'Q4 2025',
        start_date: '2025-10-01',
        end_date: '2025-12-31',
        status: REVIEW_PERIOD_STATUSES.CLOSED,
        description: 'Closed historical review cycle for regression and history checks.',
        created_by_user_id: adminId,
        created_at: now,
        updated_at: now,
      },
      {
        id: activeReviewPeriodId,
        name: 'Q1 2026',
        start_date: '2026-01-01',
        end_date: '2026-03-31',
        status: REVIEW_PERIOD_STATUSES.OPEN,
        description: 'Current review cycle for manager submissions and employee visibility.',
        created_by_user_id: adminId,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('performance_reviews', [
      {
        id: historicalReviewId,
        employee_id: employeeId,
        reviewer_id: managerId,
        review_period_id: historicalReviewPeriodId,
        rating: 4,
        comment:
          'Delivered reliable operational support throughout the quarter and adapted well to new workflows.',
        submitted_at: new Date('2025-12-20T10:00:00.000Z'),
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const reviewPeriodIds = await getSeedPeriodIds(queryInterface);

    if (reviewPeriodIds.length) {
      await queryInterface.bulkDelete('performance_reviews', {
        review_period_id: reviewPeriodIds,
      });
    }

    await queryInterface.bulkDelete('review_periods', {
      name: REVIEW_PERIOD_NAMES,
    });
  },
};
