import {
  REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH,
  REVIEW_PERIOD_NAME_MAX_LENGTH,
  REVIEW_PERIOD_STATUSES,
} from '@hrms/shared';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('review_periods', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(REVIEW_PERIOD_NAME_MAX_LENGTH),
        allowNull: false,
        unique: true,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(...Object.values(REVIEW_PERIOD_STATUSES)),
        allowNull: false,
        defaultValue: REVIEW_PERIOD_STATUSES.CLOSED,
      },
      description: {
        type: Sequelize.STRING(REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH),
        allowNull: true,
      },
      created_by_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
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

    await queryInterface.addIndex('review_periods', ['name'], {
      unique: true,
      name: 'review_periods_name_unique',
    });
    await queryInterface.addIndex('review_periods', ['status']);
    await queryInterface.addIndex('review_periods', ['start_date']);
    await queryInterface.addIndex('review_periods', ['end_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('review_periods');
  },
};
