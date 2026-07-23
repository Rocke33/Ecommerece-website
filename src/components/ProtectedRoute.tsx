import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null); // 🚀 Changed to null to track loading state accurately
  const [loading, setLoading] = useState<boolean>(true); // 🚀 Explicit layout lifecycle flag

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setIsAdminUser(false);
          return;
        }

        setIsAuthenticated(true);

        // If the path requires administrative clearance
        if (requireAdmin) {
          // Check user metadata or verify through your specific validation criteria
          const isUserAdmin = user.user_metadata?.role === 'admin' || user.email?.endsWith('@admin.com');
          setIsAdminUser(!!isUserAdmin);
        } else {
          setIsAdminUser(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setIsAdminUser(false);
      } finally {
        setLoading(false); // 🔒 Only turn off loading flag once all states are resolved!
      }
    };

    checkAuth();
  }, [requireAdmin]);

  // ⏳ Hold structural renders open until the auth metadata pipeline finishes executing completely
  if (loading || isAuthenticated === null || (requireAdmin && isAdminUser === null)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-400 tracking-wide animate-pulse">Verifying Security Clearance...</span>
        </div>
      </div>
    );
  }

  // 🚨 1. Unauthenticated users get shifted out to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 🚨 2. Authenticated non-admins get cleanly turned back away from internal administrative route spaces
  if (requireAdmin && !isAdminUser) {
    return <Navigate to="/" replace />;
  }

  // ✅ 3. Security verification pass succeeded
  return children;
}