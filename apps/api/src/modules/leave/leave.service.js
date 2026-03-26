import { Op } from 'sequelize';
import { LEAVE_DAY_PORTIONS, LEAVE_REQUEST_STATUSES, LEAVE_TYPES, ROLES } from '@hrms/shared';
import { sequelize } from '../../config/db.js';
import { buildAuditPayload, writeAuditLog } from '../../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import {
  LeaveRequestModel,
  PublicHolidayModel,
  UserModel,
} from '../../database/models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  calculateBusinessLeaveDuration,
  getTodayDateString,
  serializeLeaveRequest,
  serializePublicHoliday,
} from './leave.utils.js';
import {
  ANNUAL_LEAVE_DEDUCTION_POLICY,
  SICK_LEAVE_DEDUCTION_POLICY,
  assertLeaveRequestWithinBalance,
  assertSickLeaveFullDayOnly,
} from './leave.policy.js';

function getLeaveRequestInclude() {
  return [
    {
      model: UserModel,
      as: 'employee',
      attributes: ['id', 'fullName', 'workEmail', 'role', 'managerUserId', 'annualLeaveQuota'],
    },
    {
      model: UserModel,
      as: 'approver',
      attributes: ['id', 'fullName', 'workEmail', 'role'],
    },
  ];
}

async function getPublicHolidaySet(startDate, endDate, transaction) {
  const holidays = await PublicHolidayModel.findAll({
    where: {
      holidayDate: {
        [Op.between]: [startDate, endDate],
      },
    },
    transaction,
  });

  return new Set(holidays.map((holiday) => holiday.holidayDate));
}

function ensureDateRange({ startDate, endDate }) {
  if (endDate < startDate) {
    throw new ApiError(400, 'End date cannot be before start date', 'INVALID_DATE_RANGE');
  }

  if (startDate < getTodayDateString()) {
    throw new ApiError(400, 'Leave cannot start in the past', 'START_DATE_IN_PAST');
  }
}

async function ensureNoOverlap({ employeeId, startDate, endDate, transaction }) {
  const overlap = await LeaveRequestModel.findOne({
    where: {
      employeeId,
      status: {
        [Op.in]: [LEAVE_REQUEST_STATUSES.PENDING, LEAVE_REQUEST_STATUSES.APPROVED],
      },
      startDate: {
        [Op.lte]: endDate,
      },
      endDate: {
        [Op.gte]: startDate,
      },
    },
    transaction,
  });

  if (overlap) {
    throw new ApiError(
      409,
      'Leave request overlaps with an existing pending or approved leave period',
      'OVERLAPPING_LEAVE_REQUEST',
    );
  }
}

async function getActor(actorUserId) {
  const actor = await UserModel.findByPk(actorUserId, {
    attributes: ['id', 'role', 'fullName', 'workEmail', 'annualLeaveQuota', 'sickLeaveQuota'],
  });

  if (!actor) {
    throw new ApiError(401, 'Authenticated user was not found', 'ACTOR_NOT_FOUND');
  }

  return actor;
}

