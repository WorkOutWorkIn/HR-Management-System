import { ROLES } from '@hrms/shared';
import { sequelize } from '../../config/db.js';
import { buildAuditPayload, writeAuditLog } from '../../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { UserModel } from '../../database/models/index.js';
import { ApiError } from '../../utils/ApiError.js';

function serializeRelationshipUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName,
    workEmail: user.workEmail,
    role: user.role,
    managerUserId: user.managerUserId,
    department: user.department,
    jobTitle: user.jobTitle,
  };
}

async function getUserOrThrow(userId, transaction) {
  const user = await UserModel.findByPk(userId, {
    transaction,
    attributes: [
      'id',
      'fullName',
      'workEmail',
      'role',
      'managerUserId',
      'department',
      'jobTitle',
    ],
  });

  if (!user) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  return user;
}

export async function validateManagerAssignment({ employeeId, managerUserId, transaction }) {
  if (!managerUserId) {
    return null;
  }

  if (employeeId && employeeId === managerUserId) {
    throw new ApiError(
      400,
      'Employee cannot be assigned as their own manager',
      'SELF_MANAGER_ASSIGNMENT',
    );
  }

  const manager = await getUserOrThrow(managerUserId, transaction);

  if (![ROLES.MANAGER, ROLES.ADMIN].includes(manager.role)) {
    throw new ApiError(
      400,
      'Selected manager must have MANAGER or ADMIN role',
      'INVALID_MANAGER_ROLE',
    );
  }

  if (employeeId) {
    const visited = new Set([employeeId]);
    let currentManagerId = manager.managerUserId;

    while (currentManagerId) {
      if (visited.has(currentManagerId)) {
        throw new ApiError(
          400,
          'Manager assignment would create a circular reporting line',
          'REPORTING_LINE_CYCLE',
        );
      }

      visited.add(currentManagerId);

      const currentManager = await UserModel.findByPk(currentManagerId, {
        transaction,
        attributes: ['id', 'managerUserId'],
      });

      if (!currentManager) {
        break;
      }

      currentManagerId = currentManager.managerUserId;
    }
  }

  return manager;
}

export async function assignEmployeeManager({
  actorUserId,
  employeeId,
  managerUserId,
  request,
}) {
  const actor = await getUserOrThrow(actorUserId);

  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can update reporting lines', 'FORBIDDEN');
  }

  const transaction = await sequelize.transaction();

  try {
    const employee = await getUserOrThrow(employeeId, transaction);
    const previousManagerUserId = employee.managerUserId || null;

    if (employee.id === actor.id && managerUserId) {
      throw new ApiError(
        400,
        'Administrator cannot assign themselves to report to another user',
        'INVALID_ADMIN_REPORTING_LINE',
      );
    }

    const manager = await validateManagerAssignment({
      employeeId: employee.id,
      managerUserId: managerUserId || null,
      transaction,
    });

    await employee.update(
      {
        managerUserId: manager ? manager.id : null,
      },
      { transaction },
    );

    const updatedEmployee = await UserModel.findByPk(employee.id, {
      transaction,
      include: [
        {
          model: UserModel,
          as: 'managerUser',
          attributes: ['id', 'fullName', 'workEmail', 'role'],
        },
      ],
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        targetUserId: employee.id,
        action: AUDIT_ACTIONS.REPORTING_LINE_UPDATED,
        metadata: {
          previousManagerUserId,
          nextManagerUserId: updatedEmployee.managerUserId,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return {
      employee: serializeRelationshipUser(updatedEmployee),
      manager: serializeRelationshipUser(updatedEmployee.managerUser),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listDirectReports({ actorUserId, managerUserId }) {
  const actor = await getUserOrThrow(actorUserId);
  const resolvedManagerId =
    actor.role === ROLES.ADMIN && managerUserId ? managerUserId : actor.id;

  if (actor.role !== ROLES.ADMIN && actor.role !== ROLES.MANAGER) {
    throw new ApiError(403, 'Only managers or administrators can view direct reports', 'FORBIDDEN');
  }

  const directReports = await UserModel.findAll({
    where: { managerUserId: resolvedManagerId },
    attributes: [
      'id',
      'fullName',
      'workEmail',
      'role',
      'managerUserId',
      'department',
      'jobTitle',
      'status',
    ],
    order: [['full_name', 'ASC']],
  });

  const manager = await UserModel.findByPk(resolvedManagerId, {
    attributes: ['id', 'fullName', 'workEmail', 'role', 'department', 'jobTitle'],
  });

  return {
    manager: serializeRelationshipUser(manager),
    items: directReports.map(serializeRelationshipUser),
    total: directReports.length,
  };
}

export async function getMyReportingLine(userId) {
  const user = await UserModel.findByPk(userId, {
    include: [
      {
        model: UserModel,
        as: 'managerUser',
        attributes: ['id', 'fullName', 'workEmail', 'role', 'department', 'jobTitle'],
      },
      {
        model: UserModel,
        as: 'directReports',
        attributes: ['id', 'fullName', 'workEmail', 'role', 'managerUserId'],
      },
    ],
    order: [[{ model: UserModel, as: 'directReports' }, 'full_name', 'ASC']],
  });

  if (!user) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  return {
    employee: serializeRelationshipUser(user),
    manager: serializeRelationshipUser(user.managerUser),
    directReports: (user.directReports || []).map(serializeRelationshipUser),
  };
}

export async function listReportingRelationships(actorUserId) {
  const actor = await getUserOrThrow(actorUserId);

  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can view all reporting relationships', 'FORBIDDEN');
  }

  const employees = await UserModel.findAll({
    include: [
      {
        model: UserModel,
        as: 'managerUser',
        attributes: ['id', 'fullName', 'workEmail', 'role'],
      },
    ],
    attributes: ['id', 'fullName', 'workEmail', 'role', 'managerUserId', 'department', 'jobTitle'],
    order: [['full_name', 'ASC']],
  });

  return {
    items: employees.map((employee) => ({
      employee: serializeRelationshipUser(employee),
      manager: serializeRelationshipUser(employee.managerUser),
    })),
    total: employees.length,
  };
}
