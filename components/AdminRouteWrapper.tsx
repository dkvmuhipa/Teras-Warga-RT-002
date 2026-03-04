import React from 'react';
import { AdminLogin } from './AdminLogin';

interface AdminRouteWrapperProps {
  isAdmin: boolean;
  onLogin: () => void;
  children: React.ReactNode;
}

export const AdminRouteWrapper: React.FC<AdminRouteWrapperProps> = ({ isAdmin, onLogin, children }) => {
  if (!isAdmin) {
    return <AdminLogin onLogin={onLogin} />;
  }
  return <>{children}</>;
};
