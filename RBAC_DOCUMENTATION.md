# Role-Based Access Control (RBAC) Documentation

## 🎯 Overview

MultiTask implements a comprehensive role-based access control system to ensure that users can only access and modify features appropriate to their role level.

## 📋 Roles & Permissions

### **Role Hierarchy**
1. **OWNER** - Full control over workspace
2. **MANAGER** - Most administrative functions, except workspace deletion
3. **MEMBER** - Basic access to assigned tasks and projects

### **Permission Matrix**

| Feature | OWNER | MANAGER | MEMBER |
|---------|-------|---------|--------|
| **Workspace Management** |
| View workspace | ✅ | ✅ | ✅ |
| Edit workspace settings | ✅ | ✅ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |
| **Member Management** |
| View members list | ✅ | ✅ | ✅ |
| Invite new members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Change member roles | ✅ | ✅ | ❌ |
| **Project Management** |
| View projects | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ❌ |
| Edit projects | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ✅ | ❌ |
| **Task Management** |
| View tasks | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ |
| Edit own tasks | ✅ | ✅ | ✅ |
| Edit any tasks | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ |
| Assign tasks | ✅ | ✅ | ❌ |
| **Applications** |
| View applications | ✅ | ✅ | ❌ |
| Accept applications | ✅ | ✅ | ❌ |
| Reject applications | ✅ | ✅ | ❌ |
| **Invitations** |
| View invitations | ✅ | ✅ | ❌ |
| Create invitations | ✅ | ✅ | ❌ |
| Cancel invitations | ✅ | ✅ | ❌ |
| **Settings** |
| View settings | ✅ | ✅ | ❌ |
| Edit settings | ✅ | ✅ | ❌ |

## 🔒 Implementation Details

### **Frontend Protection**
- **Navigation**: Sidebar automatically hides admin-only items from members
- **Page Access**: Each page checks permissions before showing admin controls
- **Action Buttons**: Admin-only buttons are conditionally rendered
- **API Calls**: Permission checks before making requests

### **Backend Protection**
- **Middleware**: Role-based middleware on protected routes
- **Service Layer**: Permission validation in business logic
- **Database**: Role-based data access controls

## 🛡️ Security Features

### **Permission Checks**
```javascript
// Using the permissions hook
const { can } = usePermissions();

// Check before action
if (!can('REMOVE_MEMBERS')) {
  toast.error('You don\'t have permission to remove members');
  return;
}
```

### **Role-Based Components**
```javascript
// Admin-only content
<AdminOnly fallback={<div>Access Denied</div>}>
  <AdminControls />
</AdminOnly>

// Owner-only content
<OwnerOnly fallback={null}>
  <DangerousAction />
</OwnerOnly>
```

### **Route Protection**
```javascript
// Protected routes
<ProtectedRoute requiredRole={['OWNER', 'MANAGER']}>
  <AdminPage />
</ProtectedRoute>
```

## 📱 User Experience

### **For Members**
- Can view and edit their own tasks
- Can view projects they're assigned to
- Cannot access admin settings
- Cannot manage other members
- Cannot see applications or invitations

### **For Managers**
- All member permissions
- Can manage projects and tasks
- Can invite and remove members
- Can change member roles (except to/from Owner)
- Can view and process applications
- Can create and manage invitations
- Can edit workspace settings

### **For Owners**
- All manager permissions
- Can delete workspace
- Can change any member's role (including other owners)
- Full administrative control

## 🔄 Permission System Architecture

### **usePermissions Hook**
```javascript
export function usePermissions() {
  return {
    userRole,           // Current user's role
    isAdmin,            // Is OWNER or MANAGER
    isOwner,            // Is OWNER
    hasPermission,     // Check specific permission
    can,               // Alias for hasPermission
    canEdit,           // Check edit permissions
  };
}
```

### **Permission Constants**
```javascript
export const PERMISSIONS = {
  UPDATE_WORKSPACE: ['OWNER', 'MANAGER'],
  DELETE_WORKSPACE: ['OWNER'],
  INVITE_MEMBERS: ['OWNER', 'MANAGER'],
  // ... more permissions
};
```

## 🧪 Testing Role-Based Access

### **Test Scenarios**
1. **Member Access Test**: Verify members cannot access admin areas
2. **Manager Limitations Test**: Verify managers cannot delete workspace
3. **Owner Full Access Test**: Verify owners can access all features
4. **Permission Inheritance Test**: Verify higher roles include lower role permissions

### **Manual Testing**
```javascript
// In browser console
window.testToasts.success('Test message');

// Check current user role
localStorage.getItem('membership');

// Test permissions (if permissions hook is exposed)
// This would require exposing the hook for testing
```

## 🚀 Deployment Notes

### **Environment Variables**
No additional environment variables needed for RBAC. Role information is stored in the database and JWT tokens.

### **Database Schema**
Roles are stored in the `Membership` table with the following structure:
- `role`: 'OWNER' | 'MANAGER' | 'MEMBER'
- `userId`: Foreign key to User table
- `workspaceId`: Foreign key to Workspace table

### **Security Considerations**
- All permission checks are both frontend and backend validated
- JWT tokens contain role information for server-side validation
- Database queries include role-based filtering where appropriate
- Sensitive operations require multiple permission checks

## 📚 Implementation Files

### **Frontend Files**
- `src/hooks/usePermissions.js` - Permission system hook
- `src/pages/*.js` - Individual page implementations
- `src/components/layout/Sidebar.js` - Navigation restrictions

### **Backend Files**
- `src/middlewares/roles.js` - Role-based middleware
- `src/services/*.js` - Service layer permissions
- `src/controllers/*.js` - Controller validation

## 🔧 Customization

### **Adding New Permissions**
1. Add to `PERMISSIONS` object in `usePermissions.js`
2. Add backend validation if needed
3. Update UI components to use new permission

### **Modifying Role Hierarchy**
1. Update `ROLE_HIERARCHY` in `usePermissions.js`
2. Update permission arrays
3. Test all role combinations

### **Adding New Roles**
1. Add role to hierarchy
2. Define permissions for new role
3. Update database schema if needed
4. Add UI elements for new role

This RBAC system ensures that users can only access features appropriate to their role, providing both security and a clear user experience. 🎉
