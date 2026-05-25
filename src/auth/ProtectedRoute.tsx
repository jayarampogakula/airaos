import React from 'react';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#070a13',
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}>
        Loading workspace...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
};
