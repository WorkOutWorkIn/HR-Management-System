import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES, ROLES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { Description, FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuth } from '@/hooks/useAuth';
import { createEmployee, listEmployees } from '@/services/employees/employees.api';

const employeeSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120, 'Full name is too long'),
  workEmail: z.string().trim().email('Enter a valid work email'),
  role: z.enum([ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN]),
  managerUserId: z.string().uuid('Select a valid manager').optional().or(z.literal('')),
  annualLeaveQuota: z.coerce
    .number()
    .min(0, 'Annual leave quota must be 0 or more')
    .max(365, 'Annual leave quota must be 365 days or fewer'),
  department: z.string().max(100, 'Department is too long').optional().or(z.literal('')),
  jobTitle: z.string().max(100, 'Job title is too long').optional().or(z.literal('')),
});

export function EmployeeListPage() {
  const { user } = useAuth();
  const canOnboardEmployees = user?.role === ROLES.ADMIN;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: ROLES.EMPLOYEE,
      managerUserId: '',
      annualLeaveQuota: 14,
    },
  });
  const managerOptions = employees.filter((employee) =>
    [ROLES.MANAGER, ROLES.ADMIN].includes(employee.role),
  );

  async function loadEmployees(nextSearch = '') {
    setLoading(true);

    try {
      const result = await listEmployees(nextSearch ? { search: nextSearch } : {});
      setEmployees(result.items);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const result = await createEmployee({
        ...values,
        managerUserId: values.managerUserId || undefined,
      });
      setNotice(
        `Account created for ${result.user.fullName}. Onboarding delivery: ${result.onboarding.delivery}.`,
      );
      reset({
        fullName: '',
        workEmail: '',
        role: ROLES.EMPLOYEE,
        managerUserId: '',
        annualLeaveQuota: 14,
        department: '',
        jobTitle: '',
      });
      await loadEmployees(search);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to create the employee account.');
    }
  });

  return (
    <div className="space-y-6">
      <Card className="border border-slate-800 bg-slate-900/80">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Admin tools</p>
          <h2 className="text-2xl font-semibold text-white">Employee onboarding</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
          {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}
          {canOnboardEmployees ? (
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
              <TextField fullWidth isInvalid={Boolean(errors.fullName)} name="fullName">
                <Label>Full name</Label>
                <Input {...register('fullName')} />
                {errors.fullName ? <FieldError>{errors.fullName.message}</FieldError> : null}
              </TextField>
              <TextField
                fullWidth
                isInvalid={Boolean(errors.workEmail)}
                name="workEmail"
                type="email"
              >
                <Label>Work email</Label>
                <Input {...register('workEmail')} />
                {errors.workEmail ? <FieldError>{errors.workEmail.message}</FieldError> : null}
              </TextField>
              <label className="space-y-2 text-sm text-slate-200">
                <span className="block">Role</span>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  value={watch('role')}
                  onChange={(event) =>
                    setValue('role', event.target.value, { shouldValidate: true })
                  }
                >
                  <option value={ROLES.EMPLOYEE}>{ROLES.EMPLOYEE}</option>
                  <option value={ROLES.MANAGER}>{ROLES.MANAGER}</option>
                  <option value={ROLES.ADMIN}>{ROLES.ADMIN}</option>
                </select>
                <span className="text-xs text-slate-400">
                  Admin can create EMPLOYEE, MANAGER, and ADMIN accounts.
                </span>
                {errors.role ? (
                  <span className="block text-xs text-rose-400">{errors.role.message}</span>
                ) : null}
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                <span className="block">Line manager</span>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  value={watch('managerUserId')}
                  onChange={(event) =>
                    setValue('managerUserId', event.target.value, { shouldValidate: true })
                  }
                >
                  <option value="">No direct manager</option>
                  {managerOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.role})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">
                  Managers can approve leave only for assigned direct reports.
                </span>
                {errors.managerUserId ? (
                  <span className="block text-xs text-rose-400">
                    {errors.managerUserId.message}
                  </span>
                ) : null}
              </label>
              <TextField
                fullWidth
                isInvalid={Boolean(errors.annualLeaveQuota)}
                name="annualLeaveQuota"
                type="number"
              >
                <Label>Annual leave quota</Label>
                <Input {...register('annualLeaveQuota')} />
                {errors.annualLeaveQuota ? (
                  <FieldError>{errors.annualLeaveQuota.message}</FieldError>
                ) : null}
              </TextField>
              <TextField fullWidth isInvalid={Boolean(errors.department)} name="department">
                <Label>Department</Label>
                <Input {...register('department')} />
                {errors.department ? <FieldError>{errors.department.message}</FieldError> : null}
              </TextField>
              <TextField fullWidth isInvalid={Boolean(errors.jobTitle)} name="jobTitle">
                <Label>Job title</Label>
                <Input {...register('jobTitle')} />
                {errors.jobTitle ? <FieldError>{errors.jobTitle.message}</FieldError> : null}
              </TextField>
              <div className="flex items-end">
                <Button color="primary" isLoading={isSubmitting} type="submit">
                  Create employee account
                </Button>
              </div>
            </form>
          ) : (
            <NoticeBanner tone="info">
              Managers can view the employee directory, but only ADMIN users can onboard new
              accounts.
            </NoticeBanner>
          )}
        </CardBody>
      </Card>

      <Card className="border border-slate-800 bg-slate-900/80">
        <CardHeader className="flex flex-col items-start gap-2">
          <h3 className="text-xl font-semibold text-white">Employee directory</h3>
          <div className="w-full max-w-md">
            <TextField fullWidth name="employeeSearch">
              <Label>Search by name or email</Label>
              <Input
                value={search}
                onValueChange={(value) => setSearch(value)}
                endContent={
                  <Button size="sm" variant="light" onPress={() => loadEmployees(search)}>
                    Search
                  </Button>
                }
              />
              <Description>Search refreshes the current employee directory list.</Description>
            </TextField>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <PageLoader label="Loading employees..." />
          ) : employees.length ? (
            <div className="space-y-3">
              {employees.map((employee) => (
                <Link
                  key={employee.id}
                  className="block rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-cyan-500/40"
                  to={`${APP_ROUTES.EMPLOYEES}/${employee.id}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{employee.fullName}</p>
                      <p className="text-sm text-slate-400">{employee.workEmail}</p>
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <p>{employee.role}</p>
                      <p>{employee.status}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <NoticeBanner tone="info">No employee records match the current filters.</NoticeBanner>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
