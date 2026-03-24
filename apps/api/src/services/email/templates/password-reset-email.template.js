export function buildPasswordResetEmailTemplate({ fullName, resetUrl }) {
  const subject = 'Reset your Secure HRMS password';
  const text = `Hello ${fullName},

We received a request to reset your Secure HRMS password.

Reset your password here: ${resetUrl}

If you did not request this change, you can ignore this email.
`;

  const html = `
    <p>Hello ${fullName},</p>
    <p>We received a request to reset your Secure HRMS password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>If you did not request this change, you can ignore this email.</p>
  `;

  return {
    subject,
    text,
    html,
  };
}
