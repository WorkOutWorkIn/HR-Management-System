import { sequelize } from '../../config/db.js';
import { writeAuditLog } from '../../audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../constants/audit-actions.js';
import { UserModel } from '../../database/models/index.js';
import { serializeUser } from '../_shared/user-response.js';
import { ApiError } from '../../utils/ApiError.js';

const EMPLOYEE_EDITABLE_FIELDS = [
  'fullName',
  'phoneNumber',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country',
  'emergencyContactName',
  'emergencyContactPhone',
];

export async function getMyProfile(userId) {
  const user = await UserModel.findByPk(userId);

  if (!user) {
    throw new ApiError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
  }

  return serializeUser(user);
}

export async function updateMyProfile({ userId, payload, request }) {
  const user = await UserModel.findByPk(userId);

  if (!user) {
    throw new ApiError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
  }

  const updates = Object.fromEntries(
    EMPLOYEE_EDITABLE_FIELDS.filter((field) => payload[field] !== undefined).map((field) => [
      field,
      payload[field],
    ]),
  );

  if (!Object.keys(updates).length) {
    throw new ApiError(400, 'No editable profile fields were provided', 'EMPTY_PROFILE_UPDATE');
  }

  const transaction = await sequelize.transaction();

  try {
    await user.update(updates, { transaction });

    await writeAuditLog(
      {
        actorUserId: user.id,
        targetUserId: user.id,
        action: AUDIT_ACTIONS.PROFILE_UPDATED,
        ipAddress: request.requestContext?.ipAddress || request.ip || null,
        userAgent: request.requestContext?.userAgent || request.get('user-agent') || null,
        metadata: {
          updatedFields: Object.keys(updates),
        },
      },
      { transaction },
    );

    await transaction.commit();

    return serializeUser(user);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