async function getLeaveRequestForDecision(leaveRequestId, transaction) {
  const leaveRequest = await LeaveRequestModel.findByPk(leaveRequestId, {
    include: getLeaveRequestInclude(),
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!leaveRequest) {
    throw new ApiError(404, 'Leave request not found', 'LEAVE_REQUEST_NOT_FOUND');
  }

  return leaveRequest;
}

function ensureDecisionAllowed({ actor, leaveRequest }) {
  if (actor.id === leaveRequest.employeeId) {
    throw new ApiError(403, 'You cannot approve or reject your own leave request', 'SELF_APPROVAL');
  }

  if (leaveRequest.status !== LEAVE_REQUEST_STATUSES.PENDING) {
    throw new ApiError(
      400,
      'Only pending leave requests can be approved or rejected',
      'INVALID_LEAVE_STATUS_TRANSITION',
    );
  }

  if (actor.role === ROLES.ADMIN) {
    return;
  }

  if (actor.role !== ROLES.MANAGER) {
    throw new ApiError(403, 'Only managers or administrators can decide leave requests', 'FORBIDDEN');
  }

  if (leaveRequest.employee?.managerUserId !== actor.id) {
    throw new ApiError(
      403,
      'Managers can only approve or reject leave requests for their direct reports',
      'NOT_DIRECT_REPORT',
    );
  }
}

function getCurrentYearRange() {
  const currentYear = new Date().getUTCFullYear();
  return {
    currentYear,
    yearStart: `${currentYear}-01-01`,
    yearEnd: `${currentYear}-12-31`,
  };
}

async function calculateApprovedLeaveUsed({ employeeId, leaveType, transaction }) {
  const { currentYear, yearStart, yearEnd } = getCurrentYearRange();
  const approvedLeaveRequests = await LeaveRequestModel.findAll({
    where: {
      employeeId,
      leaveType,
      status: LEAVE_REQUEST_STATUSES.APPROVED,
      startDate: {
        [Op.lte]: yearEnd,
      },
      endDate: {
        [Op.gte]: yearStart,
      },
    },
    transaction,
  });

  if (!approvedLeaveRequests.length) {
    return {
      currentYear,
      usedDays: 0,
    };
  }

  const holidaySet = await getPublicHolidaySet(yearStart, yearEnd, transaction);
  const usedDays = approvedLeaveRequests.reduce((total, request) => {
    const overlapStart = request.startDate > yearStart ? request.startDate : yearStart;
    const overlapEnd = request.endDate < yearEnd ? request.endDate : yearEnd;
    const startDayPortion =
      overlapStart === request.startDate ? request.startDayPortion : LEAVE_DAY_PORTIONS.FULL;
    const endDayPortion =
      overlapEnd === request.endDate ? request.endDayPortion : LEAVE_DAY_PORTIONS.FULL;

    return (
      total +
      calculateBusinessLeaveDuration({
        startDate: overlapStart,
        endDate: overlapEnd,
        startDayPortion,
        endDayPortion,
        publicHolidaySet: holidaySet,
      })
    );
  }, 0);

  return {
    currentYear,
    usedDays: Number(usedDays.toFixed(1)),
  };
}

export async function getMyLeaveBalance(userId) {
  const user = await UserModel.findByPk(userId, {
    attributes: ['id', 'annualLeaveQuota', 'sickLeaveQuota'],
  });

  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  const annualUsage = await calculateApprovedLeaveUsed({
    employeeId: user.id,
    leaveType: LEAVE_TYPES.ANNUAL,
  });
  const sickUsage = await calculateApprovedLeaveUsed({
    employeeId: user.id,
    leaveType: LEAVE_TYPES.SICK,
  });
  const annualQuota = Number(user.annualLeaveQuota);
  const sickQuota = Number(user.sickLeaveQuota);
  const annualRemainingDays = Number((annualQuota - annualUsage.usedDays).toFixed(1));
  const sickRemainingDays = Number((sickQuota - sickUsage.usedDays).toFixed(1));

  return {
    year: annualUsage.currentYear,
    balances: {
      [LEAVE_TYPES.ANNUAL]: {
        leaveType: LEAVE_TYPES.ANNUAL,
        quota: annualQuota,
        usedDays: annualUsage.usedDays,
        remainingDays: annualRemainingDays,
        deductionPolicy: ANNUAL_LEAVE_DEDUCTION_POLICY,
      },
      [LEAVE_TYPES.SICK]: {
        leaveType: LEAVE_TYPES.SICK,
        quota: sickQuota,
        usedDays: sickUsage.usedDays,
        remainingDays: sickRemainingDays,
        deductionPolicy: SICK_LEAVE_DEDUCTION_POLICY,
      },
    },
  };
}

export async function createLeaveRequest({ actorUserId, payload, request }) {
  const actor = await getActor(actorUserId);
  const startDate = payload.startDate;
  const endDate = payload.endDate;
  const startDayPortion = payload.startDayPortion || LEAVE_DAY_PORTIONS.FULL;
  const endDayPortion = payload.endDayPortion || startDayPortion;

  assertSickLeaveFullDayOnly({
    leaveType: payload.leaveType,
    dayPortion: startDayPortion,
  });

  ensureDateRange({ startDate, endDate });

  const transaction = await sequelize.transaction();

  try {
    await ensureNoOverlap({
      employeeId: actor.id,
      startDate,
      endDate,
      transaction,
    });

    const publicHolidaySet = await getPublicHolidaySet(startDate, endDate, transaction);
    const durationDays = calculateBusinessLeaveDuration({
      startDate,
      endDate,
      startDayPortion,
      endDayPortion,
      publicHolidaySet,
    });
    const usage = await calculateApprovedLeaveUsed({
      employeeId: actor.id,
      leaveType: payload.leaveType,
      transaction,
    });

    assertLeaveRequestWithinBalance({
      leaveType: payload.leaveType,
      requestedDurationDays: durationDays,
      leaveQuota:
        payload.leaveType === LEAVE_TYPES.SICK ? actor.sickLeaveQuota : actor.annualLeaveQuota,
      usedLeaveDays: usage.usedDays,
    });

    const leaveRequest = await LeaveRequestModel.create(
      {
        employeeId: actor.id,
        leaveType: payload.leaveType,
        startDate,
        endDate,
        startDayPortion,
        endDayPortion,
        durationDays,
        reason: payload.reason || null,
        status: LEAVE_REQUEST_STATUSES.PENDING,
      },
      { transaction },
    );

    const createdLeaveRequest = await LeaveRequestModel.findByPk(leaveRequest.id, {
      include: getLeaveRequestInclude(),
      transaction,
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        targetUserId: actor.id,
        action: AUDIT_ACTIONS.LEAVE_REQUEST_CREATED,
        metadata: {
          leaveRequestId: leaveRequest.id,
          leaveType: leaveRequest.leaveType,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          durationDays,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return serializeLeaveRequest(createdLeaveRequest);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listMyLeaveRequests(actorUserId) {
  const leaveRequests = await LeaveRequestModel.findAll({
    where: { employeeId: actorUserId },
    include: getLeaveRequestInclude(),
    order: [
      ['created_at', 'DESC'],
      ['start_date', 'DESC'],
    ],
  });

  return {
    items: leaveRequests.map(serializeLeaveRequest),
    total: leaveRequests.length,
    balance: await getMyLeaveBalance(actorUserId),
  };
}

export async function listPendingApprovals(actorUserId) {
  const actor = await getActor(actorUserId);
  const where = { status: LEAVE_REQUEST_STATUSES.PENDING };
  const include = getLeaveRequestInclude();

  if (actor.role === ROLES.MANAGER) {
    include[0] = {
      ...include[0],
      where: { managerUserId: actor.id },
      required: true,
    };
  } else if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only managers or administrators can view pending approvals', 'FORBIDDEN');
  }

  const leaveRequests = await LeaveRequestModel.findAll({
    where,
    include,
    order: [
      ['created_at', 'ASC'],
      ['start_date', 'ASC'],
    ],
  });

  return {
    items: leaveRequests.map(serializeLeaveRequest),
    total: leaveRequests.length,
  };
}

export async function listAllLeaveRequests(actorUserId, filters = {}) {
  const actor = await getActor(actorUserId);

  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can view all leave requests', 'FORBIDDEN');
  }

  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.leaveType) {
    where.leaveType = filters.leaveType;
  }

  const leaveRequests = await LeaveRequestModel.findAll({
    where,
    include: getLeaveRequestInclude(),
    order: [
      ['created_at', 'DESC'],
      ['start_date', 'DESC'],
    ],
  });

  return {
    items: leaveRequests.map(serializeLeaveRequest),
    total: leaveRequests.length,
  };
}

async function ensureLeaveBalanceAvailable({ leaveRequest, transaction }) {
  const employee = await UserModel.findByPk(leaveRequest.employeeId, {
    attributes: ['id', 'annualLeaveQuota', 'sickLeaveQuota'],
    transaction,
  });
  const balance = await calculateApprovedLeaveUsed({
    employeeId: leaveRequest.employeeId,
    leaveType: leaveRequest.leaveType,
    transaction,
  });

  assertLeaveRequestWithinBalance({
    leaveType: leaveRequest.leaveType,
    requestedDurationDays: leaveRequest.durationDays,
    leaveQuota:
      leaveRequest.leaveType === LEAVE_TYPES.SICK ? employee.sickLeaveQuota : employee.annualLeaveQuota,
    usedLeaveDays: balance.usedDays,
    errorMessage:
      leaveRequest.leaveType === LEAVE_TYPES.SICK
        ? 'Employee does not have enough sick leave balance for this approval'
        : 'Employee does not have enough annual leave balance for this approval',
  });
}

export async function approveLeaveRequest({ actorUserId, leaveRequestId, decisionComment, request }) {
  const actor = await getActor(actorUserId);
  const transaction = await sequelize.transaction();

  try {
    const leaveRequest = await getLeaveRequestForDecision(leaveRequestId, transaction);

    ensureDecisionAllowed({ actor, leaveRequest });
    await ensureLeaveBalanceAvailable({ leaveRequest, transaction });

    await leaveRequest.update(
      {
        status: LEAVE_REQUEST_STATUSES.APPROVED,
        approverId: actor.id,
        decidedAt: new Date(),
        decisionComment: decisionComment || null,
      },
      { transaction },
    );

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        targetUserId: leaveRequest.employeeId,
        action: AUDIT_ACTIONS.LEAVE_REQUEST_APPROVED,
        metadata: {
          leaveRequestId: leaveRequest.id,
          leaveType: leaveRequest.leaveType,
          durationDays: Number(leaveRequest.durationDays),
        },
      }),
      { transaction },
    );

    const updatedLeaveRequest = await LeaveRequestModel.findByPk(leaveRequest.id, {
      include: getLeaveRequestInclude(),
      transaction,
    });

    await transaction.commit();

    return serializeLeaveRequest(updatedLeaveRequest);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function rejectLeaveRequest({ actorUserId, leaveRequestId, decisionComment, request }) {
  const actor = await getActor(actorUserId);
  const transaction = await sequelize.transaction();

  try {
    const leaveRequest = await getLeaveRequestForDecision(leaveRequestId, transaction);

    ensureDecisionAllowed({ actor, leaveRequest });

    await leaveRequest.update(
      {
        status: LEAVE_REQUEST_STATUSES.REJECTED,
        approverId: actor.id,
        decidedAt: new Date(),
        decisionComment: decisionComment || null,
      },
      { transaction },
    );

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        targetUserId: leaveRequest.employeeId,
        action: AUDIT_ACTIONS.LEAVE_REQUEST_REJECTED,
        metadata: {
          leaveRequestId: leaveRequest.id,
          leaveType: leaveRequest.leaveType,
        },
      }),
      { transaction },
    );

    const updatedLeaveRequest = await LeaveRequestModel.findByPk(leaveRequest.id, {
      include: getLeaveRequestInclude(),
      transaction,
    });

    await transaction.commit();

    return serializeLeaveRequest(updatedLeaveRequest);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listPublicHolidays() {
  const holidays = await PublicHolidayModel.findAll({
    order: [['holiday_date', 'ASC']],
  });

  return {
    items: holidays.map(serializePublicHoliday),
    total: holidays.length,
  };
}

export async function createPublicHoliday({ actorUserId, payload, request }) {
  const actor = await getActor(actorUserId);

  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can manage public holidays', 'FORBIDDEN');
  }

  try {
    const holiday = await PublicHolidayModel.create({
      name: payload.name,
      holidayDate: payload.holidayDate,
      createdByUserId: actor.id,
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.PUBLIC_HOLIDAY_CREATED,
        metadata: {
          publicHolidayId: holiday.id,
          holidayDate: holiday.holidayDate,
          name: holiday.name,
        },
      }),
    );

    return serializePublicHoliday(holiday);
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      throw new ApiError(409, 'A public holiday already exists for this date', 'DUPLICATE_PUBLIC_HOLIDAY');
    }

    throw error;
  }
}

export async function deletePublicHoliday({ actorUserId, holidayId, request }) {
  const actor = await getActor(actorUserId);

  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can manage public holidays', 'FORBIDDEN');
  }

  const holiday = await PublicHolidayModel.findByPk(holidayId);

  if (!holiday) {
    throw new ApiError(404, 'Public holiday not found', 'PUBLIC_HOLIDAY_NOT_FOUND');
  }

  await holiday.destroy();

  await writeAuditLog(
    buildAuditPayload(request, {
      actorUserId: actor.id,
      action: AUDIT_ACTIONS.PUBLIC_HOLIDAY_DELETED,
      metadata: {
        publicHolidayId: holiday.id,
        holidayDate: holiday.holidayDate,
        name: holiday.name,
      },
    }),
  );
}
