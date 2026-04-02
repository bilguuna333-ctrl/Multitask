import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Download, Building2, Loader2, User } from 'lucide-react';
import applicationService from '../services/applicationService';
import useAuthStore from '../store/authStore';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const statusBadge = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const statusIcon = { PENDING: Clock, ACCEPTED: CheckCircle, REJECTED: XCircle };

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function Applications() {
  const { membership } = useAuthStore();
  const isAdmin = ['OWNER', 'MANAGER'].includes(membership?.role);

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedApp, setSelectedApp] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await applicationService.getWorkspaceApplications({ status: filter || undefined });
      setApplications(res.data.data?.applications || []);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [filter]);

  const handleAccept = async (appId) => {
    setSaving(true);
    try {
      await applicationService.acceptApplication(appId, note);
      toast.success('Application accepted! User is now a member.');
      setSelectedApp(null);
      setNote('');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (appId) => {
    setSaving(true);
    try {
      await applicationService.rejectApplication(appId, note);
      toast.success('Application rejected.');
      setSelectedApp(null);
      setNote('');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">You do not have permission to view applications.</p>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex gap-2">
          {['', 'PENDING', 'ACCEPTED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => { setLoading(true); setFilter(s); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState icon={FileText} title="No applications" description="No applications found with the current filter" />
      ) : (
        <div className="card divide-y divide-gray-100">
          {applications.map((app) => {
            const StatusIcon = statusIcon[app.status] || Clock;
            return (
              <div
                key={app.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => { setSelectedApp(app); setNote(''); }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
                    {app.user?.firstName?.[0]}{app.user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{app.user?.firstName} {app.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{app.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {app.cvFileUrl && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" /> CV</span>
                  )}
                  <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[app.status]}`}>
                    <StatusIcon className="w-3 h-3" /> {app.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Application Detail Modal */}
      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details" size="lg">
        {selectedApp && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-lg font-semibold text-primary-700">
                {selectedApp.user?.firstName?.[0]}{selectedApp.user?.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedApp.user?.firstName} {selectedApp.user?.lastName}</h3>
                <p className="text-sm text-gray-500">{selectedApp.user?.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">Applied {new Date(selectedApp.createdAt).toLocaleString()}</p>
              </div>
              <span className={`ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusBadge[selectedApp.status]}`}>
                {selectedApp.status}
              </span>
            </div>

            {selectedApp.coverLetter && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{selectedApp.coverLetter}</div>
              </div>
            )}

            {selectedApp.cvFileUrl && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">CV / Resume</h4>
                <a
                  href={`${API_BASE}${selectedApp.cvFileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition"
                >
                  <Download className="w-4 h-4" />
                  {selectedApp.cvFileName || 'Download CV'}
                  {selectedApp.cvFileSize ? ` (${(selectedApp.cvFileSize / 1024).toFixed(1)} KB)` : ''}
                </a>
              </div>
            )}

            {selectedApp.note && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-xs text-gray-500 mb-1">Review Note</h4>
                <p className="text-sm text-gray-700">{selectedApp.note}</p>
              </div>
            )}

            {selectedApp.status === 'PENDING' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Review</h4>
                <textarea
                  className="input-field text-sm mb-3"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(selectedApp.id)}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> {saving ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedApp.id)}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> {saving ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
