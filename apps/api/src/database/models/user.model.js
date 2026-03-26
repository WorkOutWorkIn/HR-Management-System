import { DataTypes, Model } from 'sequelize';
import { ROLES } from '@hrms/shared';
import { ACCOUNT_STATUSES } from '../../constants/account-statuses.js';
import { buildBaseModelOptions } from './base.model.js';

class User extends Model {
  static initialize(sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        fullName: {
          type: DataTypes.STRING(120),
          allowNull: false,
          field: 'full_name',
        },
        workEmail: {
          type: DataTypes.STRING(191),
          allowNull: false,
          unique: true,
          field: 'work_email',
        },
        role: {
          type: DataTypes.ENUM(...Object.values(ROLES)),
          allowNull: false,
          defaultValue: ROLES.EMPLOYEE,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ACCOUNT_STATUSES)),
          allowNull: false,
          defaultValue: ACCOUNT_STATUSES.PENDING_FIRST_LOGIN,
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'password_hash',
        },
        mustChangePassword: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'must_change_password',
        },
        failedLoginAttempts: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'failed_login_attempts',
        },
        lockedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'locked_at',
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_login_at',
        },
        passwordChangedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'password_changed_at',
        },
        department: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        jobTitle: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'job_title',
        },
        phoneNumber: {
          type: DataTypes.STRING(30),
          allowNull: true,
          field: 'phone_number',
        },
        addressLine1: {
          type: DataTypes.STRING(160),
          allowNull: true,
          field: 'address_line_1',
        },
        addressLine2: {
          type: DataTypes.STRING(160),
          allowNull: true,
          field: 'address_line_2',
        },
        city: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        state: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        postalCode: {
          type: DataTypes.STRING(20),
          allowNull: true,
          field: 'postal_code',
        },
        country: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
        emergencyContactName: {
          type: DataTypes.STRING(120),
          allowNull: true,
          field: 'emergency_contact_name',
        },
        emergencyContactPhone: {
          type: DataTypes.STRING(30),
          allowNull: true,
          field: 'emergency_contact_phone',
        },
        createdByUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'created_by_user_id',
        },
        managerUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'manager_user_id',
        },
        annualLeaveQuota: {
          type: DataTypes.DECIMAL(5, 1),
          allowNull: false,
          defaultValue: 14,
          field: 'annual_leave_quota',
        },
      },
      buildBaseModelOptions('users', {
        sequelize,
        modelName: 'User',
      }),
    );

    return User;
  }

  static associate(models) {
    User.belongsTo(models.User, {
      as: 'createdByUser',
      foreignKey: 'createdByUserId',
    });
    User.hasMany(models.User, {
      as: 'createdUsers',
      foreignKey: 'createdByUserId',
    });
    User.belongsTo(models.User, {
      as: 'managerUser',
      foreignKey: 'managerUserId',
    });
    User.hasMany(models.User, {
      as: 'directReports',
      foreignKey: 'managerUserId',
    });
    User.hasMany(models.PasswordResetToken, {
      as: 'passwordResetTokens',
      foreignKey: 'userId',
    });
    User.hasMany(models.RefreshToken, {
      as: 'refreshTokens',
      foreignKey: 'userId',
    });
    User.hasMany(models.AuditLog, {
      as: 'actorAuditLogs',
      foreignKey: 'actorUserId',
    });
    User.hasMany(models.AuditLog, {
      as: 'targetAuditLogs',
      foreignKey: 'targetUserId',
    });
    User.hasMany(models.LeaveRequest, {
      as: 'leaveRequests',
      foreignKey: 'employeeId',
    });
    User.hasMany(models.LeaveRequest, {
      as: 'approvedLeaveRequests',
      foreignKey: 'approverId',
    });
    User.hasMany(models.PublicHoliday, {
      as: 'createdPublicHolidays',
      foreignKey: 'createdByUserId',
    });
    User.hasMany(models.ReviewPeriod, {
      as: 'createdReviewPeriods',
      foreignKey: 'createdByUserId',
    });
    User.hasMany(models.PerformanceReview, {
      as: 'employeePerformanceReviews',
      foreignKey: 'employeeId',
    });
    User.hasMany(models.PerformanceReview, {
      as: 'authoredPerformanceReviews',
      foreignKey: 'reviewerId',
    });
    User.hasMany(models.SalaryRecord, {
      as: 'salaryRecords',
      foreignKey: 'userId',
    });
    User.hasMany(models.PayrollRecord, {
      as: 'payrollRecords',
      foreignKey: 'userId',
    });
    User.hasMany(models.PayrollRecord, {
      as: 'generatedPayrollRecords',
      foreignKey: 'generatedByUserId',
    });
  }
}

export default User;
