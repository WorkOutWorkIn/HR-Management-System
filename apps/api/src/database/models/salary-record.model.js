import { DataTypes, Model } from 'sequelize';
import { buildBaseModelOptions } from './base.model.js';

class SalaryRecord extends Model {
  static initialize(sequelize) {
    SalaryRecord.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_id',
        },
        baseSalary: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: 'base_salary',
        },
        effectiveDate: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'effective_date',
        },
      },
      buildBaseModelOptions('salary_records', {
        sequelize,
        modelName: 'SalaryRecord',
      }),
    );

    return SalaryRecord;
  }

  static associate(models) {
    SalaryRecord.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  }
}

export default SalaryRecord;
