import { useEffect, useMemo, useRef, useState } from 'react';
import { hasAnyRole } from '@hrms/shared';
import { AuthContext } from './auth-context';
import {
  clearRefreshSessionHint,
  clearStoredSession,
  loadStoredSession,
  markRefreshSessionExpected,
  persistSession,
  shouldAttemptSessionRefresh,
} from '@/services/auth/session';
import {
  clearAccessToken,
  registerRefreshHandler,
  setAccessToken,
} from '@/services/auth/token-manager';
import {
  completeFirstLoginPassword as completeFirstLoginPasswordApi,
  login,
  logout,
  refresh,
} from '@/services/auth/auth.api';

export function AuthProvider({ children }) {
  const initialSessionRef = useRef(loadStoredSession());
  const [session, setSession] = useState(initialSessionRef.current);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    persistSession(session);
  }, [session]);

  useEffect(() => {
    registerRefreshHandler(async () => {
      try {
        const nextSession = await refresh();

        markRefreshSessionExpected();
        setAccessToken(nextSession.accessToken);
        setSession({ user: nextSession.user });
        return nextSession;
      } catch (error) {
        clearAccessToken();
        clearStoredSession();
        clearRefreshSessionHint();
        setSession(null);
        throw error;
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      if (!shouldAttemptSessionRefresh(initialSessionRef.current)) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const nextSession = await refresh();

        if (!isMounted) {
          return;
        }

        markRefreshSessionExpected();
        setAccessToken(nextSession.accessToken);
        setSession({ user: nextSession.user });
      } catch {
        if (!isMounted) {
          return;
        }

        clearAccessToken();
        clearStoredSession();
        clearRefreshSessionHint();
        setSession(null);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(session?.user),
      isPasswordChangeRequired: Boolean(session?.user?.mustChangePassword),
      user: session?.user ?? null,
      hasRole(allowedRoles = []) {
        return hasAnyRole(session?.user?.role, allowedRoles);
      },
    async refreshSession() {
        const nextSession = await refresh();
        markRefreshSessionExpected();
        setAccessToken(nextSession.accessToken);
        setSession({ user: nextSession.user });
        return nextSession;
      },
      async completeFirstLoginPassword(newPassword) {
        const nextSession = await completeFirstLoginPasswordApi({
          newPassword,
        });

        markRefreshSessionExpected();
        setAccessToken(nextSession.accessToken);
        setSession({ user: nextSession.user });
        return nextSession;
      },
      async signIn({ email, password }) {
        const nextSession = await login({
          workEmail: email,
          password,
        });

        markRefreshSessionExpected();
        setAccessToken(nextSession.accessToken);
        setSession({ user: nextSession.user });
        return nextSession;
      },
      async signOut() {
        try {
          await logout();
        } catch {
          // Ignore logout errors and still clear client state.
        }

        clearAccessToken();
        clearStoredSession();
        clearRefreshSessionHint();
        setSession(null);
      },
      updateCurrentUser(nextUser) {
        setSession((currentSession) => ({
          ...(currentSession || {}),
          user: nextUser,
        }));
      },
    }),
    [isBootstrapping, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
