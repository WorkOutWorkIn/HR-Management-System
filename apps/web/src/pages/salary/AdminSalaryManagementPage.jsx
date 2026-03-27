import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PageLoader } from '@/components/common/PageLoader';
import { Description, FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import {
  getSalaryForUser,
  listSalaryUsers,
  updateSalaryForUser,
} from '@/services/salary/salary.api';

const salaryFormSchema = z.object({
  baseSalary: z
    .string()
    .trim()
    .min(1, 'Base salary is required')
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
      message: 'Base salary must be numbers only, with up to 2 decimal places.',
    })
    .transform((value) => Number(value))
    .refine((value) => value >= 0, {
      message: 'Base salary must be 0 or more',
    }),
  effectiveDate: z
    .string()
    .trim()
    .min(1, 'Effective date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Effective date must use YYYY-MM-DD'),
});

function formatSalary(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'Not set';
  }

  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AdminSalaryManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(salaryFormSchema),
    mode: 'onChange',
    defaultValues: {
      baseSalary: '',
      effectiveDate: '',
    },
  });

  async function loadEmployees(nextSearch = '') {
    setIsLoadingEmployees(true);
    setErrorMessage(null);

    try {
      const result = await listSalaryUsers(nextSearch ? { search: nextSearch } : {});
      setEmployees(result.items);

      const nextSelectedId =
        result.items.find((employee) => employee.id === selectedEmployeeId)?.id || result.items[0]?.id || null;

      setSelectedEmployeeId(nextSelectedId);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to load employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  }

  useEffect(() => {
    loadEmployees('');
    // The initial load is intentionally one-time; later refreshes use explicit search actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      if (!selectedEmployeeId) {
        setSelectedEmployee(null);
        setSelectedSalaryRecord(null);
        reset({
          baseSalary: '',
          effectiveDate: '',
        });
        return;
      }

      setIsLoadingDetails(true);
      setErrorMessage(null);

      try {
        const result = await getSalaryForUser(selectedEmployeeId);

        if (!isMounted) {
          return;
        }

        setSelectedEmployee(result.user);
        setSelectedSalaryRecord(result.salaryRecord);
        setSalaryHistory(result.history || []);
        reset({
          baseSalary:
            result.salaryRecord?.baseSalary === null || result.salaryRecord?.baseSalary === undefined
              ? ''
              : result.salaryRecord.baseSalary,
          effectiveDate: result.salaryRecord?.effectiveDate || '',
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error?.response?.data?.message || 'Failed to load salary details');
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [reset, selectedEmployeeId]);

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedEmployeeId) {
      return;
    }

    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await updateSalaryForUser(selectedEmployeeId, values);
      setSelectedSalaryRecord(result.salaryRecord);
      setSalaryHistory(result.history || []);
      setNotice(
        result.operation === 'update'
          ? 'Salary updated successfully for the selected effective date.'
          : 'Salary updated successfully. A new effective-date record was added to salary history.',
      );

      setEmployees((currentEmployees) =>
        currentEmployees.map((employee) =>
          employee.id === selectedEmployeeId
            ? { ...employee, salaryRecord: result.salaryRecord }
            : employee,
        ),
      );
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to save salary record.');
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/8 bg-slate-900/80 p-7 shadow-[0_22px_55px_rgba(2,12,27,0.4)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Salary admin</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-white">
              Salary management
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">
              Select an employee, then update their base salary and effective date.
            </p>
          </div>
          <Button as={Link} to={APP_ROUTES.SALARY} variant="bordered" className="border-white/10">
            Back to my salary
          </Button>
        </div>
      </section>

      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
          <CardHeader className="flex flex-col items-start gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Employees</p>
            <TextField fullWidth name="salaryAdminSearch">
              <Label>Search by name or email</Label>
              <Input
                value={search}
                onValueChange={setSearch}
                endContent={
                  <Button size="sm" variant="light" onPress={() => loadEmployees(search)}>
                    Search
                  </Button>
                }
              />
            </TextField>
          </CardHeader>
          <CardBody>
            {isLoadingEmployees ? (
              <PageLoader label="Loading employees..." />
            ) : employees.length ? (
              <div className="space-y-3">
                {employees.map((employee) => {
                  const isSelected = employee.id === selectedEmployeeId;

                  return (
                    <button
                      key={employee.id}
                      type="button"
                      className={[
                        'w-full rounded-2xl border p-4 text-left transition',
                        isSelected
                          ? 'border-cyan-400/50 bg-cyan-400/10'
                          : 'border-white/8 bg-slate-950/50 hover:border-cyan-500/30',
                      ].join(' ')}
                      onClick={() => {
                        setNotice(null);
                        setSelectedEmployeeId(employee.id);
                      }}
                    >
                      <p className="font-medium text-white">{employee.fullName}</p>
                      <p className="mt-1 text-sm text-slate-400">{employee.workEmail}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                        Current salary
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {formatSalary(employee.salaryRecord?.baseSalary)}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <NoticeBanner tone="info">No employees match the current search.</NoticeBanner>
            )}
          </CardBody>
        </Card>

        <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Editor</p>
            <h2 className="text-3xl font-semibold text-white">
              {selectedEmployee ? selectedEmployee.fullName : 'Select an employee'}
            </h2>
            {selectedEmployee ? (
              <p className="text-sm text-slate-400">
                {selectedEmployee.workEmail}
                {selectedEmployee.jobTitle ? ` · ${selectedEmployee.jobTitle}` : ''}
                {selectedEmployee.department ? ` · ${selectedEmployee.department}` : ''}
              </p>
            ) : null}
          </CardHeader>
          <CardBody>
            {isLoadingDetails ? (
              <PageLoader label="Loading salary details..." />
            ) : selectedEmployee ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-white/8 bg-slate-950/40 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                      Latest salary
                    </p>
                    <p className="mt-4 text-3xl font-semibold text-white">
                      {formatSalary(selectedSalaryRecord?.baseSalary)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/8 bg-slate-950/40 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                      Effective date
                    </p>
                    <p className="mt-4 text-2xl font-semibold text-white">
                      {selectedSalaryRecord?.effectiveDate || 'Not set'}
                    </p>
                  </div>
                </div>

                <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
                  <TextField
                    fullWidth
                    isInvalid={Boolean(errors.baseSalary)}
                    name="baseSalary"
                    type="number"
                  >
                    <Label>Base salary</Label>
                    <Input
                      {...register('baseSalary')}
                      inputMode="decimal"
                      pattern="^\d+(\.\d{1,2})?$"
                      step="0.01"
                    />
                    {errors.baseSalary ? (
                      <FieldError>{errors.baseSalary.message}</FieldError>
                    ) : (
                      <Description>Use numbers only, for example `3200` or `3200.50`.</Description>
                    )}
                  </TextField>
                  <TextField
                    fullWidth
                    isInvalid={Boolean(errors.effectiveDate)}
                    name="effectiveDate"
                    type="date"
                  >
                    <Label>Effective date</Label>
                    <Input {...register('effectiveDate')} />
                    {errors.effectiveDate ? (
                      <FieldError>{errors.effectiveDate.message}</FieldError>
                    ) : (
                      <Description>Use the YYYY-MM-DD format.</Description>
                    )}
                  </TextField>
                  <div className="md:col-span-2">
                    <Button color="primary" isLoading={isSubmitting} type="submit">
                      Update salary
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                      Salary history
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Salary history</h3>
                  </div>
                  {salaryHistory.length ? (
                    <div className="space-y-3">
                      {salaryHistory.map((record) => (
                        <div
                          key={record.id}
                          className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-sm text-slate-400">
                              Effective {record.effectiveDate}
                            </p>
                            <p className="mt-1 font-medium text-white">
                              {formatSalary(record.baseSalary)}
                            </p>
                          </div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            Created {record.createdAt?.slice(0, 10) || 'Unknown'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NoticeBanner tone="info">
                      No salary history exists for this employee yet.
                    </NoticeBanner>
                  )}
                </div>
              </div>
            ) : (
              <NoticeBanner tone="info">
                Select an employee from the list to view or update their salary.
              </NoticeBanner>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
