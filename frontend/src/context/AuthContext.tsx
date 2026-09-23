import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, mobile: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('railmate_token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await apiRequest<User>('/users/me');
      setUser(profile);
    } catch (err) {
      console.warn('Failed to load profile with stored token', err);
      // Auto-fallback to login demo user for effortless seamless experience
      await autoLoginDemo();
    } finally {
      setLoading(false);
    }
  };

  const autoLoginDemo = async () => {
    try {
      const res = await apiRequest<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'demo@railmate.com', password: 'password123' }),
      });
      localStorage.setItem('railmate_token', res.access_token);
      setToken(res.access_token);
      const profile = await apiRequest<User>('/users/me');
      setUser(profile);
    } catch (e) {
      console.error('Auto login demo failed', e);
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      // Automatically log in demo user so app is instantly ready with "Hi, Manali Manish Gharat!"
      autoLoginDemo().finally(() => setLoading(false));
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiRequest<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    localStorage.setItem('railmate_token', res.access_token);
    setToken(res.access_token);
    const profile = await apiRequest<User>('/users/me');
    setUser(profile);
  };

  const register = async (name: string, email: string, mobile: string, pass: string) => {
    const res = await apiRequest<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: name, email, mobile, password: pass }),
    });
    localStorage.setItem('railmate_token', res.access_token);
    setToken(res.access_token);
    const profile = await apiRequest<User>('/users/me');
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('railmate_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (token) {
      const profile = await apiRequest<User>('/users/me');
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
