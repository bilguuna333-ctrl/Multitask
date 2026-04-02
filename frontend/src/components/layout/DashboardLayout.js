import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from '../shared/ProtectedRoute';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
