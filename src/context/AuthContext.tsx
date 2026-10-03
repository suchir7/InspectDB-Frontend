import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, LoginInput, RegisterInput } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<UserProfile>;
  register: (input: RegisterInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch {
      // Invalid or expired token
      api.setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (input: LoginInput): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const response = await api.login(input);
      setCurrentUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const response = await api.register(input);
      setCurrentUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      api.setToken(null);
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
