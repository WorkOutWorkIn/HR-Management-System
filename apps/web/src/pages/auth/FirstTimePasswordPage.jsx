import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { useAuth } from '@/hooks/useAuth';
import { validatePasswordPolicy } from '@/utils/passwordPolicy';

const setupSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .superRefine((value, context) => {
        const policyError = validatePasswordPolicy(value);

        if (policyError) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: policyError,
          });
        }
      }),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export function FirstTimePasswordPage() {
  const navigate = useNavigate();
  const { completeFirstLoginPassword, isAuthenticated, user } = useAuth();
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const {
    formState: { errors, isSubmitting, touchedFields },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(setupSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });
  const shouldShowPasswordError = touchedFields.newPassword && Boolean(errors.newPassword);

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);
    setNotice(null);

    try {
      const result = await completeFirstLoginPassword(values.newPassword);

      if (result?.user?.mustChangePassword || result?.user?.status !== 'ACTIVE') {
        throw new Error('Your account is not fully activated yet. Please try again.');
      }

      setNotice(result.message);
      reset();
      navigate(APP_ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || 'Unable to update your password right now.',
      );
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10">
        <Card className="w-full max-w-md border border-white/10 bg-slate-950/80 backdrop-blur">
          <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Secure HRMS</p>
            <div>
              <h1 className="text-2xl font-semibold text-white">Sign in to set your password</h1>
              <p className="mt-1 text-sm text-slate-400">
                Use the temporary password from your onboarding email to sign in first. Once
                authenticated, you will stay on this page to finish password setup.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4 px-6 pb-6">
            <NoticeBanner tone="info">
              This page is reserved for first-login users. Portal access stays blocked until the
              temporary password is replaced.
            </NoticeBanner>
            <Button
              as={Link}
              className="w-full"
              color="primary"
              to={`${APP_ROUTES.LOGIN}?redirect=${encodeURIComponent(APP_ROUTES.SETUP_PASSWORD)}`}
            >
              Continue to sign in
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10">
      <Card className="w-full max-w-md border border-white/10 bg-slate-950/80 backdrop-blur">
        <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Secure HRMS</p>
          <div>
            <h1 className="text-2xl font-semibold text-white">Reset your temporary password</h1>
            <p className="mt-1 text-sm text-slate-400">
              Welcome{user?.fullName ? `, ${user.fullName}` : ''}. You need to choose a new password
              before accessing the portal.
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 px-6 pb-6">
          {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}
          {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
              fullWidth
              isInvalid={shouldShowPasswordError}
              name="newPassword"
              type="password"
            >
              <Label>New password</Label>
              <Input {...register('newPassword')} />
              {shouldShowPasswordError ? (
                <FieldError>{errors.newPassword?.message}</FieldError>
              ) : null}
            </TextField>
            <TextField
              fullWidth
              isInvalid={Boolean(errors.confirmPassword)}
              name="confirmPassword"
              type="password"
            >
              <Label>Confirm password</Label>
              <Input {...register('confirmPassword')} />
              {errors.confirmPassword ? (
                <FieldError>{errors.confirmPassword.message}</FieldError>
              ) : null}
            </TextField>
            <Button className="w-full" color="primary" isLoading={isSubmitting} type="submit">
              Update password and continue
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
