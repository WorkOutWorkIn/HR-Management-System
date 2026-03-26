import sequelize from '../../config/db.js';
import AuditLog from './audit-log.model.js';
import LeaveRequest from './leave-request.model.js';
import PasswordResetToken from './password-reset-token.model.js';
import PayrollRecord from './payroll-record.model.js';
import PublicHoliday from './public-holiday.model.js';
import RefreshToken from './refresh-token.model.js';
import SalaryRecord from './salary-record.model.js';
import User from './user.model.js';

const models = {
  User: User.initialize(sequelize),
  PasswordResetToken: PasswordResetToken.initialize(sequelize),
  RefreshToken: RefreshToken.initialize(sequelize),
  AuditLog: AuditLog.initialize(sequelize),
  LeaveRequest: LeaveRequest.initialize(sequelize),
  PublicHoliday: PublicHoliday.initialize(sequelize),
  SalaryRecord: SalaryRecord.initialize(sequelize),
  PayrollRecord: PayrollRecord.initialize(sequelize),
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export function registerModel(name, model) {
  models[name] = model;
}

export function getModels() {
  return models;
}

export { sequelize };
export const {
  User: UserModel,
  PasswordResetToken: PasswordResetTokenModel,
  RefreshToken: RefreshTokenModel,
  AuditLog: AuditLogModel,
  LeaveRequest: LeaveRequestModel,
  PublicHoliday: PublicHolidayModel,
  SalaryRecord: SalaryRecordModel,
  PayrollRecord: PayrollRecordModel,
} = models;
export default models;
