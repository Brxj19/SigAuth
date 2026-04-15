import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);
const ID_TOKEN_KEY = 'jwt_token';
const ACCESS_TOKEN_KEY = 'idp_access_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      if (!cancelled) setLoading(false);
      return;
    }
    getMe()
      .then(res => {
        if (!cancelled) setUser(res.data.data);
      })
      .catch(() => {
        localStorage.removeItem(ID_TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = ({ idToken, accessToken }) => {
    localStorage.setItem(ID_TOKEN_KEY, idToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    return getMe().then(res => { setUser(res.data.data); return res.data.data; });
  };

  const logout = () => {
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setUser(null);
  };

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, login, logout, setUser } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
