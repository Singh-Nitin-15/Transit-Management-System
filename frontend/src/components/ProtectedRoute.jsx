import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Requires any logged-in user */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

/** Requires admin role */
export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading)  return <div className="page-loading">Loading…</div>;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
