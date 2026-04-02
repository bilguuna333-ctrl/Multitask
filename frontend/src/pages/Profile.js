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

          {profile?.authProvider === 'GOOGLE' && (
            <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3 border border-blue-100">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Signed in with Google</p>
                <p className="text-xs text-blue-700">Your account is linked to Google</p>
              </div>
            </div>
          )}

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
            <h3 className="text-base font-semibold text-gray-900">{profile?.hasPassword ? 'Change Password' : 'Set Password'}</h3>
            <p className="text-sm text-gray-500">{profile?.hasPassword ? 'Update your password' : 'Create a password for your account'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {profile?.hasPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" className="input-field" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{profile?.hasPassword ? 'New Password' : 'Password'}</label>
            <input type="password" className="input-field" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm {profile?.hasPassword ? 'New Password' : 'Password'}</label>
            <input type="password" className="input-field" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={changingPw} className="btn-primary">
            <Lock className="w-4 h-4 mr-2" /> {changingPw ? 'Processing...' : (profile?.hasPassword ? 'Change Password' : 'Set Password')}
          </button>
        </div>
      </form>
    </div>
  );
}
