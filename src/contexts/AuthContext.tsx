import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginSuperAdmin, loginCompanyAdmin } from '../services/authService';

interface User {
  id: string;
  name: string;
  role: string;
  tenantId?: string;
  email?: string;
  empId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'shakti_user_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  const login = async (username: string, password: string, role: string) => {
    try {
      if (role === 'SuperAdmin') {
        const authenticatedUser = await loginSuperAdmin({ username, password });
        const userData = {
          id: authenticatedUser.id,
          name: authenticatedUser.username,
          role: role
        };
        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        return;
      }

      if (role === 'CompanyAdmin' || role === 'TeamIncharge' || role === 'Telecaller') {
        const authenticatedUser = await loginCompanyAdmin({ username, password });
        const userData = {
          id: authenticatedUser.id,
          name: authenticatedUser.name || authenticatedUser.username,
          role: authenticatedUser.role || role,
          tenantId: authenticatedUser.tenantId,
          email: authenticatedUser.email,
          empId: authenticatedUser.username
        };
        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        return;
      }

      throw new Error('Invalid role');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};