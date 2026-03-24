import { DataTypes, Model } from 'sequelize';
import { buildBaseModelOptions } from './base.model.js';

class PublicHoliday extends Model {
  static initialize(sequelize) {
    PublicHoliday.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        holidayDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          unique: true,
          field: 'holiday_date',
        },
        createdByUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'created_by_user_id',
        },
      },
      buildBaseModelOptions('public_holidays', {
        sequelize,
        modelName: 'PublicHoliday',
      }),
    );

    return PublicHoliday;
  }

  static associate(models) {
    PublicHoliday.belongsTo(models.User, {
      as: 'createdByUser',
      foreignKey: 'createdByUserId',
    });
  }
}

export default PublicHoliday;
