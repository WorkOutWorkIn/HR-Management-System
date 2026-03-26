import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { resetPassword } from '@/services/auth/auth.api';
import { validatePasswordPolicy } from '@/utils/passwordPolicy';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().superRefine((value, context) => {
      const policyError = validatePasswordPolicy(value);

      if (policyError) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: policyError,
        });
      }
    }),
    confirmPassword: z.string().min(12, 'Confirm your password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const hasToken = useMemo(() => Boolean(token), [token]);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const result = await resetPassword({
        token,
        newPassword: values.newPassword,
      });

      setNotice(result.message);
      navigate(APP_ROUTES.LOGIN, {
        replace: true,
        state: {
          notice: 'Password reset complete. Sign in with your new password.',
        },
      });
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to reset password.');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10">
      <Card className="w-full max-w-md border border-white/10 bg-slate-950/80 backdrop-blur">
        <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Secure HRMS</p>
          <div>
            <h1 className="text-2xl font-semibold text-white">Reset password</h1>
            <p className="mt-1 text-sm text-slate-400">
              Choose a strong new password to restore access to your account.
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 px-6 pb-6">
          {!hasToken ? (
            <NoticeBanner tone="danger">Reset token is missing or invalid.</NoticeBanner>
          ) : null}
          {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}
          {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
              fullWidth
              isInvalid={Boolean(errors.newPassword)}
              name="newPassword"
              type="password"
            >
              <Label>New password</Label>
              <Input {...register('newPassword')} />
              {errors.newPassword ? <FieldError>{errors.newPassword.message}</FieldError> : null}
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
            <Button
              color="primary"
              fullWidth
              isDisabled={!hasToken}
              isLoading={isSubmitting}
              type="submit"
            >
              Save new password
            </Button>
          </form>

          <Link className="text-sm text-cyan-300 hover:text-cyan-200" to={APP_ROUTES.LOGIN}>
            Back to sign in
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
