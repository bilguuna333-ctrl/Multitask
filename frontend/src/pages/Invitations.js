import React, { useEffect, useState } from 'react';
import { Plus, Mail, X, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';
import invitationService from '../services/invitationService';
import useAuthStore from '../store/authStore';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const statusBadge = { PENDING: 'bg-yellow-100 text-yellow-700', ACCEPTED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700', EXPIRED: 'bg-gray-100 text-gray-700' };
const statusIcon = { PENDING: Clock, ACCEPTED: CheckCircle2, CANCELLED: XCircle };

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'MEMBER' });
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const { membership } = useAuthStore();

  const isAdmin = membership?.role === 'OWNER' || membership?.role === 'MANAGER';

  const fetchInvitations = async () => {
    try {
      const res = await invitationService.getInvitations({ limit: 100 });
      setInvitations(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvitations(); }, []);

  useEffect(() => {
    if (!showCreate) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const q = form.email.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await invitationService.searchUsers({ q, limit: 8 });
        if (!cancelled) setSuggestions(res.data.data || []);
      } catch (e) {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.email, showCreate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.email) return toast.error('Email is required');
    setSending(true);
    try {
      await invitationService.createInvitation(form);
      toast.success('Invitation sent!');
      setShowCreate(false);
      setForm({ email: '', role: 'MEMBER' });
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this invitation?')) return;
    try {
      await invitationService.cancelInvitation(id);
      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (err) {
      toast.error('Failed to cancel invitation');
    }
  };

  const handleResend = async (id) => {
    try {
      await invitationService.resendInvitation(id);
      toast.success('Invitation resent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="text-gray-600 mt-1">Manage workspace invitations</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Invite Member
          </button>
        )}
      </div>

      {invitations.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No invitations"
          description="Invite team members to collaborate in your workspace"
          action={isAdmin ? <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Invite Member</button> : null}
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {invitations.map((inv) => {
            const StatusIcon = statusIcon[inv.status] || Clock;
            return (
              <div key={inv.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                    <p className="text-xs text-gray-500">
                      Role: {inv.role} &middot; Sent {new Date(inv.createdAt).toLocaleDateString()}
                      {inv.expiresAt && ` &middot; Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge flex items-center gap-1 ${statusBadge[inv.status]}`}>
                    <StatusIcon className="w-3.5 h-3.5" /> {inv.status}
                  </span>
                  {isAdmin && inv.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleResend(inv.id)} className="btn-ghost text-xs py-1 px-2" title="Resend">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleCancel(inv.id)} className="btn-ghost text-xs py-1 px-2 text-red-500 hover:bg-red-50" title="Cancel">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Invite Member">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="colleague@company.com" autoComplete="off" />
              {(searching || suggestions.length > 0) && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                  {searching && (
                    <div className="px-3 py-2 text-xs text-gray-500">Searching...</div>
                  )}
                  {!searching && suggestions.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
                  )}
                  {!searching && suggestions.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, email: u.email });
                        setSuggestions([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    >
                      <div className="text-sm font-medium text-gray-900">{u.email}</div>
                      <div className="text-xs text-gray-500">{u.firstName} {u.lastName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="MEMBER">Member</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={sending} className="btn-primary">{sending ? 'Sending...' : 'Send Invitation'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
