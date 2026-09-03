"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  session: any;
  children: React.ReactNode;
}

export const ProtectedRoute = ({ session, children }: ProtectedRouteProps) => {
  const location = useLocation();

  if (!session) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?return_to=${returnTo}`} replace />;
  }

  return <>{children}</>;
};