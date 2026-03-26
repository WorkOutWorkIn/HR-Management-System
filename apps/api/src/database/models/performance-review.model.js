import { DataTypes, Model } from 'sequelize';
import {
  PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH,
  PERFORMANCE_REVIEW_RATING_MAX,
  PERFORMANCE_REVIEW_RATING_MIN,
} from '@hrms/shared';
import { buildBaseModelOptions } from './base.model.js';

class PerformanceReview extends Model {
  static initialize(sequelize) {
    PerformanceReview.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        employeeId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'employee_id',
        },
        reviewerId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'reviewer_id',
        },
        reviewPeriodId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'review_period_id',
        },
        rating: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          validate: {
            isInt: true,
            min: PERFORMANCE_REVIEW_RATING_MIN,
            max: PERFORMANCE_REVIEW_RATING_MAX,
          },
        },
        comment: {
          type: DataTypes.STRING(PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH),
          allowNull: true,
        },
        submittedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'submitted_at',
        },
      },
      buildBaseModelOptions('performance_reviews', {
        sequelize,
        modelName: 'PerformanceReview',
      }),
    );

    return PerformanceReview;
  }

  static associate(models) {
    PerformanceReview.belongsTo(models.User, {
      as: 'employee',
      foreignKey: 'employeeId',
    });
    PerformanceReview.belongsTo(models.User, {
      as: 'reviewer',
      foreignKey: 'reviewerId',
    });
    PerformanceReview.belongsTo(models.ReviewPeriod, {
      as: 'reviewPeriod',
      foreignKey: 'reviewPeriodId',
    });
  }
}

export default PerformanceReview;
