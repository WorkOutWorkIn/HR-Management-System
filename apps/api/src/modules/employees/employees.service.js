import { Op } from 'sequelize';
import { sequelize } from '../../config/db.js';
import { writeAuditLog } from '../../audit/audit.service.js';
import { ACCOUNT_STATUSES, ADMIN_EDITABLE_STATUSES } from '../../constants/account-statuses.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { UserModel } from '../../database/models/index.js';
import { createTemporaryPasswordForUser } from '../auth/auth.service.js';
import { dispatchOnboardingEmail } from '../auth/auth.notification.service.js';
import { serializeUser } from '../_shared/user-response.js';
import { validateManagerAssignment } from '../org-chart/org-chart.service.js';
import { ApiError } from '../../utils/ApiError.js';

const ADMIN_EDITABLE_FIELDS = [
  'fullName',
  'department',
  'jobTitle',
  'role',
  'status',
  'managerUserId',
  'annualLeaveQuota',
];

export async function listEmployees({ search, role, status }) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { workEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const users = await UserModel.findAll({
    where,
    order: [['created_at', 'DESC']],
  });

  return {
    items: users.map(serializeUser),
    total: users.length,
  };
}

export async function getEmployeeById(employeeId) {
  const user = await UserModel.findByPk(employeeId);

  if (!user) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  return serializeUser(user);
}

export async function createEmployee({ actorUserId, payload, request }) {
  const normalizedEmail = payload.workEmail.trim().toLowerCase();
  const actor = await UserModel.findByPk(actorUserId);

  if (!actor) {
    throw new ApiError(403, 'Administrator context is invalid', 'INVALID_ADMIN_CONTEXT');
  }

  if (actor.workEmail === normalizedEmail) {
    throw new ApiError(
      400,
      'Administrator cannot create an account for themselves',
      'SELF_ONBOARDING',
    );
  }

  const existingUser = await UserModel.findOne({
    where: { workEmail: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(409, 'Work email already exists', 'DUPLICATE_WORK_EMAIL');
  }

  const transaction = await sequelize.transaction();

  try {
    const { temporaryPassword, passwordHash } = await createTemporaryPasswordForUser();
    const managerUserId = payload.managerUserId || null;

    if (managerUserId) {
      await validateManagerAssignment({
        managerUserId,
        transaction,
      });
    }

    const user = await UserModel.create(
      {
        fullName: payload.fullName,
        workEmail: normalizedEmail,
        role: payload.role,
        status: ACCOUNT_STATUSES.PENDING_FIRST_LOGIN,
        passwordHash,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        createdByUserId: actor.id,
        managerUserId,
        annualLeaveQuota: payload.annualLeaveQuota ?? 14,
        department: payload.department || null,
        jobTitle: payload.jobTitle || null,
      },
      { transaction },
    );

    let notification;

    try {
      notification = await dispatchOnboardingEmail({
        user,
        temporaryPassword,
      });
    } catch (error) {
      const emailError = new ApiError(
        502,
        'Employee account could not be onboarded because the onboarding email failed. No account was created.',
        'ONBOARDING_EMAIL_FAILED',
      );

      emailError.originalError = error;
      throw emailError;
    }

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: user.id,
        action: AUDIT_ACTIONS.ACCOUNT_CREATED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          role: user.role,
          delivery: notification.delivery,
        },
      },
      { transaction },
    );

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: user.id,
        action: AUDIT_ACTIONS.ONBOARDING_EMAIL_SENT,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          delivery: notification.delivery,
          messageId: notification.messageId,
        },
      },
      { transaction },
    );

    await transaction.commit();

    return {
      user: serializeUser(user),
      onboarding: {
        delivery: notification.delivery,
        workEmail: user.workEmail,
      },
    };
  } catch (error) {
    await transaction.rollback();

    if (error?.name === 'SequelizeUniqueConstraintError') {
      throw new ApiError(409, 'Work email already exists', 'DUPLICATE_WORK_EMAIL');
    }

    if (error?.code === 'ONBOARDING_EMAIL_FAILED') {
      await writeAuditLog({
        actorUserId: actor.id,
        targetUserId: null,
        action: AUDIT_ACTIONS.ONBOARDING_EMAIL_FAILED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          workEmail: normalizedEmail,
          role: payload.role,
          reason: error.originalError?.message || error.message,
        },
      });
    }

    throw error;
  }
}

