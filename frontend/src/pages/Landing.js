import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Shield, Users, BarChart3, ArrowRight, Zap } from 'lucide-react';

const features = [
  { icon: Users, title: 'Multi-Tenant Workspaces', desc: 'Isolated workspaces for each organization with full data separation.' },
  { icon: CheckSquare, title: 'Task Management', desc: 'Kanban boards, list views, priorities, due dates, and status workflows.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Owner, Admin, and Member roles with granular permission controls.' },
  { icon: BarChart3, title: 'Dashboard Analytics', desc: 'Real-time metrics, task breakdowns, and activity tracking.' },
  { icon: Zap, title: 'Team Collaboration', desc: 'Comments, activity logs, notifications, and member management.' },
  { icon: Shield, title: 'Secure by Design', desc: 'JWT auth, tenant isolation, input validation, and rate limiting.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MultiTask</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost">Sign In</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /> Multi-Tenant SaaS Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mx-auto">
            Task management for{' '}
            <span className="text-primary-600">modern teams</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Create your workspace, invite your team, manage projects, and track tasks — all in one secure, isolated environment.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Start Free <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything your team needs</h2>
            <p className="mt-4 text-lg text-gray-600">Powerful features designed for modern team collaboration</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-lg text-gray-600 mb-8">Create your workspace in seconds and start managing tasks today.</p>
          <Link to="/register" className="btn-primary px-8 py-3 text-base">
            Create Your Workspace <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} MultiTask. Multi-tenant Task Management SaaS.
        </div>
      </footer>
    </div>
  );
}
