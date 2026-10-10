import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('huma_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('huma_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/admin/me');
        if (res?.admin) {
          setUser(res.admin);
          localStorage.setItem('huma_admin_user', JSON.stringify(res.admin));
        }
      } catch (err) {
        console.error('Admin session validation failed:', err);
        localStorage.removeItem('huma_admin_token');
        localStorage.removeItem('huma_admin_user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/admin/login', { email, password: pass });
    const { admin, accessToken } = res;
    setToken(accessToken);
    setUser(admin);
    localStorage.setItem('huma_admin_token', accessToken);
    localStorage.setItem('huma_admin_user', JSON.stringify(admin));
  };

  const logout = async () => {
    try {
      await api.post('/auth/admin/logout');
    } catch {
      // Ignore network errors on logout
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('huma_admin_token');
    localStorage.removeItem('huma_admin_user');
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
};
