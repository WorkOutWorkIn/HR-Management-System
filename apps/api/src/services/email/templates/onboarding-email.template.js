export function buildOnboardingEmailTemplate({
  fullName,
  workEmail,
  temporaryPassword,
  portalUrl,
  firstLoginResetUrl,
}) {
  const subject = 'Your Secure HRMS account has been created';
  const text = `Hello ${fullName},

Your Secure HRMS account has been created.

Work email: ${workEmail}
Temporary password: ${temporaryPassword}

Please sign in to the application portal and reset your password immediately.

Application portal: ${portalUrl}
First-login password reset page: ${firstLoginResetUrl}

For security reasons, do not share this temporary password. Once you reset your password successfully, the temporary password will stop working.

If you need help accessing your account, please contact the HRMS support team.
`;

  const html = `
    <p>Hello ${fullName},</p>
    <p>Your Secure HRMS account has been created.</p>
    <p><strong>Work email:</strong> ${workEmail}<br /><strong>Temporary password:</strong> ${temporaryPassword}</p>
    <p>Please sign in to the application portal and reset your password immediately.</p>
    <p><a href="${portalUrl}">Open the application portal</a></p>
    <p><a href="${firstLoginResetUrl}">Go directly to the first-login password reset page</a></p>
    <p>For security reasons, do not share this temporary password. Once you reset your password successfully, the temporary password will stop working.</p>
    <p>If you need help accessing your account, please contact the HRMS support team.</p>
  `;

  return {
    subject,
    text,
    html,
  };
}
