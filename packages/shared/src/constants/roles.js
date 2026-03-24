export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
});

export const ROLE_ORDER = Object.freeze([ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.ADMIN]);

export const HIGHEST_ACTIVE_ROLE = ROLE_ORDER[ROLE_ORDER.length - 1];

export const PRIVILEGED_ROLES = Object.freeze([ROLES.MANAGER, ROLES.ADMIN]);
