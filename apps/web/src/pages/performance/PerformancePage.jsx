import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader, Chip } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH,
  PERFORMANCE_REVIEW_RATING_MAX,
  PERFORMANCE_REVIEW_RATING_MIN,
  REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH,
  REVIEW_PERIOD_NAME_MAX_LENGTH,
  REVIEW_PERIOD_STATUSES,
  ROLES,
} from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PageLoader } from '@/components/common/PageLoader';
import {
  Description,
  FieldError,
  Input,
  Label,
  TextArea,
  TextField,
} from '@/components/forms/TextField';
import { useAuth } from '@/hooks/useAuth';
import {
  closeReviewPeriod,
  createPerformanceReview,
  createReviewPeriod,
  listDirectReportReviewAssignments,
  listEmployeePerformanceReviews,
  listMyPerformanceReviews,
  listPerformanceReviews,
  listReviewPeriods,
  openReviewPeriod,
  updatePerformanceReview,
  updateReviewPeriod,
} from '@/services/performance/performance.api';

const reviewPeriodSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Review period name is required')
      .max(
        REVIEW_PERIOD_NAME_MAX_LENGTH,
        `Review period name must be ${REVIEW_PERIOD_NAME_MAX_LENGTH} characters or fewer`,
      ),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    description: z
      .string()
      .max(
        REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH,
        `Description must be ${REVIEW_PERIOD_DESCRIPTION_MAX_LENGTH} characters or fewer`,
      )
      .optional()
      .or(z.literal('')),
  })
  .refine((values) => values.endDate >= values.startDate, {
    path: ['endDate'],
    message: 'End date cannot be before start date',
  });

const performanceReviewSchema = z.object({
  employeeId: z.string().uuid('Select a valid direct report'),
  reviewPeriodId: z.string().uuid('Select a valid review period'),
  rating: z
    .string()
    .min(1, 'Rating is required')
    .refine((value) => {
      const numericRating = Number(value);
      return (
        Number.isInteger(numericRating) &&
        numericRating >= PERFORMANCE_REVIEW_RATING_MIN &&
        numericRating <= PERFORMANCE_REVIEW_RATING_MAX
      );
    }, `Rating must be between ${PERFORMANCE_REVIEW_RATING_MIN} and ${PERFORMANCE_REVIEW_RATING_MAX}`),
  comment: z
    .string()
    .max(
      PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH,
      `Comment must be ${PERFORMANCE_REVIEW_COMMENT_MAX_LENGTH} characters or fewer`,
    )
    .optional()
    .or(z.literal('')),
});

const dateFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function getPeriodChipColor(status) {
  return status === REVIEW_PERIOD_STATUSES.OPEN ? 'success' : 'default';
}

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return dateFormatter.format(new Date(value));
}

function formatDateTime(value) {
  if (!value) {
    return 'N/A';
  }

  return dateTimeFormatter.format(new Date(value));
}

function extractErrorMessage(error, fallbackMessage) {
  const details = error?.response?.data?.details?.errors;

  if (Array.isArray(details) && details[0]?.message) {
    return details[0].message;
  }

  return error?.response?.data?.message || fallbackMessage;
}

function isReviewWindowOpen(reviewPeriod) {
  if (!reviewPeriod || reviewPeriod.status !== REVIEW_PERIOD_STATUSES.OPEN) {
    return false;
  }

  const today = new Date().toISOString().slice(0, 10);
  return today >= reviewPeriod.startDate && today <= reviewPeriod.endDate;
}

function getReviewWindowMessage(reviewPeriod) {
  if (!reviewPeriod) {
    return 'No review period is available.';
  }

  if (reviewPeriod.status !== REVIEW_PERIOD_STATUSES.OPEN) {
    return 'This review period is closed.';
  }

  const today = new Date().toISOString().slice(0, 10);

  if (today < reviewPeriod.startDate) {
    return 'This review period has not started yet.';
  }

  if (today > reviewPeriod.endDate) {
    return 'This review period has already ended.';
  }

  return null;
}

