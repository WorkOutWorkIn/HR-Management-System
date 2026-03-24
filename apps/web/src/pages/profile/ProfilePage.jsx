import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { APP_ROUTES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PageLoader } from '@/components/common/PageLoader';
import { FieldError, Input, Label, TextField } from '@/components/forms/TextField';
import { OrgAvatar } from '@/components/org-chart/OrgAvatar';
import { OrganizationalFocusSection } from '@/components/org-chart/OrganizationalFocusSection';
import { RoleBadge } from '@/components/org-chart/RoleBadge';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/services/auth/auth.api';
import { loadOrganizationalFocusWorkspace } from '@/services/org-chart/orgChart.workspace';
import { getMyProfile, updateMyProfile } from '@/services/profile/profile.api';
import { validatePasswordPolicy } from '@/utils/passwordPolicy';

const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120, 'Full name is too long'),
  phoneNumber: z.string().max(30, 'Phone number is too long').optional().or(z.literal('')),
  addressLine1: z.string().max(160, 'Address is too long').optional().or(z.literal('')),
  addressLine2: z.string().max(160, 'Address is too long').optional().or(z.literal('')),
  city: z.string().max(80, 'City is too long').optional().or(z.literal('')),
  state: z.string().max(80, 'State is too long').optional().or(z.literal('')),
  postalCode: z.string().max(20, 'Postal code is too long').optional().or(z.literal('')),
  country: z.string().max(80, 'Country is too long').optional().or(z.literal('')),
  emergencyContactName: z
    .string()
    .max(120, 'Emergency contact name is too long')
    .optional()
    .or(z.literal('')),
  emergencyContactPhone: z
    .string()
    .max(30, 'Emergency contact phone is too long')
    .optional()
    .or(z.literal('')),
});

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().superRefine((value, context) => {
      const policyError = validatePasswordPolicy(value);

      if (policyError) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: policyError,
        });
      }
    }),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

