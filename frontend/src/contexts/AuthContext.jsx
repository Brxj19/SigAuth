import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  LOGOUT_SYNC_KEY,
  clearStoredAuth,
  getStoredActiveOrgId,
  getStoredToken,
  readRememberBrowserPreference,
  storeActiveOrgId,
  storeAuthToken,
  syncRememberBrowserPreference,
} from '../utils/authStorage';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(payload);
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [claims, setClaims] = useState(() => {
    const t = getStoredToken();
    return t ? parseJwt(t) : null;
  });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(() => !!getStoredToken());
  const [orgId, setOrgId] = useState(() => {
    const t = getStoredToken();
    const c = t ? parseJwt(t) : null;
    if (!c) return null;
    if (c.is_super_admin) return getStoredActiveOrgId() || c.org_id || null;
    return c.org_id || null;
  });
  const [rememberBrowser, setRememberBrowser] = useState(() => readRememberBrowserPreference());

  const clearAuthState = useCallback(() => {
    setToken(null);
    setClaims(null);
    setProfile(null);
    setProfileLoading(false);
    setOrgId(null);
    clearStoredAuth();
  }, []);

  const login = useCallback((newToken, options = {}) => {
    const parsed = parseJwt(newToken);
    const nextRememberBrowser = options.rememberBrowser ?? readRememberBrowserPreference();
    const nextOrgId = parsed?.is_super_admin
      ? getStoredActiveOrgId() || parsed?.org_id || null
      : parsed?.org_id || null;

    setToken(newToken);
    setClaims(parsed);
    setProfile(null);
    setProfileLoading(true);
    setOrgId(nextOrgId);
    setRememberBrowser(nextRememberBrowser);
    storeAuthToken(newToken, nextRememberBrowser);
    if (parsed?.is_super_admin && nextOrgId) {
      storeActiveOrgId(nextOrgId, nextRememberBrowser);
    } else {
      storeActiveOrgId(null, nextRememberBrowser);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await api.post('/api/v1/logout');
    } catch {}
    clearAuthState();
    localStorage.setItem(LOGOUT_SYNC_KEY, String(Date.now()));
  }, [clearAuthState, token]);

  const updateOrgId = useCallback((nextOrgId) => {
    if (claims?.is_super_admin) {
      setOrgId(nextOrgId);
      storeActiveOrgId(nextOrgId, rememberBrowser);
      return;
    }

    setOrgId(claims?.org_id || null);
  }, [claims, rememberBrowser]);

  const updateRememberBrowserPreference = useCallback((enabled) => {
    const nextValue = Boolean(enabled);
    syncRememberBrowserPreference(nextValue);
    setRememberBrowser(nextValue);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    try {
      const res = await api.get('/api/v1/me/profile');
      const nextProfile = res.data || null;
      setProfile(nextProfile);
      return nextProfile;
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  // Auto-logout 60 seconds before token expiry
  useEffect(() => {
    if (!claims?.exp) return;
    const expiresIn = claims.exp * 1000 - Date.now() - 60000;
    if (expiresIn <= 0) { logout(); return; }
    const timer = setTimeout(logout, expiresIn);
    return () => clearTimeout(timer);
  }, [claims, logout]);

  useEffect(() => {
    if (!claims) return;
    if (claims.is_super_admin) {
      const storedOrgId = getStoredActiveOrgId();
      if (storedOrgId && storedOrgId !== orgId) setOrgId(storedOrgId);
      return;
    }

    storeActiveOrgId(null, rememberBrowser);
    if (claims.org_id !== orgId) setOrgId(claims.org_id || null);
  }, [claims, orgId, rememberBrowser]);

  useEffect(() => {
    let active = true;

    if (!token) {
      setProfile(null);
      setProfileLoading(false);
      return () => {
        active = false;
      };
    }

    setProfileLoading(true);
    api.get('/api/v1/me/profile')
      .then((res) => {
        if (!active) return;
        setProfile(res.data || null);
      })
      .catch(() => {
        if (!active) return;
        setProfile(null);
      })
      .finally(() => {
        if (!active) return;
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== LOGOUT_SYNC_KEY || !event.newValue) return;
      clearAuthState();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [clearAuthState]);

  const value = {
    token,
    claims,
    profile,
    profileLoading,
    orgId,
    setOrgId: updateOrgId,
    login,
    logout,
    refreshProfile,
    setProfile,
    rememberBrowser,
    setRememberBrowserPreference: updateRememberBrowserPreference,
    isSuperAdmin: !!claims?.is_super_admin,
    isAuthenticated: !!token && !!claims,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
