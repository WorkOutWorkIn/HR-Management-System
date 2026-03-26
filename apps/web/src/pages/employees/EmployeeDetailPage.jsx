import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES, ROLES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuth } from '@/hooks/useAuth';
import { getEmployee, unlockEmployee, updateEmployee } from '@/services/employees/employees.api';

const employeeDetailSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120, 'Full name is too long'),
  department: z.string().max(100, 'Department is too long').optional().or(z.literal('')),
  jobTitle: z.string().max(100, 'Job title is too long').optional().or(z.literal('')),
  role: z.enum([ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN]),
  status: z.enum(['ACTIVE', 'DISABLED']),
});

export function EmployeeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManageEmployee = user?.role === ROLES.ADMIN;
  const [employee, setEmployee] = useState(null);
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
    resolver: zodResolver(employeeDetailSchema),
  });

  useEffect(() => {
    async function loadEmployee() {
      try {
        const result = await getEmployee(id);
        setEmployee(result.user);
        reset({
          fullName: result.user.fullName,
          department: result.user.department || '',
          jobTitle: result.user.jobTitle || '',
          role: result.user.role,
          status: result.user.status === 'LOCKED' ? 'ACTIVE' : result.user.status,
        });
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Failed to load employee');
      }
    }

    loadEmployee();
  }, [id, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const result = await updateEmployee(id, values);
      setEmployee(result.user);
      reset({
        fullName: result.user.fullName,
        department: result.user.department || '',
        jobTitle: result.user.jobTitle || '',
        role: result.user.role,
        status: result.user.status === 'LOCKED' ? 'ACTIVE' : result.user.status,
      });
      setNotice('Employee updated successfully');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to update the employee.');
    }
  });

  const handleUnlock = async () => {
    setErrorMessage(null);

    try {
      const result = await unlockEmployee(id);
      setEmployee(result.user);
      reset({
        fullName: result.user.fullName,
        department: result.user.department || '',
        jobTitle: result.user.jobTitle || '',
        role: result.user.role,
        status: result.user.status,
      });
      setNotice('Employee account unlocked');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to unlock the employee.');
    }
  };

  if (!employee && !errorMessage) {
    return <PageLoader label="Loading employee..." />;
  }

  return (
    <Card className="border border-slate-800 bg-slate-900/80">
      <CardHeader className="flex flex-col items-start gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Employee detail</p>
        <h2 className="text-2xl font-semibold text-white">{employee?.fullName || 'Employee'}</h2>
        <Link className="text-sm text-cyan-300 hover:text-cyan-200" to={APP_ROUTES.EMPLOYEES}>
          Back to employee directory
        </Link>
      </CardHeader>
      <CardBody className="space-y-4">
        {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
        {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <TextField fullWidth name="workEmail">
            <Label>Work email</Label>
            <Input value={employee?.workEmail || ''} isReadOnly />
          </TextField>
          <TextField fullWidth name="currentStatus">
            <Label>Current status</Label>
            <Input value={employee?.status || ''} isReadOnly />
          </TextField>
        </div>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={canManageEmployee ? onSubmit : (event) => event.preventDefault()}
        >
          <TextField fullWidth isInvalid={Boolean(errors.fullName)} name="fullName">
            <Label>Full name</Label>
            <Input {...register('fullName')} isReadOnly={!canManageEmployee} />
            {errors.fullName ? <FieldError>{errors.fullName.message}</FieldError> : null}
          </TextField>
          <TextField fullWidth isInvalid={Boolean(errors.department)} name="department">
            <Label>Department</Label>
            <Input {...register('department')} isReadOnly={!canManageEmployee} />
            {errors.department ? <FieldError>{errors.department.message}</FieldError> : null}
          </TextField>
          <TextField fullWidth isInvalid={Boolean(errors.jobTitle)} name="jobTitle">
            <Label>Job title</Label>
            <Input {...register('jobTitle')} isReadOnly={!canManageEmployee} />
            {errors.jobTitle ? <FieldError>{errors.jobTitle.message}</FieldError> : null}
          </TextField>
          <label className="space-y-2 text-sm text-slate-200">
            <span className="block">Role</span>
            <select
              className="app-select"
              value={watch('role')}
              onChange={(event) => setValue('role', event.target.value, { shouldValidate: true })}
              disabled={!canManageEmployee}
            >
              <option value={ROLES.EMPLOYEE}>{ROLES.EMPLOYEE}</option>
              <option value={ROLES.MANAGER}>{ROLES.MANAGER}</option>
              <option value={ROLES.ADMIN}>{ROLES.ADMIN}</option>
            </select>
            {errors.role ? (
              <span className="block text-xs text-rose-400">{errors.role.message}</span>
            ) : null}
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            <span className="block">Status</span>
            <select
              className="app-select"
              value={watch('status')}
              onChange={(event) => setValue('status', event.target.value, { shouldValidate: true })}
              disabled={!canManageEmployee}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISABLED">DISABLED</option>
            </select>
            {errors.status ? (
              <span className="block text-xs text-rose-400">{errors.status.message}</span>
            ) : null}
          </label>
          <div className="flex items-end gap-3">
            {canManageEmployee ? (
              <Button color="primary" isLoading={isSubmitting} type="submit">
                Save changes
              </Button>
            ) : (
              <NoticeBanner tone="info">
                Managers can view employee details, but only ADMIN users can update roles or account
                status.
              </NoticeBanner>
            )}
            {canManageEmployee && employee?.status === 'LOCKED' ? (
              <Button color="warning" type="button" variant="flat" onPress={handleUnlock}>
                Unlock account
              </Button>
            ) : null}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
