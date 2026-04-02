import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, workspace, membership } = useAuthStore();
  const userRole = membership?.role || 'MEMBER';
  
  // Check if user is authenticated
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Check if user has workspace
  if (!workspace) return <Navigate to="/company-select" replace />;
  
  // Check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001-1h-3a1 1 0 01-1h-3a1 1 0 011-1V9a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">
            Required role: {requiredRoles.join(' or ')} | Current role: {userRole}
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return children;
}
