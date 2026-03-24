import { LEAVE_DAY_PORTIONS } from '@hrms/shared';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'annual_leave_quota', {
      type: Sequelize.DECIMAL(5, 1),
      allowNull: false,
      defaultValue: 14,
      after: 'manager_user_id',
    });

    await queryInterface.addColumn('leave_requests', 'start_day_portion', {
      type: Sequelize.ENUM(...Object.values(LEAVE_DAY_PORTIONS)),
      allowNull: false,
      defaultValue: LEAVE_DAY_PORTIONS.FULL,
      after: 'end_date',
    });

    await queryInterface.addColumn('leave_requests', 'end_day_portion', {
      type: Sequelize.ENUM(...Object.values(LEAVE_DAY_PORTIONS)),
      allowNull: false,
      defaultValue: LEAVE_DAY_PORTIONS.FULL,
      after: 'start_day_portion',
    });

    await queryInterface.addColumn('leave_requests', 'duration_days', {
      type: Sequelize.DECIMAL(5, 1),
      allowNull: false,
      defaultValue: 1,
      after: 'decision_comment',
    });

    await queryInterface.createTable('public_holidays', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      holiday_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        unique: true,
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('public_holidays', ['holiday_date']);
    await queryInterface.addIndex('public_holidays', ['created_by_user_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('public_holidays', ['created_by_user_id']);
    await queryInterface.removeIndex('public_holidays', ['holiday_date']);
    await queryInterface.dropTable('public_holidays');

    await queryInterface.removeColumn('leave_requests', 'duration_days');
    await queryInterface.removeColumn('leave_requests', 'end_day_portion');
    await queryInterface.removeColumn('leave_requests', 'start_day_portion');
    await queryInterface.removeColumn('users', 'annual_leave_quota');
  },
};
