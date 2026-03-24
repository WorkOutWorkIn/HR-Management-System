export function bindAuthenticatedProfile(request, _response, next) {
  request.profileUserId = request.user.id;
  next();
}
