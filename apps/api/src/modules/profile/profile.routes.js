import { Router } from 'express';
import { requireAuth, requirePasswordChangeCompleted } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validate.middleware.js';
import { bindAuthenticatedProfile } from './profile.middleware.js';
import { getMyProfileController, updateMyProfileController } from './profile.controller.js';
import { updateProfileValidators } from './profile.validators.js';

const router = Router();

router.get(
  '/me',
  requireAuth,
  requirePasswordChangeCompleted,
  bindAuthenticatedProfile,
  getMyProfileController,
);
router.patch(
  '/me',
  requireAuth,
  requirePasswordChangeCompleted,
  bindAuthenticatedProfile,
  updateProfileValidators,
  validateRequest,
  updateMyProfileController,
);

export default router;
