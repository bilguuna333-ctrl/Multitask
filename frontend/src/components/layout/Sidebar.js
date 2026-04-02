import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Mail,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight, User,
  Building2, FileText
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import notificationService from '../../services/notificationService';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/members', icon: Users, label: 'Members' },
  { to: '/invitations', icon: Mail, label: 'Invitations' },
  { to: '/applications', icon: FileText, label: 'Applications', adminOnly: true },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, workspace, membership, logout } = useAuthStore();
  const userRole = membership?.role || 'MEMBER';
  const isAdmin = ['OWNER', 'MANAGER'].includes(userRole);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count');
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-30 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo / Workspace */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{workspace?.name || 'Workspace'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
            {item.to === '/notifications' && unreadCount > 0 && (
              <span className={`absolute flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white ${collapsed ? 'top-1 right-2 w-4 h-4' : 'right-3 w-5 h-5'}`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
