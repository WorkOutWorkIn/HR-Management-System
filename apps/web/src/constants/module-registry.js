import { APP_ROUTES, ROLES } from '@hrms/shared';

export const moduleRegistry = Object.freeze([
  {
    key: 'dashboard',
    href: APP_ROUTES.DASHBOARD,
    label: 'Dashboard',
    placeholder: false,
  },
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
    key: 'performance',
    href: APP_ROUTES.PERFORMANCE,
    label: 'Performance',
    title: 'Performance',
    description: 'Performance reviews, goals, and manager workflows are intentionally scaffold-only for now.',
    allowedRoles: [ROLES.MANAGER],
    placeholder: true,
  },
  {
    key: 'salary',
    href: APP_ROUTES.SALARY,
    label: 'Salary',
    title: 'Salary',
    description: 'Salary records and future versioning controls will be introduced in this module.',
    allowedRoles: [ROLES.MANAGER],
    placeholder: true,
  },
  {
    key: 'payroll',
    href: APP_ROUTES.PAYROLL,
    label: 'Payroll',
    title: 'Payroll',
    description: 'Payroll runs and locking logic are deferred, but the route boundary is ready.',
    allowedRoles: [ROLES.MANAGER],
    placeholder: true,
  },
]);
