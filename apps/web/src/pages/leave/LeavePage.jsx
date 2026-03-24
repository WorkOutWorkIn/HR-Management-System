import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  LEAVE_DAY_PORTIONS,
  LEAVE_REQUEST_STATUSES,
  LEAVE_TYPES,
  ROLES,
  hasAnyRole,
} from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import {
  Description,
  FieldError,
  Input,
  Label,
  TextArea,
  TextField,
} from '@/components/forms/TextField';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuth } from '@/hooks/useAuth';
import {
  approveLeaveRequest,
  createLeaveRequest,
  createPublicHoliday,
  deletePublicHoliday,
  getMyLeaveBalance,
  listMyLeaveRequests,
  listPendingApprovals,
  listPublicHolidays,
  rejectLeaveRequest,
} from '@/services/leave/leave.api';

const leaveRequestSchema = z
  .object({
    leaveType: z.enum([LEAVE_TYPES.ANNUAL, LEAVE_TYPES.SICK], {
      required_error: 'Leave type is required',
    }),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z
      .string()
      .max(500, 'Reason must be 500 characters or fewer')
      .optional()
      .or(z.literal('')),
    startDayPortion: z.enum(
      [LEAVE_DAY_PORTIONS.FULL, LEAVE_DAY_PORTIONS.AM, LEAVE_DAY_PORTIONS.PM],
      {
        required_error: 'Start day portion is required',
      },
    ),
    endDayPortion: z.enum([LEAVE_DAY_PORTIONS.FULL, LEAVE_DAY_PORTIONS.AM, LEAVE_DAY_PORTIONS.PM], {
      required_error: 'End day portion is required',
    }),
  })
  .refine((values) => values.endDate >= values.startDate, {
    path: ['endDate'],
    message: 'End date cannot be before start date',
  });

