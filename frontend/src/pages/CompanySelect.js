import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Send, Upload, FileText, CheckCircle, XCircle, Clock, Loader2, Users, Mail } from 'lucide-react';
import applicationService from '../services/applicationService';
import invitationService from '../services/invitationService';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function CompanySelect() {
  const { user, setAuth, logout } = useAuthStore();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [logoFile, setLogoFile] = useState(null);

  const [workspaces, setWorkspaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState(null);

  const [myApps, setMyApps] = useState([]);
  const [myInvites, setMyInvites] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);

  useEffect(() => {
    fetchMyApplications();
    fetchMyInvitations();
  }, []);

  const fetchMyApplications = async () => {
    try {
      const res = await applicationService.getMyApplications();
      setMyApps(res.data.data || []);
    } catch (err) { /* ignore */ }
    finally { setLoadingApps(false); }
  };

  const fetchMyInvitations = async () => {
    try {
      const res = await invitationService.getMyInvitations();
      setMyInvites(res.data.data || []);
    } catch (err) { /* ignore */ }
    finally { setLoadingInvites(false); }
  };

  const handleAcceptInvite = async (id) => {
    setLoading(true);
    try {
      const res = await invitationService.acceptMyInvitation(id);
      if (res.data.success) {
        setAuth(res.data.data);
        toast.success('Invitation accepted!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvite = async (id) => {
    try {
      await invitationService.rejectMyInvitation(id);
      toast.success('Invitation rejected');
      fetchMyInvitations();
    } catch (err) {
      toast.error('Failed to reject invitation');
    }
  };

  const searchWorkspaces = async (term) => {
    setSearchTerm(term);
    setSearching(true);
    try {
      const res = await applicationService.listWorkspaces({ search: term.trim() || undefined, limit: 10 });
      setWorkspaces(res.data.data?.workspaces || []);
    } catch (err) { setWorkspaces([]); }
    finally { setSearching(false); }
  };

  useEffect(() => {
    if (mode === 'apply') {
      searchWorkspaces('');
    }
  }, [mode]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) return toast.error('Company name is required');
    if (!logoFile) return toast.error('Company logo is required');
    setLoading(true);
    try {
      const res = await applicationService.createCompany({ name: companyName, logo: logoFile });
      if (res.data.success) {
        setAuth(res.data.data);
        toast.success('Company created!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedWorkspace) return toast.error('Please select a company');
    setLoading(true);
    try {
      await applicationService.applyToCompany(selectedWorkspace.id, { coverLetter, cvFile });
      toast.success('Application submitted!');
      setSelectedWorkspace(null);
      setCoverLetter('');
      setCvFile(null);
      setMode(null);
      fetchMyApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = {
    PENDING: { bg: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
    ACCEPTED: { bg: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Accepted' },
    REJECTED: { bg: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MultiTask</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Hello, {user?.firstName}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 transition">Logout</button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to MultiTask</h1>
          <p className="text-gray-500 mt-2">Create your own company or apply to an existing one</p>
        </div>

        {!mode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
            <button
              onClick={() => setMode('create')}
              className="card p-8 text-center hover:shadow-lg hover:border-primary-300 transition-all group border-2 border-transparent"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition">
                <Plus className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Company</h3>
              <p className="text-sm text-gray-500">Start your own workspace and invite team members</p>
            </button>

            <button
              onClick={() => setMode('apply')}
              className="card p-8 text-center hover:shadow-lg hover:border-blue-300 transition-all group border-2 border-transparent"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
                <Send className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply to Company</h3>
              <p className="text-sm text-gray-500">Send your CV and join an existing team</p>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="max-w-md mx-auto">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create Company</h2>
                <button onClick={() => setMode(null)} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
              </div>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    className="input-field"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-gray-300 rounded-lg"
                    />
                    {logoFile && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Upload className="w-3 h-3" /> {logoFile.name}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Accepted: JPG, PNG, WEBP.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating...</span> : 'Create Company'}
                </button>
              </form>
            </div>
          </div>
        )}

        {mode === 'apply' && !selectedWorkspace && (
          <div className="max-w-lg mx-auto">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Find a Company</h2>
                <button onClick={() => setMode(null)} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => searchWorkspaces(e.target.value)}
                  placeholder="Search companies by name..."
                  autoFocus
                />
              </div>
              {searching && (
                <div className="flex items-center justify-center py-4 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...
                </div>
              )}
              {!searching && workspaces.length > 0 && (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => setSelectedWorkspace(ws)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{ws.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" /> {ws._count?.memberships || 0} members</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!searching && searchTerm && workspaces.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No companies found</p>
              )}
            </div>
          </div>
        )}

        {mode === 'apply' && selectedWorkspace && (
          <div className="max-w-lg mx-auto">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Apply to {selectedWorkspace.name}</h2>
                <button onClick={() => setSelectedWorkspace(null)} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
              </div>
              <form onSubmit={handleApply} className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedWorkspace.name}</p>
                    <p className="text-xs text-gray-500">{selectedWorkspace._count?.memberships || 0} members</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Introduce yourself and explain why you want to join..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload CV</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setCvFile(e.target.files[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-gray-300 rounded-lg"
                    />
                    {cvFile && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Upload className="w-3 h-3" /> {cvFile.name} ({(cvFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Accepted: PDF, DOC, DOCX. Max 20MB.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</span> : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* My Invitations */}
        {!mode && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Invitations</h3>
              {myInvites.length > 0 && <span className="badge bg-primary-100 text-primary-700">{myInvites.length} new</span>}
            </div>
            {loadingInvites ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
              </div>
            ) : myInvites.length === 0 ? (
              <div className="card p-6 text-center bg-gray-50/50 border-dashed">
                <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myInvites.map((inv) => (
                  <div key={inv.id} className="card p-4 flex items-center justify-between hover:border-primary-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{inv.workspace?.name}</p>
                        <p className="text-xs text-gray-500">You've been invited as a <span className="font-medium text-gray-700">{inv.role}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectInvite(inv.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptInvite(inv.id)}
                        disabled={loading}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition shadow-sm"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Applications */}
        {!mode && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Applications</h3>
              {myApps.length > 0 && <p className="text-xs text-gray-500">{myApps.length} application{myApps.length !== 1 ? 's' : ''}</p>}
            </div>
            {loadingApps ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
              </div>
            ) : myApps.length === 0 ? (
              <div className="card p-8 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No applications yet. Apply to a company to get started!</p>
              </div>
            ) : (
              <div className="card divide-y divide-gray-100">
                {myApps.map((app) => {
                  const badge = statusBadge[app.status] || statusBadge.PENDING;
                  const BadgeIcon = badge.icon;
                  return (
                    <div key={app.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{app.workspace?.name}</p>
                          <p className="text-xs text-gray-500">
                            Applied {new Date(app.createdAt).toLocaleDateString()}
                            {app.cvFileName && ` &middot; ${app.cvFileName}`}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg}`}>
                        <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
