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
  verifyMfa: (code: string) => Promise<void>;
  cancelMfa: () => void;
  logout: () => Promise<void>;
  /** Demo-only: instantly log in as a canned user for the given role. */
  loginAsDemo: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  requiresMfa?: boolean;
  mfaToken?: string;
  accessToken?: string;
}

const DEMO_USER: CurrentUser = {
  id: 'demo-admin',
  name: 'Demo Admin',
  email: 'demo@mathmag.co.ke',
  role: 'LEAD_ARCHITECT',
  isActive: true,
  mfaEnabled: false,
  lastLoginAt: new Date().toISOString(),
};

/** Canned demo users — one per role group, used by the portal login cards. */
const DEMO_USERS: Partial<Record<UserRole, CurrentUser>> = {
  LEAD_ARCHITECT: DEMO_USER,
  JUNIOR_ARCHITECT: {
    id: 'demo-junior',
    name: 'Demo Junior Architect',
    email: 'junior@mathmag.co.ke',
    role: 'JUNIOR_ARCHITECT',
    isActive: true,
    mfaEnabled: false,
    lastLoginAt: new Date().toISOString(),
  },
  CLIENT_RELATIONS_OFFICER: {
    id: 'demo-cro',
    name: 'Demo CRO',
    email: 'cro@mathmag.co.ke',
    role: 'CLIENT_RELATIONS_OFFICER',
    isActive: true,
    mfaEnabled: false,
    lastLoginAt: new Date().toISOString(),
  },
  ADMIN_MANAGEMENT: {
    id: 'demo-mgmt',
    name: 'Demo Management',
    email: 'mgmt@mathmag.co.ke',
    role: 'ADMIN_MANAGEMENT',
    isActive: true,
    mfaEnabled: false,
    lastLoginAt: new Date().toISOString(),
  },
  VISITING_OFFICER: {
    id: 'demo-field',
    name: 'Demo Field Officer',
    email: 'field@mathmag.co.ke',
    role: 'VISITING_OFFICER',
    isActive: true,
    mfaEnabled: false,
    lastLoginAt: new Date().toISOString(),
  },
  CLIENT: {
    id: 'demo-client',
    name: 'Demo Client',
    email: 'client@demo.co.ke',
    role: 'CLIENT',
    isActive: true,
    mfaEnabled: false,
    lastLoginAt: new Date().toISOString(),
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    const me = await api.get<CurrentUser>('/auth/me');
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      // Demo mode: auto-login as Demo Admin (LEAD_ARCHITECT), no backend needed
      if (typeof window !== 'undefined' && isDemoMode()) {
        window.localStorage.setItem('mbms.demo', 'true');
        setUser(DEMO_USER);
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
      await loadUser();
      return 'DONE' as const;
    } catch (err) {
      setError(errorMessage(err));
      throw err;
    }
  }, [loadUser]);

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

  const loginAsDemo = useCallback(async (role: UserRole) => {
    // Activate demo mode so the whole app stays in demo state.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mbms.demo', 'true');
    }
    const demoUser = DEMO_USERS[role] ?? DEMO_USER;
    setUser({ ...demoUser, role });
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
    () => ({ user, loading, mfaToken, error, login, verifyMfa, cancelMfa, logout, loginAsDemo }),
    [user, loading, mfaToken, error, login, verifyMfa, cancelMfa, logout, loginAsDemo],
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
