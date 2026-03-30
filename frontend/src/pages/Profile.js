import React, { useEffect, useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import authService from '../services/authService';
import useAuthStore from '../store/authStore';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', avatarUrl: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const { updateUser } = useAuthStore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        const p = res.data.data;
        setProfile(p);
        setForm({ firstName: p.firstName, lastName: p.lastName, avatarUrl: p.avatarUrl || '' });
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return toast.error('Name fields are required');
    setSaving(true);
    try {
      await authService.updateProfile(form);
      updateUser({ firstName: form.firstName, lastName: form.lastName, avatarUrl: form.avatarUrl });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('All password fields are required');
    if (pwForm.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    setChangingPw(true);
    try {
      await authService.changePassword(pwForm.currentPassword, pwForm.newPassword);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <form onSubmit={handleSaveProfile} className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
            <input className="input-field" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://example.com/avatar.jpg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
            <input className="input-field bg-gray-50" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''} disabled />
          </div>

          {profile?.memberships?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspaces</label>
              <div className="space-y-2">
                {profile.memberships.map((m) => (
                  <div key={m.id || m.workspace?.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center text-xs text-white font-bold">{m.workspace?.name?.[0]}</div>
                    <span className="text-sm text-gray-700">{m.workspace?.name}</span>
                    <span className="badge bg-gray-200 text-gray-600 text-xs ml-auto">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500">Update your password</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" className="input-field" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" className="input-field" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" className="input-field" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={changingPw} className="btn-primary">
            <Lock className="w-4 h-4 mr-2" /> {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
