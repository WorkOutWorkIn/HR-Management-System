import { APP_ROUTES } from '@hrms/shared';
import env from '../../config/env.js';
import { sendEmail } from '../../services/email/email.service.js';
import { buildOnboardingEmailTemplate } from '../../services/email/templates/onboarding-email.template.js';
import { buildPasswordResetEmailTemplate } from '../../services/email/templates/password-reset-email.template.js';

function buildUrl(pathname, params = {}) {
  const url = new URL(pathname, env.frontendUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export async function dispatchOnboardingEmail({ user, temporaryPassword }) {
  const portalUrl = env.portalUrl;
  const firstLoginResetUrl = buildUrl(APP_ROUTES.SETUP_PASSWORD);
  const template = buildOnboardingEmailTemplate({
    fullName: user.fullName,
    workEmail: user.workEmail,
    temporaryPassword,
    portalUrl,
    firstLoginResetUrl,
  });
  const delivery = await sendEmail({
    to: user.workEmail,
    ...template,
  });

  return {
    ...delivery,
    kind: 'ONBOARDING',
    workEmail: user.workEmail,
  };
}

export async function dispatchPasswordResetEmail({ user, token }) {
  const resetUrl = buildUrl(APP_ROUTES.RESET_PASSWORD, { token });
  const template = buildPasswordResetEmailTemplate({
    fullName: user.fullName,
    resetUrl,
  });
  const delivery = await sendEmail({
    to: user.workEmail,
    ...template,
  });

  return {
    ...delivery,
    kind: 'PASSWORD_RESET',
    workEmail: user.workEmail,
  };
}
