import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { forgotPassword } from '@/services/auth/auth.api';

const forgotPasswordSchema = z.object({
  workEmail: z.string().email('Enter a valid work email'),
});

export function ForgotPasswordPage() {
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      workEmail: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const result = await forgotPassword(values);
      setNotice(result.message);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to submit your request right now.');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10">
      <Card className="w-full max-w-md border border-white/10 bg-slate-950/80 backdrop-blur">
        <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Secure HRMS</p>
          <div>
            <h1 className="text-2xl font-semibold text-white">Forgot password</h1>
            <p className="mt-1 text-sm text-slate-400">
              Submit your work email and we&apos;ll send reset instructions if the account is
              eligible.
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 px-6 pb-6">
          {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
          {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
              fullWidth
              isInvalid={Boolean(errors.workEmail)}
              name="workEmail"
              type="email"
            >
              <Label>Work email</Label>
              <Input placeholder="employee@hrms.local" {...register('workEmail')} />
              {errors.workEmail ? <FieldError>{errors.workEmail.message}</FieldError> : null}
            </TextField>
            <Button color="primary" fullWidth isLoading={isSubmitting} type="submit">
              Send reset instructions
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
