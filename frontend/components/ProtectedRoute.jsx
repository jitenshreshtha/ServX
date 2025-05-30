import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const userToken = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');

  // For admin-only routes
  if (adminOnly) {
    if (!adminToken) {
      alert('Admin access required!');
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }
    return children;
  }

  // For regular authenticated user routes
  if (!userToken) {
    alert('Please login first!');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;