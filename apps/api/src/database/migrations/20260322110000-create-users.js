import { ROLES } from '@hrms/shared';
import { ACCOUNT_STATUSES } from '../../constants/account-statuses.js';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      full_name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      work_email: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.ENUM(...Object.values(ROLES)),
        allowNull: false,
        defaultValue: ROLES.EMPLOYEE,
      },
      status: {
        type: Sequelize.ENUM(...Object.values(ACCOUNT_STATUSES)),
        allowNull: false,
        defaultValue: ACCOUNT_STATUSES.PENDING_FIRST_LOGIN,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      must_change_password: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      locked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      password_changed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      job_title: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone_number: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      address_line_1: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      address_line_2: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      emergency_contact_name: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(30),
        allowNull: true,
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

    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['created_by_user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
