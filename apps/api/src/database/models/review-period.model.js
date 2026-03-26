import { DataTypes, Model } from 'sequelize';
import {
  REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH,
  REVIEW_PERIOD_NAME_MAX_LENGTH,
  REVIEW_PERIOD_STATUSES,
} from '@hrms/shared';
import { buildBaseModelOptions } from './base.model.js';

class ReviewPeriod extends Model {
  static initialize(sequelize) {
    ReviewPeriod.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(REVIEW_PERIOD_NAME_MAX_LENGTH),
          allowNull: false,
          unique: true,
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'start_date',
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'end_date',
        },
        status: {
          type: DataTypes.ENUM(...Object.values(REVIEW_PERIOD_STATUSES)),
          allowNull: false,
          defaultValue: REVIEW_PERIOD_STATUSES.CLOSED,
        },
        description: {
          type: DataTypes.STRING(REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH),
          allowNull: true,
        },
        createdByUserId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'created_by_user_id',
        },
      },
      buildBaseModelOptions('review_periods', {
        sequelize,
        modelName: 'ReviewPeriod',
      }),
    );

    return ReviewPeriod;
  }

  static associate(models) {
    ReviewPeriod.belongsTo(models.User, {
      as: 'createdByUser',
      foreignKey: 'createdByUserId',
    });
    ReviewPeriod.hasMany(models.PerformanceReview, {
      as: 'reviews',
      foreignKey: 'reviewPeriodId',
    });
  }
}

export default ReviewPeriod;
