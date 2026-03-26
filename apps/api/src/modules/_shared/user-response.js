export function serializeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    workEmail: user.workEmail,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    department: user.department,
    jobTitle: user.jobTitle,
    phoneNumber: user.phoneNumber,
    addressLine1: user.addressLine1,
    addressLine2: user.addressLine2,
    city: user.city,
    state: user.state,
    postalCode: user.postalCode,
    country: user.country,
    emergencyContactName: user.emergencyContactName,
    emergencyContactPhone: user.emergencyContactPhone,
    managerUserId: user.managerUserId,
    annualLeaveQuota:
      user.annualLeaveQuota === null || user.annualLeaveQuota === undefined
        ? null
        : Number(user.annualLeaveQuota),
    sickLeaveQuota:
      user.sickLeaveQuota === null || user.sickLeaveQuota === undefined
        ? null
        : Number(user.sickLeaveQuota),
    lockedAt: user.lockedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
