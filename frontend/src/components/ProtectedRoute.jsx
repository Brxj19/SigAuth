import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, claims } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Check token expiry
  if (claims?.exp && claims.exp * 1000 < Date.now()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
