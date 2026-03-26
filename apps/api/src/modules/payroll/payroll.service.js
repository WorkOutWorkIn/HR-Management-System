import { Op } from 'sequelize';
import { sequelize } from '../../config/db.js';
import { writeAuditLog } from '../../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { PayrollRecordModel, SalaryRecordModel, UserModel } from '../../database/models/index.js';
import { ApiError } from '../../utils/ApiError.js';

const CPF_EMPLOYEE_RATE = 0.2;
const CPF_EMPLOYEE_LABEL = 'CPF employee contribution';

function normalizePayrollMonth(value) {
  if (!value) {
    throw new ApiError(400, 'Payroll month is required', 'PAYROLL_MONTH_REQUIRED');
  }

  return `${value}-01`;
}

function getMonthRange(payrollMonth) {
  const [year, month] = payrollMonth.split('-').map(Number);

  return {
    monthKey: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`,
    monthStart: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`,
    monthEnd: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10),
  };
}

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

function serializePayrollRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    payrollMonth: record.payrollMonth.slice(0, 7),
    sequenceNumber: record.sequenceNumber,
    originalPayrollRecordId: record.originalPayrollRecordId,
    correctionReason: record.correctionReason,
    isCorrection: record.sequenceNumber > 0,
    baseSalary: Number(record.baseSalary),
    deductions: [
      {
        label: record.deductionLabel,
        amount: Number(record.deductionAmount),
      },
    ],
    totalDeductions: Number(record.deductionAmount),
    netPay: Number(record.netPay),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getLatestSalaryForMonth(userId, monthEnd, transaction) {
  return SalaryRecordModel.findOne({
    where: {
      userId,
      effectiveDate: {
        [Op.lte]: monthEnd,
      },
    },
    order: [
      ['effective_date', 'DESC'],
      ['created_at', 'DESC'],
    ],
    transaction,
  });
}

export async function listMyPayroll({ actorUserId, request }) {
  const payrollRecords = await PayrollRecordModel.findAll({
    where: { userId: actorUserId },
    order: [
      ['created_at', 'DESC'],
      ['payroll_month', 'DESC'],
      ['sequence_number', 'DESC'],
    ],
  });

  await writeAuditLog({
    actorUserId,
    targetUserId: actorUserId,
    action: AUDIT_ACTIONS.PAYROLL_VIEWED,
    ipAddress: request.requestContext?.ipAddress || request.ip || null,
    userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
    metadata: {
      scope: 'self',
      viewedUserId: actorUserId,
    },
  });

  return {
    items: payrollRecords.map(serializePayrollRecord),
  };
}

export async function listPayrollUsers({ search }) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { workEmail: { [Op.like]: `%${search}%` } },
    ];
  }

  const [users, payrollRecords] = await Promise.all([
    UserModel.findAll({
      attributes: ['id', 'fullName', 'workEmail', 'role', 'department', 'jobTitle'],
      order: [['full_name', 'ASC']],
      where,
    }),
    PayrollRecordModel.findAll({
      order: [
        ['created_at', 'DESC'],
        ['payroll_month', 'DESC'],
        ['sequence_number', 'DESC'],
      ],
    }),
  ]);

  const latestPayrollByUserId = new Map();

  payrollRecords.forEach((record) => {
    if (!latestPayrollByUserId.has(record.userId)) {
      latestPayrollByUserId.set(record.userId, serializePayrollRecord(record));
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
      latestPayroll: latestPayrollByUserId.get(user.id) || null,
    })),
    total: users.length,
  };
}

