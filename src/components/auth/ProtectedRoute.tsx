import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <p className="text-sm font-medium text-slate-400 tracking-wide">
          Verifying InspectDB Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login preserving the attempted destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
