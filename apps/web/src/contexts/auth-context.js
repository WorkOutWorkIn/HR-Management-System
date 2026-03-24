import { createContext } from 'react';

export const AuthContext = createContext({
  isBootstrapping: true,
  isAuthenticated: false,
  isPasswordChangeRequired: false,
  user: null,
  hasRole: () => false,
  signIn: async () => ({ success: false }),
  completeFirstLoginPassword: async () => ({ success: false }),
  signOut: async () => {},
  refreshSession: async () => null,
  updateCurrentUser: () => {},
});