export async function updateEmployee({ actorUserId, employeeId, payload, request }) {
  const actor = await UserModel.findByPk(actorUserId);
  const employee = await UserModel.findByPk(employeeId);

  if (!actor || !employee) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  if (actor.id === employee.id && (payload.role || payload.status)) {
    throw new ApiError(
      400,
      'Administrator cannot change their own role or account status',
      'SELF_ROLE_OR_STATUS_CHANGE',
    );
  }

  if (payload.status && !ADMIN_EDITABLE_STATUSES.includes(payload.status)) {
    throw new ApiError(400, 'Status is invalid', 'INVALID_STATUS');
  }

  if (payload.managerUserId) {
    await validateManagerAssignment({
      employeeId: employee.id,
      managerUserId: payload.managerUserId,
    });
  }

  const updates = Object.fromEntries(
    ADMIN_EDITABLE_FIELDS.filter((field) => payload[field] !== undefined).map((field) => [
      field,
      payload[field],
    ]),
  );

  if (employee.status === ACCOUNT_STATUSES.LOCKED && updates.status === ACCOUNT_STATUSES.ACTIVE) {
    throw new ApiError(
      400,
      'Locked accounts must be unlocked with the dedicated unlock action',
      'ACCOUNT_UNLOCK_ACTION_REQUIRED',
    );
  }

  const transaction = await sequelize.transaction();

  try {
    const previousRole = employee.role;
    const previousStatus = employee.status;

    await employee.update(updates, { transaction });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: employee.id,
        action: AUDIT_ACTIONS.PROFILE_UPDATED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          updatedFields: Object.keys(updates),
        },
      },
      { transaction },
    );

    if (updates.role && updates.role !== previousRole) {
      await writeAuditLog(
        {
          actorUserId: actor.id,
          targetUserId: employee.id,
          action: AUDIT_ACTIONS.ROLE_CHANGED,
          ipAddress: request.requestContext?.ipAddress || request.ip || null,
          userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
          metadata: {
            previousRole,
            nextRole: updates.role,
          },
        },
        { transaction },
      );
    }

    if (updates.status && updates.status !== previousStatus) {
      await writeAuditLog(
        {
          actorUserId: actor.id,
          targetUserId: employee.id,
          action: AUDIT_ACTIONS.ACCOUNT_STATUS_CHANGED,
          ipAddress: request.requestContext?.ipAddress || request.ip || null,
          userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
          metadata: {
            previousStatus,
            nextStatus: updates.status,
          },
        },
        { transaction },
      );
    }

    await transaction.commit();

    return serializeUser(employee);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function unlockEmployee({ actorUserId, employeeId, request }) {
  const actor = await UserModel.findByPk(actorUserId);
  const employee = await UserModel.findByPk(employeeId);

  if (!actor || !employee) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  if (employee.status !== ACCOUNT_STATUSES.LOCKED) {
    throw new ApiError(400, 'Only locked accounts can be unlocked', 'ACCOUNT_NOT_LOCKED');
  }

  const transaction = await sequelize.transaction();

  try {
    const previousStatus = employee.status;

    await employee.update(
      {
        status: ACCOUNT_STATUSES.ACTIVE,
        failedLoginAttempts: 0,
        lockedAt: null,
      },
      { transaction },
    );

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: employee.id,
        action: AUDIT_ACTIONS.ACCOUNT_STATUS_CHANGED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          previousStatus,
          nextStatus: ACCOUNT_STATUSES.ACTIVE,
          reason: 'ADMIN_UNLOCK',
        },
      },
      { transaction },
    );

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: employee.id,
        action: AUDIT_ACTIONS.ACCOUNT_UNLOCKED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {},
      },
      { transaction },
    );

    await transaction.commit();

    return serializeUser(employee);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
