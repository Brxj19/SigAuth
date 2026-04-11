import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      if (!cancelled) setLoading(false);
      return;
    }
    getMe()
      .then(res => {
        if (!cancelled) setUser(res.data.data);
      })
      .catch(() => {
        localStorage.removeItem('jwt_token');
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (token) => {
    localStorage.setItem('jwt_token', token);
    return getMe().then(res => { setUser(res.data.data); return res.data.data; });
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
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
