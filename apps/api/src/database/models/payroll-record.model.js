import { DataTypes, Model } from 'sequelize';
import { buildBaseModelOptions } from './base.model.js';

class PayrollRecord extends Model {
  static initialize(sequelize) {
    PayrollRecord.init(
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
        payrollMonth: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          field: 'payroll_month',
        },
        sequenceNumber: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'sequence_number',
        },
        originalPayrollRecordId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'original_payroll_record_id',
        },
        correctionReason: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'correction_reason',
        },
        baseSalary: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: 'base_salary',
        },
        deductionLabel: {
          type: DataTypes.STRING(120),
          allowNull: false,
          field: 'deduction_label',
        },
        deductionAmount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: 'deduction_amount',
        },
        netPay: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: 'net_pay',
        },
        generatedByUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'generated_by_user_id',
        },
      },
      buildBaseModelOptions('payroll_records', {
        sequelize,
        modelName: 'PayrollRecord',
      }),
    );

    return PayrollRecord;
  }

  static associate(models) {
    PayrollRecord.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
    PayrollRecord.belongsTo(models.User, {
      as: 'generatedByUser',
      foreignKey: 'generatedByUserId',
    });
    PayrollRecord.belongsTo(models.PayrollRecord, {
      as: 'originalPayrollRecord',
      foreignKey: 'originalPayrollRecordId',
    });
    PayrollRecord.hasMany(models.PayrollRecord, {
      as: 'correctionRecords',
      foreignKey: 'originalPayrollRecordId',
    });
  }
}

export default PayrollRecord;
