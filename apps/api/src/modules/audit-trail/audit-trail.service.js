import { Op } from 'sequelize';
import { AuditLogModel, UserModel } from '../../database/models/index.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { sanitizeLogData } from '../../utils/sanitizeLogData.js';

const SECURITY_AUDIT_ACTIONS = Object.freeze([
  AUDIT_ACTIONS.LOGIN_SUCCESS,
  AUDIT_ACTIONS.LOGIN_FAILURE,
  AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
  AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
  AUDIT_ACTIONS.PASSWORD_CHANGED,
  AUDIT_ACTIONS.FIRST_LOGIN_PASSWORD_RESET_COMPLETED,
  AUDIT_ACTIONS.ACCOUNT_STATUS_CHANGED,
  AUDIT_ACTIONS.ACCOUNT_LOCKED,
  AUDIT_ACTIONS.ACCOUNT_UNLOCKED,
  AUDIT_ACTIONS.SALARY_RECORD_UPDATED,
  AUDIT_ACTIONS.SALARY_VIEWED,
  AUDIT_ACTIONS.PAYROLL_GENERATED,
  AUDIT_ACTIONS.PAYROLL_VIEWED,
  AUDIT_ACTIONS.PAYROLL_CORRECTION_ISSUED,
]);

function getAuditEventGroup(action) {
  if ([AUDIT_ACTIONS.LOGIN_SUCCESS, AUDIT_ACTIONS.LOGIN_FAILURE].includes(action)) {
    return 'LOGIN';
  }

  if (
    [
      AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
      AUDIT_ACTIONS.PASSWORD_CHANGED,
      AUDIT_ACTIONS.FIRST_LOGIN_PASSWORD_RESET_COMPLETED,
    ].includes(action)
  ) {
    return 'PASSWORD';
  }

  if ([AUDIT_ACTIONS.SALARY_RECORD_UPDATED, AUDIT_ACTIONS.SALARY_VIEWED].includes(action)) {
    return 'SALARY';
  }

  if (
    [
      AUDIT_ACTIONS.PAYROLL_GENERATED,
      AUDIT_ACTIONS.PAYROLL_VIEWED,
      AUDIT_ACTIONS.PAYROLL_CORRECTION_ISSUED,
    ].includes(action)
  ) {
    return 'PAYROLL';
  }

  return 'ACCOUNT';
}

function serializeUserSummary(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    workEmail: user.workEmail,
    role: user.role,
    status: user.status,
  };
}

function serializeAuditLog(record) {
  const details = sanitizeLogData(record.metadata || {});

  return {
    id: record.id,
    action: record.action,
    eventGroup: getAuditEventGroup(record.action),
    createdAt: record.createdAt || record.created_at || null,
    actorUser: serializeUserSummary(record.actorUser),
    targetUser: serializeUserSummary(record.targetUser),
    details,
  };
}

export function getSupportedAuditTrailActions() {
  return [...SECURITY_AUDIT_ACTIONS];
}

export async function listAuditTrailEntries({ actions, limit = 50, page = 1 }) {
  const resolvedActions =
    actions?.length && actions.some(Boolean)
      ? actions.filter((action) => SECURITY_AUDIT_ACTIONS.includes(action))
      : SECURITY_AUDIT_ACTIONS;
  const offset = (page - 1) * limit;

  const result = await AuditLogModel.findAndCountAll({
    where: {
      action: {
        [Op.in]: resolvedActions,
      },
    },
    include: [
      {
        model: UserModel,
        as: 'actorUser',
        attributes: ['id', 'fullName', 'workEmail', 'role', 'status'],
        required: false,
      },
      {
        model: UserModel,
        as: 'targetUser',
        attributes: ['id', 'fullName', 'workEmail', 'role', 'status'],
        required: false,
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  return {
    items: result.rows.map(serializeAuditLog),
    total: result.count,
    page,
    limit,
    availableActions: SECURITY_AUDIT_ACTIONS,
  };
}
