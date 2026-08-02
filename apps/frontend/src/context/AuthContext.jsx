import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const isAuthenticated = !!user;

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout API may fail, still clear local state
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    const { user: userData, token } = response.data.data;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (!token) {
        setLoading(false);
        setInitializing(false);
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('auth_user');
        }
      }

      try {
        const response = await authApi.me();
        const userData = response.data.data.user;
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    initAuth();
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);

  const value = useMemo(
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
