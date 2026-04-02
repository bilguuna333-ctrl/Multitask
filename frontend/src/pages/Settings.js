import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Building2, Palette, Save } from 'lucide-react';
import workspaceService from '../services/workspaceService';
import useAuthStore from '../store/authStore';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Settings() {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', logoUrl: '', themeColor: '' });
  const { membership, updateWorkspace: updateStoreWorkspace } = useAuthStore();

  const isAdmin = membership?.role === 'OWNER' || membership?.role === 'MANAGER';

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await workspaceService.getWorkspace();
        const ws = res.data.data;
        setWorkspace(ws);
        setForm({ name: ws.name || '', logoUrl: ws.logoUrl || '', themeColor: ws.themeColor || '#4F46E5' });
      } catch (err) {
        toast.error('Failed to load workspace settings');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspace();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Workspace name is required');
    setSaving(true);
    try {
      const res = await workspaceService.updateWorkspace(form);
      toast.success('Settings saved');
      updateStoreWorkspace({ name: form.name });
      setWorkspace(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="text-gray-600 mt-1">Manage your workspace configuration</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Workspace Information</h3>
              <p className="text-sm text-gray-500">Basic workspace details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!isAdmin} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input className="input-field bg-gray-50" value={workspace?.slug || ''} disabled />
              <p className="text-xs text-gray-400 mt-1">Workspace slug cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <input className="input-field bg-gray-50 capitalize" value={workspace?.plan || 'free'} disabled />
              <p className="text-xs text-gray-400 mt-1">Billing/subscription placeholder — upgrade flow not implemented</p>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Branding</h3>
              <p className="text-sm text-gray-500">Customize workspace appearance</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input className="input-field" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} disabled={!isAdmin} placeholder="https://example.com/logo.png" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} disabled={!isAdmin} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                <input className="input-field flex-1" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} disabled={!isAdmin} />
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Stats */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Workspace Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{workspace?._count?.memberships || 0}</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{workspace?._count?.projects || 0}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{workspace?._count?.tasks || 0}</p>
              <p className="text-xs text-gray-500">Tasks</p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
