import { useMemo } from 'react';
import useAuthStore from '../store/authStore';

// Role hierarchy for permissions
const ROLE_HIERARCHY = {
  OWNER: 3,
  MANAGER: 2,
  MEMBER: 1,
};

// Role-based permissions
export const PERMISSIONS = {
  // Workspace management
  UPDATE_WORKSPACE: ['OWNER', 'MANAGER'],
  DELETE_WORKSPACE: ['OWNER'],
  
  // Member management
  INVITE_MEMBERS: ['OWNER', 'MANAGER'],
  REMOVE_MEMBERS: ['OWNER', 'MANAGER'],
  CHANGE_MEMBER_ROLES: ['OWNER', 'MANAGER'],
  VIEW_MEMBERS: ['OWNER', 'MANAGER', 'MEMBER'],
  
  // Project management
  CREATE_PROJECTS: ['OWNER', 'MANAGER'],
  EDIT_PROJECTS: ['OWNER', 'MANAGER'],
  DELETE_PROJECTS: ['OWNER', 'MANAGER'],
  VIEW_PROJECTS: ['OWNER', 'MANAGER', 'MEMBER'],
  
  // Task management
  CREATE_TASKS: ['OWNER', 'MANAGER', 'MEMBER'],
  EDIT_TASKS: ['OWNER', 'MANAGER', 'MEMBER'],
  DELETE_TASKS: ['OWNER', 'MANAGER'],
  VIEW_TASKS: ['OWNER', 'MANAGER', 'MEMBER'],
  ASSIGN_TASKS: ['OWNER', 'MANAGER'],
  
  // Application management
  VIEW_APPLICATIONS: ['OWNER', 'MANAGER'],
  ACCEPT_APPLICATIONS: ['OWNER', 'MANAGER'],
  REJECT_APPLICATIONS: ['OWNER', 'MANAGER'],
  
  // Settings
  VIEW_SETTINGS: ['OWNER', 'MANAGER'],
  EDIT_SETTINGS: ['OWNER', 'MANAGER'],
  
  // Invitations
  VIEW_INVITATIONS: ['OWNER', 'MANAGER'],
  CREATE_INVITATIONS: ['OWNER', 'MANAGER'],
  CANCEL_INVITATIONS: ['OWNER', 'MANAGER'],
};

/**
 * Custom hook for role-based permissions
 */
export function usePermissions() {
  const { membership } = useAuthStore();
  const userRole = membership?.role || 'MEMBER';

  const hasPermission = useMemo(() => {
    return (permission) => {
      const allowedRoles = PERMISSIONS[permission] || [];
      return allowedRoles.includes(userRole);
    };
  }, [userRole]);

  const isAdmin = useMemo(() => {
    return ['OWNER', 'MANAGER'].includes(userRole);
  }, [userRole]);

  const isOwner = useMemo(() => {
    return userRole === 'OWNER';
  }, [userRole]);

  const can = useMemo(() => {
    return (permission) => hasPermission(permission);
  }, [hasPermission]);

  const canEdit = useMemo(() => {
    return (resource, resourceOwner) => {
      // Owner can edit anything they own
      if (isOwner) return true;
      
      // Managers can edit most things but not workspace deletion
      if (userRole === 'MANAGER') {
        const restrictedPermissions = ['DELETE_WORKSPACE'];
        return !restrictedPermissions.includes(resource);
      }
      
      // Members can only edit their own resources
      if (userRole === 'MEMBER') {
        return resourceOwner === membership?.userId;
      }
      
      return false;
    };
  }, [isOwner, userRole, membership?.userId]);

  return {
    userRole,
    isAdmin,
    isOwner,
    hasPermission,
    can,
    canEdit,
  };
}

/**
 * Higher-order component for role-based route protection
 */
export function withRoleProtection(allowedRoles = []) {
  return function ProtectedComponent({ children, ...props }) {
    const { userRole } = usePermissions();
    
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h3a1 1 0 100-2h-3V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500">Required role: {allowedRoles.join(' or ')}</p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  }
}

/**
 * Component for showing admin-only content
 */
export function AdminOnly({ children, fallback = null }) {
  const { isAdmin } = usePermissions();
  
  if (!isAdmin) {
    return fallback;
  }
  
  return children;
}

/**
 * Component for showing owner-only content
 */
export function OwnerOnly({ children, fallback = null }) {
  const { isOwner } = usePermissions();
  
  if (!isOwner) {
    return fallback;
  }
  
  return children;
}

export default usePermissions;
