'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, hasRequiredRole, getUserRole, getRoleBasedRedirect, type UserRole } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Add delay to ensure localStorage is available
    const checkAuth = () => {
      console.log('� ProtectedRoute: Checking authorization for role:', requiredRole);
      
      try {
        // Check authentication first
        const isUserAuthenticated = isAuthenticated();
        const userRole = getUserRole();
        
        // Handle multiple roles
        const hasValidRole = Array.isArray(requiredRole) 
          ? requiredRole.some(role => hasRequiredRole(role))
          : hasRequiredRole(requiredRole);
        
        console.log('🔐 Authentication status:', {
          isUserAuthenticated,
          userRole,
          hasValidRole,
          requiredRole
        });
        
        // If user is authenticated and has the right role, allow access
        if (isUserAuthenticated && hasValidRole) {
          console.log('✅ User is authenticated and has valid role - allowing access');
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // If not authenticated, redirect to login
        if (!isUserAuthenticated) {
          console.log('❌ Not authenticated - redirecting to login');
          
          router.push('/admin');
          return;
        }

        // If authenticated but wrong role, redirect to appropriate dashboard
        if (!hasValidRole) {
          console.log(`❌ Unauthorized access attempt:`, {
            userRole,
            requiredRole,
            path: window.location.pathname
          });
          
          // Redirect to appropriate dashboard based on user role
          if (userRole) {
            const redirect = getRoleBasedRedirect(userRole);
            router.push(redirect);
          } else {
            router.push('/admin');
          }
          return;
        }

        // This should not be reached, but handle it gracefully
        console.log('❓ Unexpected state - redirecting to login');
        router.push('/admin');
        
      } catch (error) {
        console.error('❌ Error in ProtectedRoute:', error);
        router.push('/admin');
      }
    };

    // Delay execution to ensure client-side rendering is complete
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, [requiredRole, router]);

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
          <div className="text-center bg-white p-8 rounded-lg shadow-xl">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Access</h2>
            <p className="text-gray-600">Please wait while we verify your credentials...</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )
    );
  }

  // Show children only if authorized
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