export function ProfilePage() {
  const navigate = useNavigate();
  const profileFormRef = useRef(null);
  const { signOut, updateCurrentUser, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [organizationFocus, setOrganizationFocus] = useState(null);
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
  });
  const {
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
    handleSubmit: handlePasswordSubmit,
    register: registerPassword,
    reset: resetPasswordForm,
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileResult, orgFocusResult] = await Promise.all([
          getMyProfile(),
          loadOrganizationalFocusWorkspace(user),
        ]);

        setProfile(profileResult.user);
        setOrganizationFocus(orgFocusResult);
        reset({
          fullName: profileResult.user.fullName || '',
          phoneNumber: profileResult.user.phoneNumber || '',
          addressLine1: profileResult.user.addressLine1 || '',
          addressLine2: profileResult.user.addressLine2 || '',
          city: profileResult.user.city || '',
          state: profileResult.user.state || '',
          postalCode: profileResult.user.postalCode || '',
          country: profileResult.user.country || '',
          emergencyContactName: profileResult.user.emergencyContactName || '',
          emergencyContactPhone: profileResult.user.emergencyContactPhone || '',
        });
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Failed to load profile');
      }
    }

    loadProfile();
  }, [reset, user]);

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null);

    try {
      const result = await updateMyProfile(values);
      setProfile(result.user);
      updateCurrentUser(result.user);
      setNotice('Profile updated successfully');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to update your profile.');
    }
  });

  const onChangePassword = handlePasswordSubmit(async (values) => {
    setPasswordErrorMessage(null);

    try {
      const result = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      setPasswordNotice(result.message);
      resetPasswordForm();
      await signOut();
      navigate(APP_ROUTES.LOGIN, {
        replace: true,
        state: {
          notice: 'Password changed successfully. Sign in again with your new password.',
        },
      });
    } catch (error) {
      setPasswordErrorMessage(error?.response?.data?.message || 'Unable to change your password.');
    }
  });

  if (!profile && !errorMessage) {
    return <PageLoader label="Loading your profile..." />;
  }

  return (
    <div className="space-y-6">
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      <section className="rounded-[34px] border border-white/8 bg-slate-900/80 p-7 shadow-[0_22px_55px_rgba(2,12,27,0.4)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-6">
            <OrgAvatar name={profile?.fullName || user?.fullName} size="xl" accent="cyan" />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">My Profile</p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight text-white">
                {profile?.fullName}
              </h1>
              <p className="mt-3 text-xl text-cyan-200/90">
                {profile?.jobTitle || profile?.role}
                {profile?.department ? ` • ${profile.department}` : ''}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <RoleBadge label={profile?.status || 'ACTIVE'} tone={profile?.status || 'ACTIVE'} />
                <RoleBadge label={profile?.role || user?.role} tone={profile?.role || user?.role} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              color="primary"
              onPress={() => profileFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
              Edit Profile
            </Button>
            <Button
              isIconOnly
              radius="lg"
              variant="light"
              className="border border-white/8 text-slate-300"
            >
              •••
            </Button>
          </div>
        </div>
      </section>

      <OrganizationalFocusSection
        manager={organizationFocus?.manager}
        directReports={organizationFocus?.directReports || []}
      />

      <div ref={profileFormRef}>
        <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Profile</p>
            <h2 className="text-3xl font-semibold text-white">Personal details</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField fullWidth name="workEmail">
                <Label>Work email</Label>
                <Input value={profile?.workEmail || ''} isReadOnly />
              </TextField>
              <TextField fullWidth name="role">
                <Label>Role</Label>
                <Input value={profile?.role || ''} isReadOnly />
              </TextField>
              <TextField fullWidth name="departmentReadOnly">
                <Label>Department</Label>
                <Input value={profile?.department || ''} isReadOnly />
              </TextField>
              <TextField fullWidth name="jobTitleReadOnly">
                <Label>Job title</Label>
                <Input value={profile?.jobTitle || ''} isReadOnly />
              </TextField>
            </div>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField fullWidth isInvalid={Boolean(errors.fullName)} name="fullName">
                  <Label>Full name</Label>
                  <Input {...register('fullName')} />
                  {errors.fullName ? <FieldError>{errors.fullName.message}</FieldError> : null}
                </TextField>
                <TextField
                  fullWidth
                  isInvalid={Boolean(errors.phoneNumber)}
                  name="phoneNumber"
                  type="tel"
                >
                  <Label>Phone number</Label>
                  <Input {...register('phoneNumber')} />
                  {errors.phoneNumber ? (
                    <FieldError>{errors.phoneNumber.message}</FieldError>
                  ) : null}
                </TextField>
                <TextField fullWidth isInvalid={Boolean(errors.addressLine1)} name="addressLine1">
                  <Label>Address line 1</Label>
                  <Input {...register('addressLine1')} />
                  {errors.addressLine1 ? (
                    <FieldError>{errors.addressLine1.message}</FieldError>
                  ) : null}
                </TextField>
                <TextField fullWidth isInvalid={Boolean(errors.addressLine2)} name="addressLine2">
                  <Label>Address line 2</Label>
                  <Input {...register('addressLine2')} />
                  {errors.addressLine2 ? (
                    <FieldError>{errors.addressLine2.message}</FieldError>
                  ) : null}
                </TextField>
                <TextField fullWidth isInvalid={Boolean(errors.city)} name="city">
                  <Label>City</Label>
                  <Input {...register('city')} />
                  {errors.city ? <FieldError>{errors.city.message}</FieldError> : null}
                </TextField>
                <TextField fullWidth isInvalid={Boolean(errors.state)} name="state">
                  <Label>State</Label>
                  <Input {...register('state')} />
                  {errors.state ? <FieldError>{errors.state.message}</FieldError> : null}
                </TextField>
                <TextField fullWidth isInvalid={Boolean(errors.postalCode)} name="postalCode">
                  <Label>Postal code</Label>
                  <Input {...register('postalCode')} />
                  {errors.postalCode ? <FieldError>{errors.postalCode.message}</FieldError> : null}
                </TextField>
                <TextField fullWidth isInvalid={Boolean(errors.country)} name="country">
                  <Label>Country</Label>
                  <Input {...register('country')} />
                  {errors.country ? <FieldError>{errors.country.message}</FieldError> : null}
                </TextField>
                <TextField
                  fullWidth
                  isInvalid={Boolean(errors.emergencyContactName)}
                  name="emergencyContactName"
                >
                  <Label>Emergency contact name</Label>
                  <Input {...register('emergencyContactName')} />
                  {errors.emergencyContactName ? (
                    <FieldError>{errors.emergencyContactName.message}</FieldError>
                  ) : null}
                </TextField>
                <TextField
                  fullWidth
                  isInvalid={Boolean(errors.emergencyContactPhone)}
                  name="emergencyContactPhone"
                  type="tel"
                >
                  <Label>Emergency contact phone</Label>
                  <Input {...register('emergencyContactPhone')} />
                  {errors.emergencyContactPhone ? (
                    <FieldError>{errors.emergencyContactPhone.message}</FieldError>
                  ) : null}
                </TextField>
              </div>
              <Button color="primary" isLoading={isSubmitting} type="submit">
                Save profile
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Security</p>
          <h2 className="text-3xl font-semibold text-white">Change password</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {passwordNotice ? <NoticeBanner tone="success">{passwordNotice}</NoticeBanner> : null}
          {passwordErrorMessage ? (
            <NoticeBanner tone="danger">{passwordErrorMessage}</NoticeBanner>
          ) : null}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onChangePassword}>
            <TextField
              fullWidth
              isInvalid={Boolean(passwordErrors.oldPassword)}
              name="oldPassword"
              type="password"
            >
              <Label>Current password</Label>
              <Input {...registerPassword('oldPassword')} />
              {passwordErrors.oldPassword ? (
                <FieldError>{passwordErrors.oldPassword.message}</FieldError>
              ) : null}
            </TextField>
            <div />
            <TextField
              fullWidth
              isInvalid={Boolean(passwordErrors.newPassword)}
              name="newPassword"
              type="password"
            >
              <Label>New password</Label>
              <Input {...registerPassword('newPassword')} />
              {passwordErrors.newPassword ? (
                <FieldError>{passwordErrors.newPassword.message}</FieldError>
              ) : null}
            </TextField>
            <TextField
              fullWidth
              isInvalid={Boolean(passwordErrors.confirmPassword)}
              name="confirmPassword"
              type="password"
            >
              <Label>Confirm new password</Label>
              <Input {...registerPassword('confirmPassword')} />
              {passwordErrors.confirmPassword ? (
                <FieldError>{passwordErrors.confirmPassword.message}</FieldError>
              ) : null}
            </TextField>
            <div className="md:col-span-2">
              <Button color="primary" isLoading={isChangingPassword} type="submit">
                Change password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