function ReviewSummaryCard({ review }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-slate-950/55 p-5 shadow-[0_18px_45px_rgba(2,12,27,0.24)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-white">
              {review.reviewPeriod?.name || 'Review period'}
            </span>
            <Chip color="primary" size="sm" variant="flat">
              Rating {review.rating} / {PERFORMANCE_REVIEW_RATING_MAX}
            </Chip>
          </div>
          {review.employee ? (
            <p className="text-sm text-slate-300">
              Employee: {review.employee.fullName} ({review.employee.workEmail})
            </p>
          ) : null}
          {review.reviewer ? (
            <p className="text-sm text-slate-300">
              Reviewer: {review.reviewer.fullName} ({review.reviewer.role})
            </p>
          ) : null}
          {review.comment ? (
            <p className="text-sm leading-relaxed text-slate-300">{review.comment}</p>
          ) : (
            <p className="text-sm text-slate-500">No comment was added to this review.</p>
          )}
        </div>
        <div className="space-y-1 text-sm text-slate-400 md:text-right">
          <p>Submitted: {formatDateTime(review.submittedAt || review.createdAt)}</p>
          <p>Updated: {formatDateTime(review.updatedAt)}</p>
          {review.reviewPeriod ? (
            <p>
              Window: {formatDate(review.reviewPeriod.startDate)} to{' '}
              {formatDate(review.reviewPeriod.endDate)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReviewPeriodCard({
  reviewPeriod,
  onEdit,
  onOpen,
  onClose,
  isBusy = false,
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-slate-950/55 p-5 shadow-[0_18px_45px_rgba(2,12,27,0.24)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-white">{reviewPeriod.name}</h3>
            <Chip color={getPeriodChipColor(reviewPeriod.status)} size="sm" variant="flat">
              {reviewPeriod.status}
            </Chip>
            <Chip color="default" size="sm" variant="flat">
              {reviewPeriod.reviewCount} review{reviewPeriod.reviewCount === 1 ? '' : 's'}
            </Chip>
          </div>
          <p className="text-sm text-slate-300">
            {formatDate(reviewPeriod.startDate)} to {formatDate(reviewPeriod.endDate)}
          </p>
          {reviewPeriod.description ? (
            <p className="text-sm text-slate-400">{reviewPeriod.description}</p>
          ) : (
            <p className="text-sm text-slate-500">No description was added.</p>
          )}
          {reviewPeriod.createdBy ? (
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Created by {reviewPeriod.createdBy.fullName}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            color="default"
            isDisabled={isBusy || reviewPeriod.reviewCount > 0 || reviewPeriod.status === REVIEW_PERIOD_STATUSES.OPEN}
            radius="lg"
            variant="bordered"
            onPress={() => onEdit(reviewPeriod)}
          >
            Edit
          </Button>
          {reviewPeriod.status === REVIEW_PERIOD_STATUSES.OPEN ? (
            <Button
              color="warning"
              isDisabled={isBusy}
              radius="lg"
              variant="flat"
              onPress={() => onClose(reviewPeriod.id)}
            >
              Close period
            </Button>
          ) : (
            <Button
              color="primary"
              isDisabled={isBusy}
              radius="lg"
              onPress={() => onOpen(reviewPeriod.id)}
            >
              Open period
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DirectReportSelector({ items, selectedEmployeeId, onSelect }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <button
          key={item.employee.id}
          className={[
            'rounded-3xl border p-4 text-left transition',
            selectedEmployeeId === item.employee.id
              ? 'border-cyan-400/35 bg-cyan-500/10'
              : 'border-white/8 bg-slate-950/55 hover:border-cyan-400/20 hover:bg-slate-950/75',
          ].join(' ')}
          type="button"
          onClick={() => onSelect(item.employee.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{item.employee.fullName}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                {item.employee.jobTitle || item.employee.role}
              </p>
            </div>
            {item.existingReview ? (
              <Chip color="primary" size="sm" variant="flat">
                {item.existingReview.rating} / {PERFORMANCE_REVIEW_RATING_MAX}
              </Chip>
            ) : (
              <Chip color={item.canReview ? 'success' : 'default'} size="sm" variant="flat">
                {item.canReview ? 'Ready' : 'Locked'}
              </Chip>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-400">{item.employee.workEmail}</p>
          {item.lockReason ? (
            <p className="mt-3 text-sm text-slate-500">{item.lockReason}</p>
          ) : (
            <p className="mt-3 text-sm text-emerald-300">
              Ready for manager review in this period.
            </p>
          )}
        </button>
      ))}
    </div>
  );
}

export function PerformancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isEmployee = user?.role === ROLES.EMPLOYEE;
  const [reviewPeriods, setReviewPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [directReportAssignments, setDirectReportAssignments] = useState({
    items: [],
    reviewPeriod: null,
    total: 0,
  });
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState([]);
  const [selectedEmployeeSummary, setSelectedEmployeeSummary] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [periodActionId, setPeriodActionId] = useState(null);
  const {
    formState: { errors: periodErrors, isSubmitting: isSavingPeriod },
    handleSubmit: handlePeriodSubmit,
    register: registerPeriod,
    reset: resetPeriodForm,
  } = useForm({
    resolver: zodResolver(reviewPeriodSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  });
  const {
    formState: { errors: reviewErrors, isSubmitting: isSavingReview },
    handleSubmit: handleReviewSubmit,
    register: registerReview,
    reset: resetReviewForm,
    setValue: setReviewValue,
  } = useForm({
    resolver: zodResolver(performanceReviewSchema),
    defaultValues: {
      employeeId: '',
      reviewPeriodId: '',
      rating: '',
      comment: '',
    },
  });

  const selectedAssignment = useMemo(
    () =>
      directReportAssignments.items.find((item) => item.employee.id === selectedEmployeeId) || null,
    [directReportAssignments.items, selectedEmployeeId],
  );

  const currentReviewPeriod =
    directReportAssignments.reviewPeriod ||
    reviewPeriods.find((period) => period.id === selectedPeriodId) ||
    null;
  const isEditingOwnReview = Boolean(
    selectedAssignment?.existingReview && selectedAssignment.existingReview.reviewerId === user?.id,
  );
  const canSubmitInSelectedPeriod = isReviewWindowOpen(currentReviewPeriod);
  const reviewFormDisabledReason = useMemo(() => {
    if (!isManager) {
      return null;
    }

    if (!selectedAssignment) {
      return 'Select a direct report to create or update a performance review.';
    }

    if (isEditingOwnReview && canSubmitInSelectedPeriod) {
      return null;
    }

    if (selectedAssignment.canReview) {
      return null;
    }

    return selectedAssignment.lockReason || getReviewWindowMessage(currentReviewPeriod);
  }, [canSubmitInSelectedPeriod, currentReviewPeriod, isEditingOwnReview, isManager, selectedAssignment]);

  const loadReviewPeriods = useCallback(async () => {
    const result = await listReviewPeriods();
    setReviewPeriods(result.items);
    return result;
  }, []);

  const loadAdminReviews = useCallback(async () => {
    if (!isAdmin) {
      setAdminReviews([]);
      return;
    }

    const result = await listPerformanceReviews();
    setAdminReviews(result.items);
  }, [isAdmin]);

  const loadMyReviews = useCallback(async () => {
    if (!isEmployee) {
      setMyReviews([]);
      return;
    }

    const result = await listMyPerformanceReviews();
    setMyReviews(result.items);
  }, [isEmployee]);

  const loadDirectReportAssignments = useCallback(
    async (reviewPeriodId) => {
      if (!isManager) {
        setDirectReportAssignments({ items: [], reviewPeriod: null, total: 0 });
        return;
      }

      const result = await listDirectReportReviewAssignments(
        reviewPeriodId ? { reviewPeriodId } : {},
      );

      setDirectReportAssignments(result);
    },
    [isManager],
  );

  const loadSelectedEmployeeHistory = useCallback(
    async (employeeId) => {
      if (!isManager || !employeeId) {
        setSelectedEmployeeHistory([]);
        setSelectedEmployeeSummary(null);
        return;
      }

      const result = await listEmployeePerformanceReviews(employeeId);
      setSelectedEmployeeHistory(result.items);
      setSelectedEmployeeSummary(result.employee);
    },
    [isManager],
  );

  const refreshPageData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [periodResult] = await Promise.all([
        loadReviewPeriods(),
        loadAdminReviews(),
        loadMyReviews(),
      ]);

      const nextSelectedPeriodId =
        selectedPeriodId && periodResult.items.some((period) => period.id === selectedPeriodId)
          ? selectedPeriodId
          : periodResult.openPeriodId || periodResult.items[0]?.id || '';

      if (nextSelectedPeriodId !== selectedPeriodId) {
        setSelectedPeriodId(nextSelectedPeriodId);
      }

      if (isManager) {
        await loadDirectReportAssignments(nextSelectedPeriodId);
      }
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to load performance data.'));
    } finally {
      setLoading(false);
    }
  }, [isManager, loadAdminReviews, loadDirectReportAssignments, loadMyReviews, loadReviewPeriods, selectedPeriodId]);

  useEffect(() => {
    refreshPageData();
  }, [refreshPageData]);

  useEffect(() => {
    if (!reviewPeriods.length) {
      setSelectedPeriodId('');
      return;
    }

    if (selectedPeriodId && reviewPeriods.some((period) => period.id === selectedPeriodId)) {
      return;
    }

    const openPeriod = reviewPeriods.find(
      (period) => period.status === REVIEW_PERIOD_STATUSES.OPEN,
    );

    setSelectedPeriodId(openPeriod?.id || reviewPeriods[0].id);
  }, [reviewPeriods, selectedPeriodId]);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    if (!selectedPeriodId) {
      setDirectReportAssignments({ items: [], reviewPeriod: null, total: 0 });
      return;
    }

    loadDirectReportAssignments(selectedPeriodId).catch((error) => {
      setErrorMessage(extractErrorMessage(error, 'Unable to load direct report review data.'));
    });
  }, [isManager, loadDirectReportAssignments, selectedPeriodId]);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    const nextSelectedEmployeeId =
      selectedEmployeeId &&
      directReportAssignments.items.some((item) => item.employee.id === selectedEmployeeId)
        ? selectedEmployeeId
        : directReportAssignments.items.find((item) => item.canReview)?.employee.id ||
          directReportAssignments.items[0]?.employee.id ||
          '';

    if (nextSelectedEmployeeId !== selectedEmployeeId) {
      setSelectedEmployeeId(nextSelectedEmployeeId);
    }
  }, [directReportAssignments.items, isManager, selectedEmployeeId]);

  useEffect(() => {
    if (!isManager || !selectedEmployeeId) {
      setSelectedEmployeeHistory([]);
      setSelectedEmployeeSummary(null);
      return;
    }

    loadSelectedEmployeeHistory(selectedEmployeeId).catch((error) => {
      setErrorMessage(extractErrorMessage(error, 'Unable to load employee review history.'));
    });
  }, [isManager, loadSelectedEmployeeHistory, selectedEmployeeId]);

  useEffect(() => {
    const assignment = directReportAssignments.items.find(
      (item) => item.employee.id === selectedEmployeeId,
    );

    setReviewValue('employeeId', selectedEmployeeId || '');
    setReviewValue('reviewPeriodId', selectedPeriodId || '');

    if (assignment?.existingReview && assignment.existingReview.reviewerId === user?.id) {
      setReviewValue('rating', String(assignment.existingReview.rating));
      setReviewValue('comment', assignment.existingReview.comment || '');
      return;
    }

    resetReviewForm({
      employeeId: selectedEmployeeId || '',
      reviewPeriodId: selectedPeriodId || '',
      rating: '',
      comment: '',
    });
  }, [directReportAssignments.items, resetReviewForm, selectedEmployeeId, selectedPeriodId, setReviewValue, user?.id]);

  const handlePeriodFormSubmit = handlePeriodSubmit(async (values) => {
    setNotice(null);
    setErrorMessage(null);

    try {
      if (editingPeriodId) {
        await updateReviewPeriod(editingPeriodId, {
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
          description: values.description || undefined,
        });
        setNotice('Review period updated successfully.');
      } else {
        await createReviewPeriod({
          name: values.name,
          startDate: values.startDate,
          endDate: values.endDate,
          description: values.description || undefined,
        });
        setNotice('Review period created successfully.');
      }

      setEditingPeriodId(null);
      resetPeriodForm({
        name: '',
        startDate: '',
        endDate: '',
        description: '',
      });
      await refreshPageData();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to save review period.'));
    }
  });

  const handleEditPeriod = (reviewPeriod) => {
    setEditingPeriodId(reviewPeriod.id);
    resetPeriodForm({
      name: reviewPeriod.name,
      startDate: reviewPeriod.startDate,
      endDate: reviewPeriod.endDate,
      description: reviewPeriod.description || '',
    });
  };

  const handleCancelPeriodEdit = () => {
    setEditingPeriodId(null);
    resetPeriodForm({
      name: '',
      startDate: '',
      endDate: '',
      description: '',
    });
  };

  const handleOpenPeriod = async (reviewPeriodId) => {
    setNotice(null);
    setErrorMessage(null);
    setPeriodActionId(reviewPeriodId);

    try {
      await openReviewPeriod(reviewPeriodId);
      setNotice('Review period opened successfully.');
      await refreshPageData();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to open review period.'));
    } finally {
      setPeriodActionId(null);
    }
  };

  const handleClosePeriod = async (reviewPeriodId) => {
    setNotice(null);
    setErrorMessage(null);
    setPeriodActionId(reviewPeriodId);

    try {
      await closeReviewPeriod(reviewPeriodId);
      setNotice('Review period closed successfully.');
      await refreshPageData();
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to close review period.'));
    } finally {
      setPeriodActionId(null);
    }
  };

  const handleReviewFormSubmit = handleReviewSubmit(async (values) => {
    setNotice(null);
    setErrorMessage(null);

    try {
      const payload = {
        employeeId: values.employeeId,
        reviewPeriodId: values.reviewPeriodId,
        rating: Number(values.rating),
        comment: values.comment || undefined,
      };

      if (isEditingOwnReview && selectedAssignment?.existingReview?.id) {
        await updatePerformanceReview(selectedAssignment.existingReview.id, payload);
        setNotice('Performance review updated successfully.');
      } else {
        await createPerformanceReview(payload);
        setNotice('Performance review submitted successfully.');
      }

      await refreshPageData();
      await loadSelectedEmployeeHistory(values.employeeId);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Unable to save performance review.'));
    }
  });

  if (loading) {
    return <PageLoader label="Loading performance workspace..." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[36px] border border-white/8 bg-[#08111a] px-6 py-7 shadow-[0_26px_60px_rgba(2,12,27,0.45)] lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300">Module 3</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">
              Performance Reviews
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
              Performance reviews are layered on top of the current reporting structure. Managers can
              only review their live direct reports, submitted reviews keep their original reviewer,
              and review periods control when submissions are allowed.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Chip color="default" size="lg" variant="flat">
              {reviewPeriods.length} Period{reviewPeriods.length === 1 ? '' : 's'}
            </Chip>
            <Chip color="primary" size="lg" variant="flat">
              {isAdmin ? adminReviews.length : isManager ? directReportAssignments.total : myReviews.length}{' '}
              {isAdmin ? 'Reviews' : isManager ? 'Direct Reports' : 'My Reviews'}
            </Chip>
          </div>
        </div>
      </section>

      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      {isAdmin ? (
        <>
          <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                Review Period Control
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {editingPeriodId ? 'Edit review period' : 'Create review period'}
              </h2>
            </CardHeader>
            <CardBody>
              <form className="space-y-4" onSubmit={handlePeriodFormSubmit}>
                <div className="grid gap-4 lg:grid-cols-2">
                  <TextField fullWidth isInvalid={Boolean(periodErrors.name)} name="periodName">
                    <Label>Period name</Label>
                    <Input placeholder="Q1 2026" {...registerPeriod('name')} />
                    {periodErrors.name ? (
                      <FieldError>{periodErrors.name.message}</FieldError>
                    ) : (
                      <Description>Period names are unique and non-overlapping.</Description>
                    )}
                  </TextField>
                  <TextField fullWidth isInvalid={Boolean(periodErrors.description)} name="description">
                    <Label>Description</Label>
                    <TextArea
                      minRows={3}
                      placeholder="Optional context for this review cycle"
                      {...registerPeriod('description')}
                    />
                    {periodErrors.description ? (
                      <FieldError>{periodErrors.description.message}</FieldError>
                    ) : null}
                  </TextField>
                  <TextField fullWidth isInvalid={Boolean(periodErrors.startDate)} name="startDate" type="date">
                    <Label>Start date</Label>
                    <Input {...registerPeriod('startDate')} />
                    {periodErrors.startDate ? (
                      <FieldError>{periodErrors.startDate.message}</FieldError>
                    ) : null}
                  </TextField>
                  <TextField fullWidth isInvalid={Boolean(periodErrors.endDate)} name="endDate" type="date">
                    <Label>End date</Label>
                    <Input {...registerPeriod('endDate')} />
                    {periodErrors.endDate ? (
                      <FieldError>{periodErrors.endDate.message}</FieldError>
                    ) : null}
                  </TextField>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button color="primary" isLoading={isSavingPeriod} radius="lg" type="submit">
                    {editingPeriodId ? 'Save review period' : 'Create review period'}
                  </Button>
                  {editingPeriodId ? (
                    <Button
                      color="default"
                      radius="lg"
                      type="button"
                      variant="bordered"
                      onPress={handleCancelPeriodEdit}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardBody>
          </Card>

          <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Review Periods</p>
              <h2 className="text-2xl font-semibold text-white">Manage period lifecycle</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {reviewPeriods.length ? (
                reviewPeriods.map((reviewPeriod) => (
                  <ReviewPeriodCard
                    key={reviewPeriod.id}
                    isBusy={periodActionId === reviewPeriod.id}
                    reviewPeriod={reviewPeriod}
                    onClose={handleClosePeriod}
                    onEdit={handleEditPeriod}
                    onOpen={handleOpenPeriod}
                  />
                ))
              ) : (
                <NoticeBanner tone="info">No review periods have been created yet.</NoticeBanner>
              )}
            </CardBody>
          </Card>

          <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Review Overview</p>
              <h2 className="text-2xl font-semibold text-white">All submitted performance reviews</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {adminReviews.length ? (
                adminReviews.map((review) => <ReviewSummaryCard key={review.id} review={review} />)
              ) : (
                <NoticeBanner tone="info">No performance reviews have been submitted yet.</NoticeBanner>
              )}
            </CardBody>
          </Card>
        </>
      ) : null}

      {isManager ? (
        <>
          <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Manager Workflow</p>
              <h2 className="text-2xl font-semibold text-white">Review current direct reports</h2>
            </CardHeader>
            <CardBody className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[300px,1fr]">
                <div className="space-y-4">
                  <TextField fullWidth name="selectedReviewPeriod">
                    <Label>Review period</Label>
                    <select
                      className="app-select"
                      value={selectedPeriodId}
                      onChange={(event) => setSelectedPeriodId(event.target.value)}
                    >
                      <option value="">Select a review period</option>
                      {reviewPeriods.map((reviewPeriod) => (
                        <option key={reviewPeriod.id} value={reviewPeriod.id}>
                          {reviewPeriod.name} ({reviewPeriod.status})
                        </option>
                      ))}
                    </select>
                    <Description>
                      Only OPEN periods within their date window accept new or updated reviews.
                    </Description>
                  </TextField>

                  {currentReviewPeriod ? (
                    <div className="rounded-3xl border border-white/8 bg-slate-950/55 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{currentReviewPeriod.name}</p>
                        <Chip color={getPeriodChipColor(currentReviewPeriod.status)} size="sm" variant="flat">
                          {currentReviewPeriod.status}
                        </Chip>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {formatDate(currentReviewPeriod.startDate)} to{' '}
                        {formatDate(currentReviewPeriod.endDate)}
                      </p>
                      {getReviewWindowMessage(currentReviewPeriod) ? (
                        <p className="mt-3 text-sm text-amber-300">
                          {getReviewWindowMessage(currentReviewPeriod)}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-emerald-300">
                          This review window is currently accepting submissions.
                        </p>
                      )}
                    </div>
                  ) : (
                    <NoticeBanner tone="warning">
                      No review period is available. Ask an administrator to create and open one.
                    </NoticeBanner>
                  )}
                </div>

                <div className="space-y-4">
                  {directReportAssignments.items.length ? (
                    <DirectReportSelector
                      items={directReportAssignments.items}
                      selectedEmployeeId={selectedEmployeeId}
                      onSelect={setSelectedEmployeeId}
                    />
                  ) : (
                    <NoticeBanner tone="info">
                      No current direct reports are assigned to your profile.
                    </NoticeBanner>
                  )}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-[32px] border border-white/8 bg-slate-950/45 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                        Review Form
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        {isEditingOwnReview ? 'Update submitted review' : 'Submit performance review'}
                      </h3>
                    </div>
                    {selectedAssignment?.existingReview ? (
                      <Chip color="primary" size="sm" variant="flat">
                        {selectedAssignment.existingReview.rating} / {PERFORMANCE_REVIEW_RATING_MAX}
                      </Chip>
                    ) : null}
                  </div>

                  {reviewFormDisabledReason ? (
                    <div className="mt-4">
                      <NoticeBanner tone={isEditingOwnReview ? 'warning' : 'info'}>
                        {reviewFormDisabledReason}
                      </NoticeBanner>
                    </div>
                  ) : null}

                  <form className="mt-5 space-y-4" onSubmit={handleReviewFormSubmit}>
                    <input type="hidden" {...registerReview('employeeId')} />
                    <input type="hidden" {...registerReview('reviewPeriodId')} />
                    <TextField fullWidth isInvalid={Boolean(reviewErrors.rating)} name="rating">
                      <Label>Rating</Label>
                      <select className="app-select" {...registerReview('rating')}>
                        <option value="">Select rating</option>
                        {Array.from(
                          {
                            length:
                              PERFORMANCE_REVIEW_RATING_MAX - PERFORMANCE_REVIEW_RATING_MIN + 1,
                          },
                          (_, index) => PERFORMANCE_REVIEW_RATING_MIN + index,
                        ).map((rating) => (
                          <option key={rating} value={String(rating)}>
                            {rating} / {PERFORMANCE_REVIEW_RATING_MAX}
                          </option>
                        ))}
                      </select>
                      {reviewErrors.rating ? (
                        <FieldError>{reviewErrors.rating.message}</FieldError>
                      ) : null}
                    </TextField>
                    <TextField fullWidth isInvalid={Boolean(reviewErrors.comment)} name="comment">
                      <Label>Comment</Label>
                      <TextArea
                        minRows={5}
                        placeholder="Document strengths, outcomes, and any follow-up guidance."
                        {...registerReview('comment')}
                      />
                      {reviewErrors.comment ? (
                        <FieldError>{reviewErrors.comment.message}</FieldError>
                      ) : (
                        <Description>
                          Comments are optional but recommended for performance context.
                        </Description>
                      )}
                    </TextField>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        color="primary"
                        fullWidth
                        isDisabled={Boolean(reviewFormDisabledReason)}
                        isLoading={isSavingReview}
                        radius="lg"
                        type="submit"
                      >
                        {isEditingOwnReview ? 'Update review' : 'Submit review'}
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="rounded-[32px] border border-white/8 bg-slate-950/45 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Review History</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {selectedEmployeeSummary?.fullName
                      ? `${selectedEmployeeSummary.fullName}'s review history`
                      : 'Select a direct report'}
                  </h3>
                  <div className="mt-5 space-y-4">
                    {selectedEmployeeHistory.length ? (
                      selectedEmployeeHistory.map((review) => (
                        <ReviewSummaryCard key={review.id} review={review} />
                      ))
                    ) : selectedEmployeeSummary ? (
                      <NoticeBanner tone="info">
                        No performance reviews have been recorded for this employee yet.
                      </NoticeBanner>
                    ) : (
                      <NoticeBanner tone="info">
                        Choose a direct report to view submitted performance reviews.
                      </NoticeBanner>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      ) : null}

      {isEmployee ? (
        <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">My Performance</p>
            <h2 className="text-2xl font-semibold text-white">My performance review history</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {myReviews.length ? (
              myReviews.map((review) => <ReviewSummaryCard key={review.id} review={review} />)
            ) : (
              <NoticeBanner tone="info">
                No performance reviews are available for your account yet.
              </NoticeBanner>
            )}
          </CardBody>
        </Card>
      ) : null}

      {!isAdmin && !isManager && !isEmployee ? (
        <NoticeBanner tone="warning">
          Your account does not currently have a supported performance-review role.
        </NoticeBanner>
      ) : null}
    </div>
  );
}
