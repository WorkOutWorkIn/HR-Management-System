import { Op } from 'sequelize';
import {
  PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH,
  PERFORMANCE_REVIEW_RATING_MAX,
  PERFORMANCE_REVIEW_RATING_MIN,
  REVIEW_PERIOD_STATUSES,
  ROLES,
} from '@hrms/shared';
import { sequelize } from '../../config/db.js';
import { buildAuditPayload, writeAuditLog } from '../../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import {
  PerformanceReviewModel,
  ReviewPeriodModel,
  UserModel,
} from '../../database/models/index.js';
import { ApiError } from '../../utils/ApiError.js';

const REVIEW_USER_ATTRIBUTES = [
  'id',
  'fullName',
  'workEmail',
  'role',
  'managerUserId',
  'department',
  'jobTitle',
];

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeOptionalText(value) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function serializeUser(user) {
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

function serializeReviewPeriod(reviewPeriod, overrides = {}) {
  const rawReviewCount =
    overrides.reviewCount ?? reviewPeriod.getDataValue?.('reviewCount') ?? 0;

  return {
    id: reviewPeriod.id,
    name: reviewPeriod.name,
    startDate: reviewPeriod.startDate,
    endDate: reviewPeriod.endDate,
    status: reviewPeriod.status,
    description: reviewPeriod.description,
    createdByUserId: reviewPeriod.createdByUserId,
    createdBy: serializeUser(reviewPeriod.createdByUser),
    reviewCount: Number(rawReviewCount || 0),
    createdAt: reviewPeriod.createdAt,
    updatedAt: reviewPeriod.updatedAt,
  };
}

function serializePerformanceReview(review) {
  return {
    id: review.id,
    employeeId: review.employeeId,
    reviewerId: review.reviewerId,
    reviewPeriodId: review.reviewPeriodId,
    rating: Number(review.rating),
    comment: review.comment,
    submittedAt: review.submittedAt,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    employee: serializeUser(review.employee),
    reviewer: serializeUser(review.reviewer),
    reviewPeriod: review.reviewPeriod ? serializeReviewPeriod(review.reviewPeriod) : null,
  };
}

function getReviewPeriodInclude() {
  return [
    {
      model: UserModel,
      as: 'createdByUser',
      attributes: REVIEW_USER_ATTRIBUTES,
    },
  ];
}

function getPerformanceReviewInclude() {
  return [
    {
      model: UserModel,
      as: 'employee',
      attributes: REVIEW_USER_ATTRIBUTES,
    },
    {
      model: UserModel,
      as: 'reviewer',
      attributes: REVIEW_USER_ATTRIBUTES,
    },
    {
      model: ReviewPeriodModel,
      as: 'reviewPeriod',
      include: getReviewPeriodInclude(),
    },
  ];
}

async function getActorOrThrow(actorUserId, transaction) {
  const actor = await UserModel.findByPk(actorUserId, {
    transaction,
    attributes: REVIEW_USER_ATTRIBUTES,
  });

  if (!actor) {
    throw new ApiError(401, 'Authenticated user was not found', 'ACTOR_NOT_FOUND');
  }

  return actor;
}

async function getEmployeeOrThrow(employeeId, transaction) {
  const employee = await UserModel.findByPk(employeeId, {
    transaction,
    attributes: REVIEW_USER_ATTRIBUTES,
  });

  if (!employee) {
    throw new ApiError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
  }

  return employee;
}

async function getReviewPeriodOrThrow(reviewPeriodId, options = {}) {
  const { transaction, lock = false } = options;
  const reviewPeriod = await ReviewPeriodModel.findByPk(reviewPeriodId, {
    transaction,
    include: getReviewPeriodInclude(),
    ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!reviewPeriod) {
    throw new ApiError(404, 'Review period not found', 'REVIEW_PERIOD_NOT_FOUND');
  }

  return reviewPeriod;
}

async function getPerformanceReviewOrThrow(reviewId, options = {}) {
  const { transaction, lock = false } = options;
  const review = await PerformanceReviewModel.findByPk(reviewId, {
    transaction,
    include: getPerformanceReviewInclude(),
    ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!review) {
    throw new ApiError(404, 'Performance review not found', 'PERFORMANCE_REVIEW_NOT_FOUND');
  }

  return review;
}

function ensureAdmin(actor) {
  if (actor.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only administrators can manage review periods', 'FORBIDDEN');
  }
}

function ensureManager(actor) {
  if (actor.role !== ROLES.MANAGER) {
    throw new ApiError(403, 'Only managers can submit performance reviews', 'FORBIDDEN');
  }
}

function ensureValidDateRange(startDate, endDate) {
  if (endDate < startDate) {
    throw new ApiError(400, 'End date cannot be before start date', 'INVALID_REVIEW_PERIOD_RANGE');
  }
}

async function ensureReviewPeriodNameAvailable({ name, excludeId, transaction }) {
  const where = { name };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const existingPeriod = await ReviewPeriodModel.findOne({
    where,
    transaction,
  });

  if (existingPeriod) {
    throw new ApiError(409, 'Review period name already exists', 'REVIEW_PERIOD_NAME_CONFLICT');
  }
}

async function ensureNoOverlappingReviewPeriods({ startDate, endDate, excludeId, transaction }) {
  const where = {
    startDate: {
      [Op.lte]: endDate,
    },
    endDate: {
      [Op.gte]: startDate,
    },
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const overlap = await ReviewPeriodModel.findOne({
    where,
    transaction,
  });

  if (overlap) {
    throw new ApiError(
      409,
      'Review period overlaps an existing review period',
      'REVIEW_PERIOD_OVERLAP',
    );
  }
}

async function ensureNoOtherOpenReviewPeriod({ excludeId, transaction }) {
  const where = {
    status: REVIEW_PERIOD_STATUSES.OPEN,
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const openPeriod = await ReviewPeriodModel.findOne({
    where,
    transaction,
  });

  if (openPeriod) {
    throw new ApiError(
      409,
      `Existing review period "${openPeriod.name}" is active. You can only have one review period open at a time.`,
      'OPEN_REVIEW_PERIOD_EXISTS',
    );
  }
}

async function getReviewCountByPeriodIds(reviewPeriodIds) {
  if (!reviewPeriodIds.length) {
    return new Map();
  }

  const rows = await PerformanceReviewModel.findAll({
    attributes: [
      'reviewPeriodId',
      [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
    ],
    where: {
      reviewPeriodId: {
        [Op.in]: reviewPeriodIds,
      },
    },
    group: ['reviewPeriodId'],
    raw: true,
  });

  return new Map(
    rows.map((row) => [row.reviewPeriodId, Number(row.reviewCount || 0)]),
  );
}

async function countReviewsForPeriod(reviewPeriodId, transaction) {
  return PerformanceReviewModel.count({
    where: { reviewPeriodId },
    transaction,
  });
}

function getReviewPeriodSubmissionState(reviewPeriod, referenceDate = getTodayDateString()) {
  if (!reviewPeriod) {
    return {
      canSubmit: false,
      reason: 'No review period is available.',
    };
  }

  if (reviewPeriod.status !== REVIEW_PERIOD_STATUSES.OPEN) {
    return {
      canSubmit: false,
      reason: 'Review period is closed.',
    };
  }

  if (referenceDate < reviewPeriod.startDate) {
    return {
      canSubmit: false,
      reason: 'Review period has not started yet.',
    };
  }

  if (referenceDate > reviewPeriod.endDate) {
    return {
      canSubmit: false,
      reason: 'Review period has already ended.',
    };
  }

  return {
    canSubmit: true,
    reason: null,
  };
}

function ensureEmployeeReviewAccess({ actor, employee }) {
  if (actor.role === ROLES.ADMIN || actor.id === employee.id) {
    return;
  }

  if (actor.role === ROLES.MANAGER && employee.managerUserId === actor.id) {
    return;
  }

  throw new ApiError(
    403,
    'You do not have access to this employee performance history',
    'FORBIDDEN',
  );
}

function ensureManagerCanReviewEmployee({ actor, employee }) {
  ensureManager(actor);

  if (employee.id === actor.id) {
    throw new ApiError(403, 'Managers cannot review themselves', 'SELF_PERFORMANCE_REVIEW');
  }

  if (employee.managerUserId !== actor.id) {
    throw new ApiError(
      403,
      'Managers can only review their current direct reports',
      'NOT_DIRECT_REPORT',
    );
  }
}

function ensureManagerCanUpdateReview({ actor, employee, review }) {
  ensureManagerCanReviewEmployee({ actor, employee });

  if (review.reviewerId !== actor.id) {
    throw new ApiError(
      403,
      'Managers can only update reviews they originally submitted',
      'REVIEW_AUTHOR_MISMATCH',
    );
  }
}

function normalizeReviewPayload(payload = {}) {
  return {
    rating: Number(payload.rating),
    comment: normalizeOptionalText(payload.comment),
  };
}

function mapReviewConflictError(error) {
  if (error?.name !== 'SequelizeUniqueConstraintError') {
    return error;
  }

  return new ApiError(
    409,
    'Only one performance review is allowed per employee per review period',
    'PERFORMANCE_REVIEW_ALREADY_EXISTS',
  );
}

export async function createReviewPeriod({ actorUserId, payload, request }) {
  const actor = await getActorOrThrow(actorUserId);
  ensureAdmin(actor);

  const name = payload.name.trim();
  const description = normalizeOptionalText(payload.description);
  const startDate = payload.startDate;
  const endDate = payload.endDate;

  ensureValidDateRange(startDate, endDate);

  const transaction = await sequelize.transaction();

  try {
    await ensureReviewPeriodNameAvailable({ name, transaction });
    await ensureNoOverlappingReviewPeriods({ startDate, endDate, transaction });

    const reviewPeriod = await ReviewPeriodModel.create(
      {
        name,
        description,
        startDate,
        endDate,
        status: REVIEW_PERIOD_STATUSES.CLOSED,
        createdByUserId: actor.id,
      },
      { transaction },
    );

    const createdReviewPeriod = await getReviewPeriodOrThrow(reviewPeriod.id, { transaction });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.REVIEW_PERIOD_CREATED,
        metadata: {
          reviewPeriodId: reviewPeriod.id,
          name,
          startDate,
          endDate,
          status: reviewPeriod.status,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return serializeReviewPeriod(createdReviewPeriod);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listReviewPeriods({ actorUserId, filters = {} }) {
  await getActorOrThrow(actorUserId);

  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  const reviewPeriods = await ReviewPeriodModel.findAll({
    where,
    include: getReviewPeriodInclude(),
    order: [
      ['start_date', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  const reviewCounts = await getReviewCountByPeriodIds(reviewPeriods.map((period) => period.id));

  return {
    items: reviewPeriods.map((reviewPeriod) =>
      serializeReviewPeriod(reviewPeriod, {
        reviewCount: reviewCounts.get(reviewPeriod.id) || 0,
      }),
    ),
    total: reviewPeriods.length,
    openPeriodId:
      reviewPeriods.find((reviewPeriod) => reviewPeriod.status === REVIEW_PERIOD_STATUSES.OPEN)?.id ||
      null,
  };
}

export async function updateReviewPeriod({ actorUserId, reviewPeriodId, payload, request }) {
  const actor = await getActorOrThrow(actorUserId);
  ensureAdmin(actor);

  const transaction = await sequelize.transaction();

  try {
    const reviewPeriod = await getReviewPeriodOrThrow(reviewPeriodId, {
      transaction,
      lock: true,
    });

    if (reviewPeriod.status !== REVIEW_PERIOD_STATUSES.CLOSED) {
      throw new ApiError(
        400,
        'Only CLOSED review periods can be edited',
        'REVIEW_PERIOD_EDIT_NOT_ALLOWED',
      );
    }

    const reviewCount = await countReviewsForPeriod(reviewPeriod.id, transaction);

    if (reviewCount > 0) {
      throw new ApiError(
        400,
        'Review periods cannot be edited after reviews have been submitted',
        'REVIEW_PERIOD_HAS_REVIEWS',
      );
    }

    const previousState = {
      name: reviewPeriod.name,
      startDate: reviewPeriod.startDate,
      endDate: reviewPeriod.endDate,
      description: reviewPeriod.description,
    };

    const nextName = payload.name ? payload.name.trim() : reviewPeriod.name;
    const nextDescription =
      payload.description !== undefined
        ? normalizeOptionalText(payload.description)
        : reviewPeriod.description;
    const nextStartDate = payload.startDate || reviewPeriod.startDate;
    const nextEndDate = payload.endDate || reviewPeriod.endDate;

    ensureValidDateRange(nextStartDate, nextEndDate);

    await ensureReviewPeriodNameAvailable({
      name: nextName,
      excludeId: reviewPeriod.id,
      transaction,
    });
    await ensureNoOverlappingReviewPeriods({
      startDate: nextStartDate,
      endDate: nextEndDate,
      excludeId: reviewPeriod.id,
      transaction,
    });

    await reviewPeriod.update(
      {
        name: nextName,
        description: nextDescription,
        startDate: nextStartDate,
        endDate: nextEndDate,
      },
      { transaction },
    );

    const updatedReviewPeriod = await getReviewPeriodOrThrow(reviewPeriod.id, {
      transaction,
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.REVIEW_PERIOD_UPDATED,
        metadata: {
          reviewPeriodId: reviewPeriod.id,
          previous: previousState,
          next: {
            name: nextName,
            startDate: nextStartDate,
            endDate: nextEndDate,
            description: nextDescription,
          },
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return serializeReviewPeriod(updatedReviewPeriod);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function openReviewPeriod({ actorUserId, reviewPeriodId, request }) {
  const actor = await getActorOrThrow(actorUserId);
  ensureAdmin(actor);

  const transaction = await sequelize.transaction();

  try {
    const reviewPeriod = await getReviewPeriodOrThrow(reviewPeriodId, {
      transaction,
      lock: true,
    });

    if (reviewPeriod.status === REVIEW_PERIOD_STATUSES.OPEN) {
      throw new ApiError(400, 'Review period is already OPEN', 'REVIEW_PERIOD_ALREADY_OPEN');
    }

    await ensureNoOtherOpenReviewPeriod({
      excludeId: reviewPeriod.id,
      transaction,
    });

    await reviewPeriod.update(
      {
        status: REVIEW_PERIOD_STATUSES.OPEN,
      },
      { transaction },
    );

    const updatedReviewPeriod = await getReviewPeriodOrThrow(reviewPeriod.id, {
      transaction,
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.REVIEW_PERIOD_OPENED,
        metadata: {
          reviewPeriodId: reviewPeriod.id,
          name: reviewPeriod.name,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return serializeReviewPeriod(updatedReviewPeriod, {
      reviewCount: await countReviewsForPeriod(updatedReviewPeriod.id),
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function closeReviewPeriod({ actorUserId, reviewPeriodId, request }) {
  const actor = await getActorOrThrow(actorUserId);
  ensureAdmin(actor);

  const transaction = await sequelize.transaction();

  try {
    const reviewPeriod = await getReviewPeriodOrThrow(reviewPeriodId, {
      transaction,
      lock: true,
    });

    if (reviewPeriod.status !== REVIEW_PERIOD_STATUSES.OPEN) {
      throw new ApiError(400, 'Review period is already CLOSED', 'REVIEW_PERIOD_ALREADY_CLOSED');
    }

    await reviewPeriod.update(
      {
        status: REVIEW_PERIOD_STATUSES.CLOSED,
      },
      { transaction },
    );

    const updatedReviewPeriod = await getReviewPeriodOrThrow(reviewPeriod.id, {
      transaction,
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        action: AUDIT_ACTIONS.REVIEW_PERIOD_CLOSED,
        metadata: {
          reviewPeriodId: reviewPeriod.id,
          name: reviewPeriod.name,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return serializeReviewPeriod(updatedReviewPeriod, {
      reviewCount: await countReviewsForPeriod(updatedReviewPeriod.id),
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function createPerformanceReview({ actorUserId, payload, request }) {
  const actor = await getActorOrThrow(actorUserId);
  ensureManager(actor);

  const transaction = await sequelize.transaction();

  try {
    const employee = await getEmployeeOrThrow(payload.employeeId, transaction);
    const reviewPeriod = await getReviewPeriodOrThrow(payload.reviewPeriodId, {
      transaction,
      lock: true,
    });

    ensureManagerCanReviewEmployee({ actor, employee });

    const submissionState = getReviewPeriodSubmissionState(reviewPeriod);

    if (!submissionState.canSubmit) {
      throw new ApiError(400, submissionState.reason, 'REVIEW_PERIOD_NOT_ACCEPTING_SUBMISSIONS');
    }

    const normalizedPayload = normalizeReviewPayload(payload);

    const performanceReview = await PerformanceReviewModel.create(
      {
        employeeId: employee.id,
        reviewerId: actor.id,
        reviewPeriodId: reviewPeriod.id,
        rating: normalizedPayload.rating,
        comment: normalizedPayload.comment,
        submittedAt: new Date(),
      },
      { transaction },
    );

    const createdReview = await getPerformanceReviewOrThrow(performanceReview.id, {
      transaction,
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        targetUserId: employee.id,
        action: AUDIT_ACTIONS.PERFORMANCE_REVIEW_CREATED,
        metadata: {
          performanceReviewId: performanceReview.id,
          reviewPeriodId: reviewPeriod.id,
          reviewerId: actor.id,
          employeeId: employee.id,
          rating: normalizedPayload.rating,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return serializePerformanceReview(createdReview);
  } catch (error) {
    await transaction.rollback();
    throw mapReviewConflictError(error);
  }
}

export async function updatePerformanceReview({ actorUserId, reviewId, payload, request }) {
  const actor = await getActorOrThrow(actorUserId);
  ensureManager(actor);

  const transaction = await sequelize.transaction();

  try {
    const review = await getPerformanceReviewOrThrow(reviewId, {
      transaction,
      lock: true,
    });

    ensureManagerCanUpdateReview({
      actor,
      employee: review.employee,
      review,
    });

    const submissionState = getReviewPeriodSubmissionState(review.reviewPeriod);

    if (!submissionState.canSubmit) {
      throw new ApiError(400, submissionState.reason, 'REVIEW_PERIOD_NOT_ACCEPTING_SUBMISSIONS');
    }

    const previousRating = Number(review.rating);
    const normalizedPayload = normalizeReviewPayload(payload);

    await review.update(
      {
        rating: normalizedPayload.rating,
        comment: normalizedPayload.comment,
      },
      { transaction },
    );

    const updatedReview = await getPerformanceReviewOrThrow(review.id, {
      transaction,
    });

    await writeAuditLog(
      buildAuditPayload(request, {
        actorUserId: actor.id,
        targetUserId: review.employeeId,
        action: AUDIT_ACTIONS.PERFORMANCE_REVIEW_UPDATED,
        metadata: {
          performanceReviewId: review.id,
          reviewPeriodId: review.reviewPeriodId,
          previousRating,
          nextRating: normalizedPayload.rating,
        },
      }),
      { transaction },
    );

    await transaction.commit();

    return serializePerformanceReview(updatedReview);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function listMyPerformanceReviews(actorUserId) {
  const actor = await getActorOrThrow(actorUserId);

  const reviews = await PerformanceReviewModel.findAll({
    where: {
      employeeId: actor.id,
    },
    include: getPerformanceReviewInclude(),
    order: [
      ['submitted_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  return {
    items: reviews.map(serializePerformanceReview),
    total: reviews.length,
  };
}

export async function listEmployeePerformanceReviews({ actorUserId, employeeId }) {
  const actor = await getActorOrThrow(actorUserId);
  const employee = await getEmployeeOrThrow(employeeId);

  ensureEmployeeReviewAccess({ actor, employee });

  const reviews = await PerformanceReviewModel.findAll({
    where: {
      employeeId,
    },
    include: getPerformanceReviewInclude(),
    order: [
      ['submitted_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  return {
    employee: serializeUser(employee),
    items: reviews.map(serializePerformanceReview),
    total: reviews.length,
  };
}

export async function listDirectReportReviewAssignments({ actorUserId, reviewPeriodId }) {
  const actor = await getActorOrThrow(actorUserId);

  if (![ROLES.MANAGER, ROLES.ADMIN].includes(actor.role)) {
    throw new ApiError(
      403,
      'Only managers or administrators can view direct-report review assignments',
      'FORBIDDEN',
    );
  }

  const directReports = await UserModel.findAll({
    where: {
      managerUserId: actor.id,
    },
    attributes: REVIEW_USER_ATTRIBUTES,
    order: [['full_name', 'ASC']],
  });

  let reviewPeriod = null;

  if (reviewPeriodId) {
    reviewPeriod = await getReviewPeriodOrThrow(reviewPeriodId);
  } else {
    reviewPeriod = await ReviewPeriodModel.findOne({
      where: {
        status: REVIEW_PERIOD_STATUSES.OPEN,
      },
      include: getReviewPeriodInclude(),
      order: [['start_date', 'DESC']],
    });
  }

  const reviews = reviewPeriod
    ? await PerformanceReviewModel.findAll({
        where: {
          reviewPeriodId: reviewPeriod.id,
          employeeId: {
            [Op.in]: directReports.map((employee) => employee.id),
          },
        },
        include: getPerformanceReviewInclude(),
        order: [['submitted_at', 'DESC']],
      })
    : [];

  const reviewsByEmployeeId = new Map(reviews.map((review) => [review.employeeId, review]));
  const submissionState = getReviewPeriodSubmissionState(reviewPeriod);

  return {
    manager: serializeUser(actor),
    reviewPeriod: reviewPeriod
      ? serializeReviewPeriod(reviewPeriod, {
          reviewCount: await countReviewsForPeriod(reviewPeriod.id),
        })
      : null,
    items: directReports.map((employee) => {
      const existingReview = reviewsByEmployeeId.get(employee.id) || null;
      let canReview = Boolean(reviewPeriod) && submissionState.canSubmit && !existingReview;
      let lockReason = null;

      if (!reviewPeriod) {
        canReview = false;
        lockReason = 'No review period is available.';
      } else if (!submissionState.canSubmit) {
        canReview = false;
        lockReason = submissionState.reason;
      } else if (existingReview) {
        canReview = false;
        lockReason =
          existingReview.reviewerId === actor.id
            ? 'You already submitted a review for this employee in the selected period.'
            : 'A performance review already exists for this employee in the selected period.';
      }

      return {
        employee: serializeUser(employee),
        canReview,
        lockReason,
        existingReview: existingReview ? serializePerformanceReview(existingReview) : null,
      };
    }),
    total: directReports.length,
  };
}

export async function listPerformanceReviews({ actorUserId, filters = {} }) {
  const actor = await getActorOrThrow(actorUserId);
  ensureAdmin(actor);

  const where = {};

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  if (filters.reviewPeriodId) {
    where.reviewPeriodId = filters.reviewPeriodId;
  }

  if (filters.reviewerId) {
    where.reviewerId = filters.reviewerId;
  }

  const reviews = await PerformanceReviewModel.findAll({
    where,
    include: getPerformanceReviewInclude(),
    order: [
      ['submitted_at', 'DESC'],
      ['created_at', 'DESC'],
    ],
  });

  return {
    items: reviews.map(serializePerformanceReview),
    total: reviews.length,
  };
}

export async function getPerformanceReviewById({ actorUserId, reviewId }) {
  const actor = await getActorOrThrow(actorUserId);
  const review = await getPerformanceReviewOrThrow(reviewId);

  ensureEmployeeReviewAccess({ actor, employee: review.employee });

  return serializePerformanceReview(review);
}

export function getPerformanceValidationConfig() {
  return {
    ratingMin: PERFORMANCE_REVIEW_RATING_MIN,
    ratingMax: PERFORMANCE_REVIEW_RATING_MAX,
    commentMaxLength: PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH,
  };
}
