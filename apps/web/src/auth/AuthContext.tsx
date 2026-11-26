// src/auth/AuthContext.tsx
// Real authentication against the MBMS API, including the MFA second factor.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, errorMessage, getAccessToken, isDemoMode, setAccessToken } from '../lib/api';
import type { CurrentUser, UserRole } from '../lib/types';

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  mfaToken: string | null;
  error: string | null;
  login: (email: string, password: string) => Promise<'MFA' | 'DONE'>;
  signup: (fullName: string, email: string, password: string, role: UserRole) => Promise<CurrentUser>;
  verifyMfa: (code: string) => Promise<void>;
  cancelMfa: () => void;
  logout: () => Promise<void>;
  /** Demo guide: opens a walkthrough overlay without touching auth state or tokens. */
  demoGuideActive: boolean;
  openDemoGuide: () => void;
  closeDemoGuide: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  requiresMfa?: boolean;
  mfaToken?: string;
  accessToken?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoGuideActive, setDemoGuideActive] = useState(false);

  const loadUser = useCallback(async () => {
    const me = await api.get<CurrentUser>('/auth/me');
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      // Demo mode: do NOT auto-login. Let the login page show so users can
      // choose between demo login or entering real credentials.
      if (typeof window !== 'undefined' && isDemoMode()) {
        setLoading(false);
        return;
      }
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await loadUser();
        if (!cancelled) setUser(me);
      } catch {
        setAccessToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });
      if (response.requiresMfa && response.mfaToken) {
        setMfaToken(response.mfaToken);
        return 'MFA' as const;
      }
      if (!response.accessToken) throw new Error('The server did not return an access token');
      setAccessToken(response.accessToken);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('mbms.demo', 'false');
      }
      await loadUser();
      return 'DONE' as const;
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    }
  }, [loadUser]);

  const signup = useCallback(async (fullName: string, email: string, password: string, role: UserRole) => {
    setError(null);
    try {
      const response = await api.post<{ accessToken?: string; user?: CurrentUser }>('/auth/signup', {
        fullName,
        email,
        password,
        role,
      });
      if (!response.accessToken) throw new Error('The server did not return an access token');
      setAccessToken(response.accessToken);
      const nextUser = response.user ?? {
        id: `signup-${email}`,
        name: fullName || 'New MBMS User',
        email,
        role,
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        mfaEnabled: false,
      };
      if (typeof window !== 'undefined') {
        // After a real signup, stay in live mode so all API calls hit the
        // real backend. Do NOT activate demo mode here.
        window.localStorage.setItem('mbms.demo', 'false');
      }
      setUser(nextUser);
      return nextUser;
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    }
  }, []);

  const verifyMfa = useCallback(
    async (code: string) => {
      if (!mfaToken) throw new Error('No MFA challenge in progress');
      setError(null);
      try {
        const response = await api.post<{ accessToken: string }>('/auth/mfa/verify', {
          mfaToken,
          code,
        });
        setAccessToken(response.accessToken);
        setMfaToken(null);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mbms.demo', 'false');
        }
        await loadUser();
      } catch (err) {
        setError(errorMessage(err));
        throw err;
      }
    },
    [loadUser, mfaToken],
  );

  const cancelMfa = useCallback(() => {
    setMfaToken(null);
    setError(null);
  }, []);

  const openDemoGuide = useCallback(() => {
    setDemoGuideActive(true);
  }, []);

  const closeDemoGuide = useCallback(() => {
    setDemoGuideActive(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The local session is cleared even if the server is unreachable.
    }
    setAccessToken(null);
    setUser(null);
    setMfaToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, mfaToken, error, login, signup, verifyMfa, cancelMfa, logout, demoGuideActive, openDemoGuide, closeDemoGuide }),
    [user, loading, mfaToken, error, login, signup, verifyMfa, cancelMfa, logout, demoGuideActive, openDemoGuide, closeDemoGuide],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function homeForRole(role: UserRole): string {
  if (role === 'CLIENT') return '/portal';
  if (role === 'VISITING_OFFICER') return '/field';
  // All staff roles: LEAD_ARCHITECT, JUNIOR_ARCHITECT, CLIENT_RELATIONS_OFFICER, ADMIN_MANAGEMENT
  return '/staff';
}

export function canReviewReports(role: UserRole): boolean {
  return role === 'LEAD_ARCHITECT';
}

export function isStaffRole(role: UserRole): boolean {
  return role !== 'CLIENT';
}
