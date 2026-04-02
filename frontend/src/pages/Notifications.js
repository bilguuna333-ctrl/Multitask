import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const typeIcon = { 
  TASK_ASSIGNED: 'bg-blue-100 text-blue-600', 
  COMMENT_ADDED: 'bg-green-100 text-green-600', 
  DUE_DATE_CHANGED: 'bg-orange-100 text-orange-600', 
  INVITE_SENT: 'bg-purple-100 text-purple-600',
  INVITATION_RECEIVED: 'bg-pink-100 text-pink-600',
  INVITATION_ACCEPTED: 'bg-indigo-100 text-indigo-600',
  APPLICATION_RECEIVED: 'bg-cyan-100 text-cyan-600',
  APPLICATION_ACCEPTED: 'bg-emerald-100 text-emerald-600',
  APPLICATION_REJECTED: 'bg-rose-100 text-rose-600',
  MEMBER_ROLE_UPDATED: 'bg-amber-100 text-amber-600',
  MEMBER_REACTIVATED: 'bg-teal-100 text-teal-600',
  PROJECT_MEMBER_ADDED: 'bg-violet-100 text-violet-600',
  TASK_APPROVED: 'bg-green-100 text-green-600',
  TASK_REJECTED: 'bg-red-100 text-red-600',
  SUBMISSION_REVIEW: 'bg-yellow-100 text-yellow-600'
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('All marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) await handleMarkRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary">
            <CheckCheck className="w-4 h-4 mr-2" /> Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="card divide-y divide-gray-100">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-primary-50/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeIcon[notif.type] || 'bg-gray-100 text-gray-600'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.title}</p>
                  {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notif.isRead && (
                  <button onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }} className="p-1.5 hover:bg-gray-200 rounded-lg" title="Mark as read">
                    <Check className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                {notif.link && <ExternalLink className="w-4 h-4 text-gray-300" />}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
