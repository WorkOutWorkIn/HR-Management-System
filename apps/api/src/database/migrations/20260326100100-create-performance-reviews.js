import { PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH } from '@hrms/shared';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('performance_reviews', {
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
        onDelete: 'RESTRICT',
      },
      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      review_period_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'review_periods',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      rating: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      comment: {
        type: Sequelize.STRING(PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH),
        allowNull: true,
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
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

    await queryInterface.addIndex('performance_reviews', ['employee_id', 'review_period_id'], {
      unique: true,
      name: 'performance_reviews_employee_period_unique',
    });
    await queryInterface.addIndex('performance_reviews', ['reviewer_id']);
    await queryInterface.addIndex('performance_reviews', ['review_period_id']);
    await queryInterface.addIndex('performance_reviews', ['employee_id']);
    await queryInterface.addIndex('performance_reviews', ['review_period_id', 'reviewer_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('performance_reviews');
  },
};
