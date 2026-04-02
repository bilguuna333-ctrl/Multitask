import React, { useEffect, useState } from 'react';
import { FolderKanban, CheckSquare, AlertTriangle, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import useAuthStore from '../store/authStore';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const statusColors = { todo: 'bg-gray-100 text-gray-700', inProgress: 'bg-blue-100 text-blue-700', review: 'bg-yellow-100 text-yellow-700', done: 'bg-green-100 text-green-700' };
const statusLabels = { todo: 'To Do', inProgress: 'In Progress', review: 'Review', done: 'Done' };

const actionLabels = {
  PROJECT_CREATED: 'created a project',
  PROJECT_UPDATED: 'updated a project',
  PROJECT_ARCHIVED: 'archived a project',
  PROJECT_MEMBER_ADDED: 'added a member to project',
  PROJECT_MEMBER_REMOVED: 'removed a member from project',
  TASK_CREATED: 'created a task',
  TASK_UPDATED: 'updated a task',
  TASK_DELETED: 'deleted a task',
  TASK_ARCHIVED: 'archived a task',
  COMMENT_ADDED: 'added a comment',
  MEMBER_ROLE_UPDATED: 'updated a member role',
  MEMBER_REMOVED: 'removed a member',
  MEMBER_REACTIVATED: 'reactivated a member',
  WORKSPACE_UPDATED: 'updated workspace settings',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { workspace } = useAuthStore();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getDashboard();
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <PageLoader />;

  const metrics = [
    { label: 'Total Projects', value: data?.metrics?.totalProjects || 0, icon: FolderKanban, color: 'text-primary-600 bg-primary-50' },
    { label: 'Total Tasks', value: data?.metrics?.totalTasks || 0, icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'Overdue Tasks', value: data?.metrics?.overdueTasks || 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    { label: 'Completed Tasks', value: data?.metrics?.completedTasks || 0, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to {workspace?.name}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{m.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{m.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.color}`}>
                <m.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks by Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Status</h3>
          <div className="space-y-3">
            {data?.tasksByStatus && Object.entries(data.tasksByStatus).map(([key, value]) => {
              const total = data.metrics.totalTasks || 1;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`badge ${statusColors[key]}`}>{statusLabels[key]}</span>
                    <span className="text-sm font-medium text-gray-700">{value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks by Priority</h3>
          <div className="space-y-3">
            {data?.tasksByPriority && Object.entries(data.tasksByPriority).map(([key, value]) => {
              const colors = { low: 'bg-gray-500', medium: 'bg-blue-500', high: 'bg-orange-500', urgent: 'bg-red-500' };
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[key]}`} />
                    <span className="text-sm text-gray-700 capitalize">{key}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/projects" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="text-sm font-medium text-gray-700">View Projects</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
            </Link>
            <Link to="/tasks" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="text-sm font-medium text-gray-700">View All Tasks</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
            </Link>
            <Link to="/members" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="text-sm font-medium text-gray-700">Manage Members</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
            </Link>
            <Link to="/invitations" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <span className="text-sm font-medium text-gray-700">Invite People</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {data?.recentActivity?.length > 0 ? (
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user?.firstName} {activity.user?.lastName}</span>
                    {' '}{actionLabels[activity.action] || activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(activity.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}
