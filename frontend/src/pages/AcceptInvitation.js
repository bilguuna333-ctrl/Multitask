import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckSquare, Loader2 } from 'lucide-react';
import invitationService from '../services/invitationService';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(!isAuthenticated);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Invalid invitation link');
    if (needsAccount && (!form.firstName || !form.lastName || !form.password)) {
      return toast.error('All fields are required');
    }
    setLoading(true);
    try {
      const payload = { token };
      if (needsAccount) {
        payload.firstName = form.firstName;
        payload.lastName = form.lastName;
        payload.password = form.password;
      }
      const res = await invitationService.acceptInvitation(payload);
      if (res.data.success) {
        setAuth(res.data.data);
        toast.success('Invitation accepted! Welcome to the workspace.');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-4">This invitation link is invalid or missing a token.</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">MultiTask</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Accept Invitation</h1>
          <p className="text-gray-600 mt-1">You've been invited to join a workspace</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleAccept} className="space-y-4">
            {needsAccount && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
                </div>
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</span>
              ) : 'Accept Invitation'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">Already have an account? Sign in instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