const publicHolidaySchema = z.object({
  name: z.string().trim().min(2, 'Holiday name is required').max(120, 'Holiday name is too long'),
  holidayDate: z.string().min(1, 'Holiday date is required'),
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

function formatLeaveDateRange(leaveRequest) {
  const sameDay = leaveRequest.startDate === leaveRequest.endDate;

  if (sameDay) {
    return leaveRequest.startDate;
  }

  return `${leaveRequest.startDate} to ${leaveRequest.endDate}`;
}

function getStatusTone(status) {
  if (status === LEAVE_REQUEST_STATUSES.APPROVED) {
    return 'success';
  }

  if (status === LEAVE_REQUEST_STATUSES.REJECTED) {
    return 'danger';
  }

  return 'warning';
}

function LeaveRequestCard({ leaveRequest, actions }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-white">{leaveRequest.leaveType}</span>
            <span
              className={[
                'rounded-full px-2 py-1 text-xs font-medium',
                getStatusTone(leaveRequest.status) === 'success'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : getStatusTone(leaveRequest.status) === 'danger'
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'bg-amber-500/15 text-amber-300',
              ].join(' ')}
            >
              {leaveRequest.status}
            </span>
          </div>
          {leaveRequest.employee ? (
            <p className="text-sm text-slate-300">
              {leaveRequest.employee.fullName} ({leaveRequest.employee.workEmail})
            </p>
          ) : null}
          <p className="text-sm text-slate-300">{formatLeaveDateRange(leaveRequest)}</p>
          <p className="text-sm text-slate-400">
            Duration: {currencyFormatter.format(leaveRequest.durationDays)} day(s)
          </p>
          {leaveRequest.reason ? (
            <p className="text-sm text-slate-300">{leaveRequest.reason}</p>
          ) : null}
          {leaveRequest.decisionComment ? (
            <p className="text-sm text-slate-400">Decision note: {leaveRequest.decisionComment}</p>
          ) : null}
        </div>
        {actions}
      </div>
    </div>
  );
}

export function LeavePage() {
  const { user } = useAuth();
  const canApprove = hasAnyRole(user?.role, [ROLES.MANAGER]);
  const isAdmin = user?.role === ROLES.ADMIN;
  const [history, setHistory] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [decisionComments, setDecisionComments] = useState({});
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: LEAVE_TYPES.ANNUAL,
      startDate: '',
      endDate: '',
      reason: '',
      startDayPortion: LEAVE_DAY_PORTIONS.FULL,
      endDayPortion: LEAVE_DAY_PORTIONS.FULL,
    },
  });
  const {
    formState: { errors: holidayErrors, isSubmitting: isCreatingHoliday },
    handleSubmit: handleHolidaySubmit,
    register: registerHoliday,
    reset: resetHoliday,
  } = useForm({
    resolver: zodResolver(publicHolidaySchema),
  });

  const watchedLeaveType = watch('leaveType');
  const watchedStartDayPortion = watch('startDayPortion');
  const watchedEndDayPortion = watch('endDayPortion');

  const loadLeaveData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [historyResult, balanceResult, pendingResult, holidaysResult] = await Promise.all([
        listMyLeaveRequests(),
        getMyLeaveBalance(),
        canApprove ? listPendingApprovals() : Promise.resolve({ items: [] }),
        listPublicHolidays(),
      ]);

      setHistory(historyResult.items);
      setBalance(historyResult.balance || balanceResult.balance);
      setPendingApprovals(pendingResult.items);
      setPublicHolidays(holidaysResult.items);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to load leave data.');
    } finally {
      setLoading(false);
    }
  }, [canApprove]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null);
    setErrorMessage(null);

    try {
      await createLeaveRequest({
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason || undefined,
        startDayPortion: values.startDayPortion,
        endDayPortion: values.endDayPortion,
      });
      setNotice('Leave request submitted successfully.');
      reset({
        leaveType: LEAVE_TYPES.ANNUAL,
        startDate: '',
        endDate: '',
        reason: '',
        startDayPortion: LEAVE_DAY_PORTIONS.FULL,
        endDayPortion: LEAVE_DAY_PORTIONS.FULL,
      });
      await loadLeaveData();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to submit leave request.');
    }
  });

  async function handleDecision(action, leaveRequestId) {
    setNotice(null);
    setErrorMessage(null);

    try {
      const payload = {
        decisionComment: decisionComments[leaveRequestId] || undefined,
      };

      if (action === 'approve') {
        await approveLeaveRequest(leaveRequestId, payload);
        setNotice('Leave request approved successfully.');
      } else {
        await rejectLeaveRequest(leaveRequestId, payload);
        setNotice('Leave request rejected successfully.');
      }

      setDecisionComments((current) => ({
        ...current,
        [leaveRequestId]: '',
      }));
      await loadLeaveData();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to update leave request.');
    }
  }

  const onCreateHoliday = handleHolidaySubmit(async (values) => {
    setNotice(null);
    setErrorMessage(null);

    try {
      await createPublicHoliday(values);
      setNotice('Public holiday created successfully.');
      resetHoliday({
        name: '',
        holidayDate: '',
      });
      await loadLeaveData();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to create public holiday.');
    }
  });

  async function handleDeleteHoliday(holidayId) {
    setNotice(null);
    setErrorMessage(null);

    try {
      await deletePublicHoliday(holidayId);
      setNotice('Public holiday deleted successfully.');
      await loadLeaveData();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to delete public holiday.');
    }
  }

  const sortedHistory = useMemo(
    () => [...history].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [history],
  );

  if (loading) {
    return <PageLoader label="Loading leave workspace..." />;
  }

  return (
    <div className="space-y-6">
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}
      {user?.role === ROLES.EMPLOYEE && !user?.managerUserId ? (
        <NoticeBanner tone="info">
          No line manager is assigned to your profile yet. You can still submit leave requests, and
          ADMIN users will handle approval until a manager is assigned.
        </NoticeBanner>
      ) : null}

      {balance ? (
        <Card className="border border-slate-800 bg-slate-900/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Challenge feature</p>
            <h2 className="text-2xl font-semibold text-white">Annual leave balance</h2>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Annual quota</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {currencyFormatter.format(balance.annualLeaveQuota)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Approved annual leave used</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {currencyFormatter.format(balance.usedAnnualLeaveDays)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm text-slate-400">Remaining annual leave</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {currencyFormatter.format(balance.remainingAnnualLeaveDays)}
              </p>
            </div>
            <p className="md:col-span-3 text-sm text-slate-400">{balance.deductionPolicy}</p>
          </CardBody>
        </Card>
      ) : null}

      <Card className="border border-slate-800 bg-slate-900/80">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Phase 1 foundation</p>
          <h2 className="text-2xl font-semibold text-white">Apply for leave</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Leave type</span>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                value={watchedLeaveType}
                onChange={(event) =>
                  setValue('leaveType', event.target.value, { shouldValidate: true })
                }
              >
                <option value={LEAVE_TYPES.ANNUAL}>Annual Leave</option>
                <option value={LEAVE_TYPES.SICK}>Sick Leave</option>
              </select>
              {errors.leaveType ? (
                <span className="block text-xs text-rose-400">{errors.leaveType.message}</span>
              ) : null}
            </label>
            <TextField fullWidth isInvalid={Boolean(errors.startDate)} name="startDate" type="date">
              <Label>Start date</Label>
              <Input {...register('startDate')} />
              {errors.startDate ? <FieldError>{errors.startDate.message}</FieldError> : null}
            </TextField>
            <TextField fullWidth isInvalid={Boolean(errors.endDate)} name="endDate" type="date">
              <Label>End date</Label>
              <Input {...register('endDate')} />
              {errors.endDate ? <FieldError>{errors.endDate.message}</FieldError> : null}
            </TextField>
            <label className="space-y-2 text-sm text-slate-200">
              <span className="block">Start day portion</span>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                value={watchedStartDayPortion}
                onChange={(event) =>
                  setValue('startDayPortion', event.target.value, { shouldValidate: true })
                }
              >
                <option value={LEAVE_DAY_PORTIONS.FULL}>Full day</option>
                <option value={LEAVE_DAY_PORTIONS.AM}>Half day (AM)</option>
                <option value={LEAVE_DAY_PORTIONS.PM}>Half day (PM)</option>
              </select>
              {errors.startDayPortion ? (
                <span className="block text-xs text-rose-400">
                  {errors.startDayPortion.message}
                </span>
              ) : null}
            </label>
            <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
              <span className="block">End day portion</span>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                value={watchedEndDayPortion}
                onChange={(event) =>
                  setValue('endDayPortion', event.target.value, { shouldValidate: true })
                }
              >
                <option value={LEAVE_DAY_PORTIONS.FULL}>Full day</option>
                <option value={LEAVE_DAY_PORTIONS.AM}>Half day (AM)</option>
                <option value={LEAVE_DAY_PORTIONS.PM}>Half day (PM)</option>
              </select>
              {errors.endDayPortion ? (
                <span className="block text-xs text-rose-400">{errors.endDayPortion.message}</span>
              ) : null}
            </label>
            <TextField
              className="md:col-span-2"
              fullWidth
              isInvalid={Boolean(errors.reason)}
              name="reason"
            >
              <Label>Reason (optional)</Label>
              <TextArea minRows={3} {...register('reason')} />
              {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
              {!errors.reason ? (
                <Description>Add context if the approver needs more detail.</Description>
              ) : null}
            </TextField>
            <div className="md:col-span-2">
              <Button color="primary" isLoading={isSubmitting} type="submit">
                Submit leave request
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card className="border border-slate-800 bg-slate-900/80">
        <CardHeader className="flex flex-col items-start gap-2">
          <h3 className="text-xl font-semibold text-white">My leave history</h3>
        </CardHeader>
        <CardBody>
          {sortedHistory.length ? (
            <div className="space-y-3">
              {sortedHistory.map((leaveRequest) => (
                <LeaveRequestCard key={leaveRequest.id} leaveRequest={leaveRequest} />
              ))}
            </div>
          ) : (
            <NoticeBanner tone="info">You have not submitted any leave requests yet.</NoticeBanner>
          )}
        </CardBody>
      </Card>

      {canApprove ? (
        <Card className="border border-slate-800 bg-slate-900/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Phase 1 foundation</p>
            <h3 className="text-xl font-semibold text-white">Pending approvals</h3>
          </CardHeader>
          <CardBody>
            {pendingApprovals.length ? (
              <div className="space-y-3">
                {pendingApprovals.map((leaveRequest) => (
                  <LeaveRequestCard
                    key={leaveRequest.id}
                    leaveRequest={leaveRequest}
                    actions={
                      <div className="w-full max-w-sm space-y-3">
                        <TextField fullWidth name={`decisionComment-${leaveRequest.id}`}>
                          <Label>Decision comment (optional)</Label>
                          <TextArea
                            minRows={2}
                            value={decisionComments[leaveRequest.id] || ''}
                            onValueChange={(value) =>
                              setDecisionComments((current) => ({
                                ...current,
                                [leaveRequest.id]: value,
                              }))
                            }
                          />
                        </TextField>
                        <div className="flex gap-2">
                          <Button
                            color="success"
                            onPress={() => handleDecision('approve', leaveRequest.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            color="danger"
                            variant="flat"
                            onPress={() => handleDecision('reject', leaveRequest.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    }
                  />
                ))}
              </div>
            ) : (
              <NoticeBanner tone="info">
                {isAdmin
                  ? 'There are no pending leave requests waiting for admin review.'
                  : 'There are no pending leave requests from your direct reports.'}
              </NoticeBanner>
            )}
          </CardBody>
        </Card>
      ) : null}

      {isAdmin ? (
        <Card className="border border-slate-800 bg-slate-900/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Challenge feature</p>
            <h3 className="text-xl font-semibold text-white">Public holidays</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <form className="grid gap-4 md:grid-cols-[1fr,220px,auto]" onSubmit={onCreateHoliday}>
              <TextField fullWidth isInvalid={Boolean(holidayErrors.name)} name="holidayName">
                <Label>Holiday name</Label>
                <Input {...registerHoliday('name')} />
                {holidayErrors.name ? <FieldError>{holidayErrors.name.message}</FieldError> : null}
              </TextField>
              <TextField
                fullWidth
                isInvalid={Boolean(holidayErrors.holidayDate)}
                name="holidayDate"
                type="date"
              >
                <Label>Holiday date</Label>
                <Input {...registerHoliday('holidayDate')} />
                {holidayErrors.holidayDate ? (
                  <FieldError>{holidayErrors.holidayDate.message}</FieldError>
                ) : null}
              </TextField>
              <div className="flex items-end">
                <Button color="primary" isLoading={isCreatingHoliday} type="submit">
                  Add holiday
                </Button>
              </div>
            </form>

            {publicHolidays.length ? (
              <div className="space-y-3">
                {publicHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">{holiday.name}</p>
                      <p className="text-sm text-slate-400">{holiday.holidayDate}</p>
                    </div>
                    <Button
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => handleDeleteHoliday(holiday.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <NoticeBanner tone="info">No public holidays have been configured yet.</NoticeBanner>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
