import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithMPIN: (mpin: string, emailOrMobile?: string) => Promise<void>;
  loginWithBiometric: (
    credentialId: string,
    emailOrMobile?: string,
    authenticatorData?: string,
    clientDataJSON?: string,
    signature?: string
  ) => Promise<void>;
  register: (name: string, email: string, mobile: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  loginWithMPIN: async () => {},
  loginWithBiometric: async () => {},
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('railone_token') || localStorage.getItem('railmate_token');
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profile = await apiRequest<User>('/users/me');
      setUser(profile);
    } catch (err: any) {
      console.warn('Failed to load profile with stored token', err);
      // ONLY clear tokens if the server explicitly returns 401 Unauthorized.
      // Never wipe tokens on network errors, timeouts, or backend spin-up delays.
      if (err?.status === 401) {
        localStorage.removeItem('railone_token');
        localStorage.removeItem('railmate_token');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const autoLoginDemo = async () => {
    try {
      const res = await apiRequest<{ access_token: string; user?: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'demo@railone.com', username: 'demo@railone.com', password: 'password123' }),
      });
      if (res?.access_token) {
        localStorage.setItem('railone_token', res.access_token);
        localStorage.setItem('railmate_token', res.access_token);
        setToken(res.access_token);
        if (res.user) {
          setUser(res.user);
        }
        const profile = await apiRequest<User>('/users/me', {
          headers: { Authorization: `Bearer ${res.access_token}` },
        });
        if (profile) setUser(profile);
      }
    } catch (e) {
      console.error('Auto login demo failed', e);
      setUser(null);
    }
  };

  useEffect(() => {
    const isLoggedOut = localStorage.getItem('railone_logged_out') === 'true';
    if (token && !isLoggedOut) {
      fetchProfile();
    } else if (!isLoggedOut && !localStorage.getItem('railone_visited')) {
      // First-time visit demo convenience only
      localStorage.setItem('railone_visited', 'true');
      autoLoginDemo().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const trimmedEmail = email.trim();
    const res = await apiRequest<{ access_token: string; user?: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: trimmedEmail, username: trimmedEmail, password: pass }),
    });
    if (!res || !res.access_token) {
      throw new Error('Authentication failed: No access token received from server');
    }
    localStorage.removeItem('railone_logged_out');
    localStorage.setItem('railone_token', res.access_token);
    localStorage.setItem('railmate_token', res.access_token);
    setToken(res.access_token);
    if (res.user) {
      setUser(res.user);
    }
    try {
      const profile = await apiRequest<User>('/users/me', {
        headers: { Authorization: `Bearer ${res.access_token}` },
      });
      if (profile) setUser(profile);
    } catch (err) {
      console.warn('Could not fetch updated /users/me after login', err);
    }
  };

  const loginWithMPIN = async (mpin: string, emailOrMobile: string = 'demo@railone.com') => {
    const res = await apiRequest<{ access_token: string; user?: User }>('/auth/mpin/verify', {
      method: 'POST',
      body: JSON.stringify({ mpin, email_or_mobile: emailOrMobile.trim() }),
    });
    if (!res || !res.access_token) {
      throw new Error('mPIN verification failed: No access token received from server');
    }
    localStorage.removeItem('railone_logged_out');
    localStorage.setItem('railone_token', res.access_token);
    localStorage.setItem('railmate_token', res.access_token);
    setToken(res.access_token);
    if (res.user) {
      setUser(res.user);
    }
    try {
      const profile = await apiRequest<User>('/users/me', {
        headers: { Authorization: `Bearer ${res.access_token}` },
      });
      if (profile) setUser(profile);
    } catch (err) {
      console.warn('Could not fetch updated /users/me after mPIN login', err);
    }
  };

  const loginWithBiometric = async (
    credentialId: string,
    emailOrMobile: string = 'demo@railone.com',
    authenticatorData?: string,
    clientDataJSON?: string,
    signature?: string
  ) => {
    const res = await apiRequest<{ access_token: string; user?: User }>('/auth/biometric/login-verify', {
      method: 'POST',
      body: JSON.stringify({
        credential_id: credentialId,
        email_or_mobile: emailOrMobile.trim(),
        authenticator_data: authenticatorData,
        client_data_json: clientDataJSON,
        signature: signature,
      }),
    });
    if (!res || !res.access_token) {
      throw new Error('Biometric authentication failed: No access token received from server');
    }
    localStorage.removeItem('railone_logged_out');
    localStorage.setItem('railone_token', res.access_token);
    localStorage.setItem('railmate_token', res.access_token);
    setToken(res.access_token);
    if (res.user) {
      setUser(res.user);
    }
    try {
      const profile = await apiRequest<User>('/users/me', {
        headers: { Authorization: `Bearer ${res.access_token}` },
      });
      if (profile) setUser(profile);
    } catch (err) {
      console.warn('Could not fetch updated /users/me after biometric login', err);
    }
  };

  const register = async (name: string, email: string, mobile: string, pass: string): Promise<User> => {
    const trimmedEmail = email.trim();
    const res = await apiRequest<{ access_token: string; user?: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: name.trim(),
        email: trimmedEmail,
        username: trimmedEmail,
        mobile: mobile.trim(),
        password: pass,
        confirm_password: pass,
      }),
    });
    if (res?.access_token) {
      localStorage.removeItem('railone_logged_out');
      localStorage.setItem('railone_token', res.access_token);
      localStorage.setItem('railmate_token', res.access_token);
      setToken(res.access_token);
    }
    if (res?.user) {
      setUser(res.user);
      return res.user;
    }
    const profile = await apiRequest<User>('/users/me', {
      headers: res?.access_token ? { Authorization: `Bearer ${res.access_token}` } : undefined,
    });
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('railone_token');
    localStorage.removeItem('railmate_token');
    localStorage.removeItem('railone_refresh_token');
    localStorage.removeItem('railmate_refresh_token');
    localStorage.setItem('railone_logged_out', 'true');
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const currentToken = localStorage.getItem('railone_token') || localStorage.getItem('railmate_token');
    if (currentToken) {
      const profile = await apiRequest<User>('/users/me');
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithMPIN,
        loginWithBiometric,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
