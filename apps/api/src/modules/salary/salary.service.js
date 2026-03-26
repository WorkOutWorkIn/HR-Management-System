import { Op } from 'sequelize';
import { sequelize } from '../../config/db.js';
import { writeAuditLog } from '../../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { SalaryRecordModel, UserModel } from '../../database/models/index.js';
import { ApiError } from '../../utils/ApiError.js';

function serializeSalaryRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    baseSalary: Number(record.baseSalary),
    effectiveDate: record.effectiveDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getSalaryHistory(userId) {
  return SalaryRecordModel.findAll({
    where: { userId },
    order: [
      ['effective_date', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });
}

export async function getMySalaryRecord({ actorUserId, request }) {
  const salaryHistory = await getSalaryHistory(actorUserId);
  const salaryRecord = salaryHistory[0] || null;

  await writeAuditLog({
    actorUserId,
    targetUserId: actorUserId,
    action: AUDIT_ACTIONS.SALARY_VIEWED,
    ipAddress: request.requestContext?.ipAddress || request.ip || null,
    userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
    metadata: {
      scope: 'self',
      viewedUserId: actorUserId,
    },
  });

  return {
    salaryRecord: serializeSalaryRecord(salaryRecord),
    history: salaryHistory.map(serializeSalaryRecord),
  };
}

export async function getSalaryRecordForUser({ actorUserId, userId, request }) {
  const user = await UserModel.findByPk(userId, {
    attributes: ['id', 'fullName', 'workEmail', 'role', 'department', 'jobTitle'],
  });

  if (!user) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  const salaryHistory = await getSalaryHistory(userId);
  const salaryRecord = salaryHistory[0] || null;

  await writeAuditLog({
    actorUserId,
    targetUserId: user.id,
    action: AUDIT_ACTIONS.SALARY_VIEWED,
    ipAddress: request.requestContext?.ipAddress || request.ip || null,
    userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
    metadata: {
      scope: 'admin',
      viewedUserId: user.id,
    },
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      workEmail: user.workEmail,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
    },
    salaryRecord: serializeSalaryRecord(salaryRecord),
    history: salaryHistory.map(serializeSalaryRecord),
  };
}

export async function listUsersForSalaryAdmin({ search }) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { workEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  const users = await UserModel.findAll({
    attributes: ['id', 'fullName', 'workEmail', 'role', 'department', 'jobTitle'],
    order: [['full_name', 'ASC']],
    where,
  });

  const salaryRecords = await SalaryRecordModel.findAll({
    order: [
      ['effective_date', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  const latestSalaryByUserId = new Map();

  salaryRecords.forEach((record) => {
    if (!latestSalaryByUserId.has(record.userId)) {
      latestSalaryByUserId.set(record.userId, serializeSalaryRecord(record));
    }
  });

  return {
    items: users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      workEmail: user.workEmail,
      role: user.role,
      department: user.department,
      jobTitle: user.jobTitle,
      salaryRecord: latestSalaryByUserId.get(user.id) || null,
    })),
    total: users.length,
  };
}

export async function createSalaryRecordForUser({ actorUserId, userId, payload, request }) {
  const [actor, employee] = await Promise.all([
    UserModel.findByPk(actorUserId),
    UserModel.findByPk(userId),
  ]);

  if (!actor || !employee) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  const transaction = await sequelize.transaction();

  try {
    const existingRecord = await SalaryRecordModel.findOne({
      where: {
        userId,
        effectiveDate: payload.effectiveDate,
      },
      transaction,
    });

    const values = {
      baseSalary: payload.baseSalary,
      effectiveDate: payload.effectiveDate,
      userId,
    };

    if (existingRecord) {
      throw new ApiError(
        409,
        'A salary record with the same effective date already exists. Choose a new effective date to preserve salary history.',
        'SALARY_EFFECTIVE_DATE_ALREADY_EXISTS',
      );
    }

    const salaryRecord = await SalaryRecordModel.create(values, { transaction });

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: employee.id,
        action: AUDIT_ACTIONS.SALARY_RECORD_UPDATED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          salaryRecordId: salaryRecord.id,
          baseSalary: Number(salaryRecord.baseSalary),
          effectiveDate: salaryRecord.effectiveDate,
          operation: 'create',
        },
      },
      { transaction },
    );

    await transaction.commit();

    return {
      salaryRecord: serializeSalaryRecord(salaryRecord),
      history: (await getSalaryHistory(userId)).map(serializeSalaryRecord),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
