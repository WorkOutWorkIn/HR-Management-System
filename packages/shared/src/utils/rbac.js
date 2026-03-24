import { HIGHEST_ACTIVE_ROLE, PRIVILEGED_ROLES, ROLE_ORDER, ROLES } from '../constants/roles.js';

const roleIndex = new Map(ROLE_ORDER.map((role, index) => [role, index]));

export function isKnownRole(role) {
  return roleIndex.has(role);
}

export function hasRoleLevel(role, minimumRole) {
  if (!isKnownRole(role) || !isKnownRole(minimumRole)) {
    return false;
  }

  return roleIndex.get(role) >= roleIndex.get(minimumRole);
}

export function hasAnyRole(role, allowedRoles = []) {
  if (!isKnownRole(role)) {
    return false;
  }

  return allowedRoles.some((allowedRole) => hasRoleLevel(role, allowedRole));
}

export function isPrivilegedRole(role) {
  return hasAnyRole(role, PRIVILEGED_ROLES);
}

export function isAdminRole(role) {
  return role === ROLES.ADMIN;
}

export function getHighestActiveRole() {
  return HIGHEST_ACTIVE_ROLE;
}
