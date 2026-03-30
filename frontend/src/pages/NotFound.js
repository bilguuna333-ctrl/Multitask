import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-primary-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/dashboard" className="btn-primary"><Home className="w-4 h-4 mr-2" /> Dashboard</Link>
          <button onClick={() => window.history.back()} className="btn-secondary"><ArrowLeft className="w-4 h-4 mr-2" /> Go Back</button>
        </div>
      </div>
    </div>
  );
}