export async function getPayrollForUser({ actorUserId, userId, request }) {
  const user = await UserModel.findByPk(userId, {
    attributes: ['id', 'fullName', 'workEmail', 'role', 'department', 'jobTitle'],
  });

  if (!user) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  const payrollRecords = await PayrollRecordModel.findAll({
    where: { userId },
    order: [
      ['created_at', 'DESC'],
      ['payroll_month', 'DESC'],
      ['sequence_number', 'DESC'],
    ],
  });

  await writeAuditLog({
    actorUserId,
    targetUserId: user.id,
    action: AUDIT_ACTIONS.PAYROLL_VIEWED,
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
    items: payrollRecords.map(serializePayrollRecord),
  };
}

export async function generatePayrollForEveryone({ actorUserId, payrollMonth, request }) {
  const actor = await UserModel.findByPk(actorUserId);

  if (!actor) {
    throw new ApiError(403, 'Administrator context is invalid', 'INVALID_ADMIN_CONTEXT');
  }

  const normalizedPayrollMonth = normalizePayrollMonth(payrollMonth);
  const { monthKey, monthEnd } = getMonthRange(payrollMonth);

  const users = await UserModel.findAll({
    attributes: ['id', 'fullName'],
    order: [['full_name', 'ASC']],
  });

  const transaction = await sequelize.transaction();

  try {
    const createdPayrollRecords = [];
    const skippedUsers = [];
    const alreadyIssuedUsers = [];

    for (const user of users) {
      const existingPayrollRecord = await PayrollRecordModel.findOne({
        where: {
          userId: user.id,
          payrollMonth: normalizedPayrollMonth,
          sequenceNumber: 0,
        },
        transaction,
      });

      if (existingPayrollRecord) {
        alreadyIssuedUsers.push({
          id: user.id,
          fullName: user.fullName,
        });
        continue;
      }

      const salaryRecord = await getLatestSalaryForMonth(user.id, monthEnd, transaction);

      if (!salaryRecord) {
        skippedUsers.push({
          id: user.id,
          fullName: user.fullName,
        });
        continue;
      }

      const baseSalary = Number(salaryRecord.baseSalary);
      const deductionAmount = roundCurrency(baseSalary * CPF_EMPLOYEE_RATE);
      const netPay = roundCurrency(baseSalary - deductionAmount);

      const payrollRecord = await PayrollRecordModel.create(
        {
          userId: user.id,
          payrollMonth: normalizedPayrollMonth,
          sequenceNumber: 0,
          originalPayrollRecordId: null,
          correctionReason: null,
          baseSalary,
          deductionLabel: CPF_EMPLOYEE_LABEL,
          deductionAmount,
          netPay,
          generatedByUserId: actor.id,
        },
        { transaction },
      );

      createdPayrollRecords.push(payrollRecord);
    }

    if (!createdPayrollRecords.length) {
      if (alreadyIssuedUsers.length) {
        throw new ApiError(
          409,
          `Payroll has already been issued to all eligible employees for ${monthKey}. Salary cannot be issued twice for the same month.`,
          'PAYROLL_ALREADY_GENERATED',
        );
      }

      throw new ApiError(
        400,
        `Payroll could not be generated for ${monthKey} because no employees have a salary record effective for that month.`,
        'PAYROLL_NO_ELIGIBLE_EMPLOYEES',
      );
    }

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: null,
        action: AUDIT_ACTIONS.PAYROLL_GENERATED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          payrollMonth: monthKey,
          generatedCount: createdPayrollRecords.length,
          alreadyIssuedCount: alreadyIssuedUsers.length,
          skippedCount: skippedUsers.length,
          alreadyIssuedUserIds: alreadyIssuedUsers.map((user) => user.id),
          skippedUserIds: skippedUsers.map((user) => user.id),
        },
      },
      { transaction },
    );

    await transaction.commit();

    return {
      payrollMonth: monthKey,
      generatedCount: createdPayrollRecords.length,
      alreadyIssuedCount: alreadyIssuedUsers.length,
      alreadyIssuedUsers,
      skippedCount: skippedUsers.length,
      skippedUsers,
      items: createdPayrollRecords.map(serializePayrollRecord),
    };
  } catch (error) {
    await transaction.rollback();

    if (error?.name === 'SequelizeUniqueConstraintError') {
      throw new ApiError(
        409,
        `Payroll has already been generated for ${monthKey}. Salary cannot be issued twice for the same month.`,
        'PAYROLL_ALREADY_GENERATED',
      );
    }

    throw error;
  }
}

export async function issuePayrollCorrectionForUser({
  actorUserId,
  userId,
  payrollRecordId,
  payload,
  request,
}) {
  const [actor, employee, originalPayrollRecord] = await Promise.all([
    UserModel.findByPk(actorUserId),
    UserModel.findByPk(userId),
    PayrollRecordModel.findOne({
      where: {
        id: payrollRecordId,
        userId,
      },
    }),
  ]);

  if (!actor || !employee || !originalPayrollRecord) {
    throw new ApiError(404, 'Payroll record not found', 'PAYROLL_RECORD_NOT_FOUND');
  }

  const transaction = await sequelize.transaction();

  try {
    const currentMaxSequenceNumber =
      (await PayrollRecordModel.max('sequenceNumber', {
        where: {
          userId,
          payrollMonth: originalPayrollRecord.payrollMonth,
        },
        transaction,
      })) || 0;
    const nextSequenceNumber = currentMaxSequenceNumber + 1;

    const baseSalary = Number(payload.baseSalary);
    const deductionAmount = Number(payload.deductionAmount);
    const netPay = roundCurrency(baseSalary - deductionAmount);

    const correctionRecord = await PayrollRecordModel.create(
      {
        userId,
        payrollMonth: originalPayrollRecord.payrollMonth,
        sequenceNumber: nextSequenceNumber,
        originalPayrollRecordId:
          originalPayrollRecord.originalPayrollRecordId || originalPayrollRecord.id,
        correctionReason: payload.correctionReason,
        baseSalary,
        deductionLabel: CPF_EMPLOYEE_LABEL,
        deductionAmount,
        netPay,
        generatedByUserId: actor.id,
      },
      { transaction },
    );

    await writeAuditLog(
      {
        actorUserId: actor.id,
        targetUserId: employee.id,
        action: AUDIT_ACTIONS.PAYROLL_CORRECTION_ISSUED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          originalPayrollRecordId: originalPayrollRecord.id,
          correctionPayrollRecordId: correctionRecord.id,
          payrollMonth: correctionRecord.payrollMonth.slice(0, 7),
          sequenceNumber: correctionRecord.sequenceNumber,
          correctionReason: correctionRecord.correctionReason,
        },
      },
      { transaction },
    );

    await transaction.commit();

    return {
      payrollRecord: serializePayrollRecord(correctionRecord),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
