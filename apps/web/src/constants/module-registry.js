import { APP_ROUTES, ROLES } from '@hrms/shared';

export const moduleRegistry = Object.freeze([
  {
    key: 'profile',
    href: APP_ROUTES.PROFILE,
    label: 'My Profile',
    placeholder: false,
  },
  {
    key: 'employees',
    href: APP_ROUTES.EMPLOYEES,
    label: 'Employees',
    placeholder: false,
    allowedRoles: [ROLES.MANAGER],
  },
  {
    key: 'leave',
    href: APP_ROUTES.LEAVE,
    label: 'Leave',
    placeholder: false,
  },
  {
    key: 'org-chart',
    href: APP_ROUTES.ORG_CHART,
    label: 'Org Chart',
    placeholder: false,
  },
  {
    key: 'audit-trail',
    href: APP_ROUTES.AUDIT_TRAIL,
    label: 'Audit Trail',
    allowedRoles: [ROLES.ADMIN],
    placeholder: false,
  },
  {
    key: 'performance',
    href: APP_ROUTES.PERFORMANCE,
    label: 'Performance',
    allowedRoles: [ROLES.EMPLOYEE],
    placeholder: false,
  },
  {
    key: 'salary',
    href: APP_ROUTES.SALARY,
    label: 'Salary',
    placeholder: false,
  },
  {
    key: 'payroll',
    href: APP_ROUTES.PAYROLL,
    label: 'Payroll',
    placeholder: false,
  },
]);
