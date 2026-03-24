import { asyncHandler } from '../../utils/asyncHandler.js';
import { getMyProfile, updateMyProfile } from './profile.service.js';

export const getMyProfileController = asyncHandler(async (request, response) => {
  const user = await getMyProfile(request.profileUserId);
  response.status(200).json({ user });
});

export const updateMyProfileController = asyncHandler(async (request, response) => {
  const user = await updateMyProfile({
    userId: request.profileUserId,
    payload: request.body,
    request,
  });

  response.status(200).json({ user });
});
