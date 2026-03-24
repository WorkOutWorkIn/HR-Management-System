export const passwordPolicyChecks = [
  {
    test: (value) => value.length >= 12,
    message: 'Password must be at least 12 characters',
  },
  {
    test: (value) => value.length <= 128,
    message: 'Password must be at most 128 characters',
  },
  {
    test: (value) => /[A-Z]/.test(value),
    message: 'Password must contain at least one uppercase letter',
  },
  {
    test: (value) => /[a-z]/.test(value),
    message: 'Password must contain at least one lowercase letter',
  },
  {
    test: (value) => /[0-9]/.test(value),
    message: 'Password must contain at least one number',
  },
  {
    test: (value) => /[^A-Za-z0-9]/.test(value),
    message: 'Password must contain at least one special character',
  },
];

export function getFailedPasswordPolicyMessages(value = '') {
  if (!value) {
    return ['Password is required'];
  }

  return passwordPolicyChecks
    .filter((rule) => !rule.test(value))
    .map((rule) => rule.message.replace(/^Password must /, ''));
}

export function getPasswordPolicySummary(value = '') {
  const failedMessages = getFailedPasswordPolicyMessages(value);

  if (!failedMessages.length) {
    return null;
  }

  if (failedMessages[0] === 'Password is required') {
    return failedMessages[0];
  }

  if (failedMessages.length === 1) {
    return `Password must ${failedMessages[0]}.`;
  }

  const lastMessage = failedMessages.at(-1);
  const leadingMessages = failedMessages.slice(0, -1);

  return `Password must ${leadingMessages.join(', ')}, and ${lastMessage}.`;
}

export function validatePasswordPolicy(value) {
  return getPasswordPolicySummary(value);
}
