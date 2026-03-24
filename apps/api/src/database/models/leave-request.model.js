import { DataTypes, Model } from 'sequelize';
import { LEAVE_DAY_PORTIONS, LEAVE_REQUEST_STATUSES, LEAVE_TYPES } from '@hrms/shared';
import { buildBaseModelOptions } from './base.model.js';

class LeaveRequest extends Model {
  static initialize(sequelize) {
    LeaveRequest.init(
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
        leaveType: {
          type: DataTypes.ENUM(...Object.values(LEAVE_TYPES)),
          allowNull: false,
          field: 'leave_type',
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
        startDayPortion: {
          type: DataTypes.ENUM(...Object.values(LEAVE_DAY_PORTIONS)),
          allowNull: false,
          defaultValue: LEAVE_DAY_PORTIONS.FULL,
          field: 'start_day_portion',
        },
        endDayPortion: {
          type: DataTypes.ENUM(...Object.values(LEAVE_DAY_PORTIONS)),
          allowNull: false,
          defaultValue: LEAVE_DAY_PORTIONS.FULL,
          field: 'end_day_portion',
        },
        reason: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(LEAVE_REQUEST_STATUSES)),
          allowNull: false,
          defaultValue: LEAVE_REQUEST_STATUSES.PENDING,
        },
        approverId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'approver_id',
        },
        decidedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'decided_at',
        },
        decisionComment: {
          type: DataTypes.STRING(500),
          allowNull: true,
          field: 'decision_comment',
        },
        durationDays: {
          type: DataTypes.DECIMAL(5, 1),
          allowNull: false,
          defaultValue: 1,
          field: 'duration_days',
        },
      },
      buildBaseModelOptions('leave_requests', {
        sequelize,
        modelName: 'LeaveRequest',
      }),
    );

    return LeaveRequest;
  }

  static associate(models) {
    LeaveRequest.belongsTo(models.User, {
      as: 'employee',
      foreignKey: 'employeeId',
    });
    LeaveRequest.belongsTo(models.User, {
      as: 'approver',
      foreignKey: 'approverId',
    });
  }
}

export default LeaveRequest;
