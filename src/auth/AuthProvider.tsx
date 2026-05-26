import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Tenant, User } from '../types';

interface AuthSession {
  token: string;
  user: User;
  tenants: Tenant[];
  activeTenantId: string | null;
  activeTenant: Tenant | null;
}

interface SignupInput {
  companyName: string;
  ownerName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  tenants: Tenant[];
  activeTenant: Tenant | null;
  activeTenantId: string | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  signup: (input: SignupInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<AuthSession>;
  apiFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  refreshSession: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'airaos_session_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((nextSession: AuthSession) => {
    localStorage.setItem(TOKEN_KEY, nextSession.token);
    if (nextSession.activeTenantId) {
      localStorage.setItem('agentstack_selectedTenantId', nextSession.activeTenantId);
    }
    setSession(nextSession);
    return nextSession;
  }, []);

  const apiFetch = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const activeTenantId = session?.activeTenantId || localStorage.getItem('agentstack_selectedTenantId');
    if (activeTenantId) headers.set('X-Active-Tenant-Id', activeTenantId);
    return fetch(input, { ...init, headers });
  }, [session?.activeTenantId]);

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setSession(null);
      setLoading(false);
      return null;
    }
    const res = await fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      setSession(null);
      setLoading(false);
      return null;
    }
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      setSession(null);
      setLoading(false);
      return null;
    }
    setLoading(false);
    return applySession(data);
  }, [applySession]);

  useEffect(() => {
    refreshSession().catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      setSession(null);
      setLoading(false);
    });
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error('Failed to parse login response as JSON:', text);
      throw new Error(`Server returned an invalid response (Status ${res.status}).`);
    }

    if (!res.ok) {
      console.warn(`Login failed: status ${res.status}, error:`, data.error);
      throw new Error(data.error || `Unable to sign in (Status ${res.status}).`);
    }
    return applySession(data);
  }, [applySession]);

  const signup = useCallback(async (input: SignupInput) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      console.error('Failed to parse signup response as JSON:', text);
      throw new Error(`Server returned an invalid response (Status ${res.status}).`);
    }
    if (!res.ok) {
      console.warn(`Signup failed: status ${res.status}, error:`, data.error);
      throw new Error(data.error || `Unable to create workspace (Status ${res.status}).`);
    }
    return applySession(data);
  }, [applySession]);

  const switchTenant = useCallback(async (tenantId: string) => {
    const res = await apiFetch('/api/auth/session/tenant', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId })
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (err) {
      throw new Error('Server returned an invalid response.');
    }
    if (!res.ok) throw new Error(data.error || 'Unable to switch workspace.');
    return applySession(data);
  }, [apiFetch, applySession]);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed, clearing local session.', err);
    }
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
  }, [apiFetch]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user || null,
    tenants: session?.tenants || [],
    activeTenant: session?.activeTenant || null,
    activeTenantId: session?.activeTenantId || null,
    token: session?.token || null,
    loading,
    isAuthenticated: !!session?.user,
    login,
    signup,
    logout,
    switchTenant,
    apiFetch,
    refreshSession
  }), [apiFetch, loading, login, logout, refreshSession, session, signup, switchTenant]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
