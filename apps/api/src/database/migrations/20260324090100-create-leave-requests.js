import { LEAVE_REQUEST_STATUSES, LEAVE_TYPES } from '@hrms/shared';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_requests', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      leave_type: {
        type: Sequelize.ENUM(...Object.values(LEAVE_TYPES)),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(...Object.values(LEAVE_REQUEST_STATUSES)),
        allowNull: false,
        defaultValue: LEAVE_REQUEST_STATUSES.PENDING,
      },
      approver_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      decided_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      decision_comment: {
        type: Sequelize.STRING(500),
        allowNull: true,
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

    await queryInterface.addIndex('leave_requests', ['employee_id']);
    await queryInterface.addIndex('leave_requests', ['status']);
    await queryInterface.addIndex('leave_requests', ['approver_id']);
    await queryInterface.addIndex('leave_requests', ['start_date']);
    await queryInterface.addIndex('leave_requests', ['end_date']);
    await queryInterface.addIndex('leave_requests', ['employee_id', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_requests');
  },
};
