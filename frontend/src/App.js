import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AcceptInvitation from './pages/AcceptInvitation';
import CompanySelect from './pages/CompanySelect';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import KanbanBoard from './pages/KanbanBoard';
import Members from './pages/Members';
import Invitations from './pages/Invitations';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Applications from './pages/Applications';
import NotFound from './pages/NotFound';

import useAuthStore from './store/authStore';

function PublicRoute({ children }) {
  const { isAuthenticated, workspace } = useAuthStore();
  if (isAuthenticated && workspace) return <Navigate to="/dashboard" replace />;
  if (isAuthenticated && !workspace) return <Navigate to="/company-select" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/invitations/accept" element={<AcceptInvitation />} />
        <Route path="/company-select" element={<CompanySelect />} />

        {/* Protected routes with dashboard layout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
