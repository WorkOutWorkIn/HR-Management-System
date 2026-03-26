import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ROLES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { createEmployee } from '@/services/employees/employees.api';

const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120, 'Full name is too long'),
  workEmail: z.string().trim().email('Enter a valid work email'),
  role: z.enum([ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN]),
  managerUserId: z.string().uuid('Select a valid manager').optional().or(z.literal('')),
  annualLeaveQuota: z.coerce
    .number()
    .min(0, 'Annual leave quota must be 0 or more')
    .max(365, 'Annual leave quota must be 365 days or fewer'),
  sickLeaveQuota: z.coerce
    .number()
    .min(0, 'Sick leave quota must be 0 or more')
    .max(365, 'Sick leave quota must be 365 days or fewer'),
  department: z.string().max(100, 'Department is too long').optional().or(z.literal('')),
  jobTitle: z.string().max(100, 'Job title is too long').optional().or(z.literal('')),
});

const defaultValues = {
  fullName: '',
  workEmail: '',
  role: ROLES.EMPLOYEE,
  managerUserId: '',
  annualLeaveQuota: 14,
  sickLeaveQuota: 14,
  department: '',
  jobTitle: '',
};

export function EmployeeOnboardingModal({
  isOpen,
  managerOptions,
  onOpenChange,
  onSuccess,
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
  });

  const roleValue = watch('role');
  const managerUserIdValue = watch('managerUserId');
  const submitError = errors.root?.message;

  function resetModalState() {
    reset(defaultValues);
  }

  function handleModalOpenChange(nextOpen) {
    if (!nextOpen) {
      resetModalState();
    }

    onOpenChange(nextOpen);
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await createEmployee({
        ...values,
        managerUserId: values.managerUserId || undefined,
      });

      resetModalState();
      onOpenChange(false);
      await onSuccess(result);
    } catch (error) {
      setError('root', {
        type: 'server',
        message:
          error?.response?.data?.message || 'Unable to create the employee account.',
      });
    }
  });

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: 'border border-[color:var(--app-border)] bg-[color:var(--app-sidebar-bg)]',
        body: 'py-6',
        footer: 'border-t border-[color:var(--app-border)]',
        header: 'border-b border-[color:var(--app-border)]',
      }}
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      isOpen={isOpen}
      placement="top-center"
      scrollBehavior="inside"
      size="3xl"
      onOpenChange={handleModalOpenChange}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col items-start gap-1">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                Employee onboarding
              </p>
              <h2 className="text-2xl font-semibold text-[color:var(--app-foreground-strong)]">
                Create a new employee account
              </h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                The onboarding email and temporary-password flow remain unchanged.
              </p>
            </ModalHeader>

            <form id="employee-onboarding-form" onSubmit={onSubmit}>
              <ModalBody>
                {submitError ? <NoticeBanner tone="danger">{submitError}</NoticeBanner> : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField fullWidth isInvalid={Boolean(errors.fullName)} name="fullName">
                    <Label>Full name</Label>
                    <Input autoFocus {...register('fullName')} />
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

                  <label className="space-y-2 text-sm text-[color:var(--app-foreground)]">
                    <span className="block">Role</span>
                    <select
                      className="app-select"
                      value={roleValue}
                      onChange={(event) =>
                        setValue('role', event.target.value, { shouldValidate: true })
                      }
                    >
                      <option value={ROLES.EMPLOYEE}>{ROLES.EMPLOYEE}</option>
                      <option value={ROLES.MANAGER}>{ROLES.MANAGER}</option>
                      <option value={ROLES.ADMIN}>{ROLES.ADMIN}</option>
                    </select>
                    <span className="text-xs text-[color:var(--app-muted)]">
                      Admin can create EMPLOYEE, MANAGER, and ADMIN accounts.
                    </span>
                    {errors.role ? (
                      <span className="block text-xs text-rose-400">{errors.role.message}</span>
                    ) : null}
                  </label>

                  <label className="space-y-2 text-sm text-[color:var(--app-foreground)]">
                    <span className="block">Line manager</span>
                    <select
                      className="app-select"
                      value={managerUserIdValue}
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
                    <span className="text-xs text-[color:var(--app-muted)]">
                      Assign a reporting line during onboarding if the employee should join a team immediately.
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

                  <TextField
                    fullWidth
                    isInvalid={Boolean(errors.sickLeaveQuota)}
                    name="sickLeaveQuota"
                    type="number"
                  >
                    <Label>Sick leave quota</Label>
                    <Input {...register('sickLeaveQuota')} />
                    {errors.sickLeaveQuota ? (
                      <FieldError>{errors.sickLeaveQuota.message}</FieldError>
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
                </div>
              </ModalBody>

              <ModalFooter>
                <Button
                  color="default"
                  isDisabled={isSubmitting}
                  type="button"
                  variant="bordered"
                  onPress={() => handleModalOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button color="primary" isLoading={isSubmitting} type="submit">
                  Create employee account
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
