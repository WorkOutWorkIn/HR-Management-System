import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState(location.state?.notice || null);
  const requestedRedirect = new URLSearchParams(location.search).get('redirect');
  const redirectTo =
    (requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
      ? requestedRedirect
      : null) ||
    location.state?.from?.pathname ||
    APP_ROUTES.PROFILE;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@hrms.local',
      password: 'Admin123!',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const session = await signIn(values);
      navigate(session.user.mustChangePassword ? APP_ROUTES.SETUP_PASSWORD : redirectTo, {
        replace: true,
      });
    } catch (error) {
      const apiMessage = error?.response?.data?.message;

      setErrorMessage(apiMessage || 'Unable to sign in. Check your credentials and try again.');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10">
      <Card className="w-full max-w-md border border-white/10 bg-slate-950/80 backdrop-blur">
        <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Secure HRMS</p>
          <div>
            <h1 className="text-2xl font-semibold text-white">Sign in</h1>
            <p className="mt-1 text-sm text-slate-400">
              Module 1 secure authentication with refresh-cookie support and account lock checks.
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 px-6 pb-6">
          {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <TextField fullWidth isInvalid={Boolean(errors.email)} name="email" type="email">
              <Label>Work email</Label>
              <Input placeholder="admin@hrms.local" {...register('email')} />
              {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
            </TextField>
            <TextField
              fullWidth
              isInvalid={Boolean(errors.password)}
              name="password"
              type="password"
            >
              <Label>Password</Label>
              <Input placeholder="Enter your password" {...register('password')} />
              {errors.password ? <FieldError>{errors.password.message}</FieldError> : null}
            </TextField>
            <Button color="primary" fullWidth isLoading={isSubmitting} type="submit">
              Sign in
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <Link className="text-cyan-300 hover:text-cyan-200" to={APP_ROUTES.FORGOT_PASSWORD}>
              Forgot password?
            </Link>
            {/* <span>
              Dev seeds: admin@hrms.local / Admin123!, manager@hrms.local / Manager123!, and
              employee@hrms.local / EmployeeTemp123!
            </span> */}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
