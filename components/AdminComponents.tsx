import React from 'react';
import { AdminLogin } from './AdminLogin';

export { AdminLogin };

interface AdminRouteWrapperProps {
  isAdmin: boolean;
  children: React.ReactNode;
  onLogin: () => void;
}

export const AdminRouteWrapper: React.FC<AdminRouteWrapperProps> = ({ isAdmin, children, onLogin }) => {
  if (!isAdmin) {
    return <AdminLogin onLogin={onLogin} />;
  }
  return <>{children}</>;
};
