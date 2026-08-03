import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { authApi, type AuthUser } from '../api/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const isAuthenticated = !!user;

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await authApi.logout(refreshToken);
    } catch {
      // Logout API may fail, still clear local state
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { user: userData, token, refreshToken } = response.data.data;

    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (!token) {
        if (isMounted) {
          setLoading(false);
          setInitializing(false);
        }
        return;
      }

      if (storedUser) {
        try {
          if (isMounted) {
            setUser(JSON.parse(storedUser));
          }
        } catch {
          localStorage.removeItem('auth_user');
        }
      }

      try {
        const response = await authApi.me({ signal: controller.signal });
        if (isMounted) {
          const userData = response.data.data.user;
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        }
      } catch (error: any) {
        if (error?.name === 'CanceledError' || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
          return;
        }
        if (isMounted) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const hasRole = useCallback((...roles: string[]) => !!user && roles.includes(user.role), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      loading,
      initializing,
      login,
      logout,
      hasRole,
    }),
    [user, isAuthenticated, loading, initializing, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
