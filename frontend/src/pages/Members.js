import React, { useEffect, useState } from 'react';
import { Search, Users, Shield, ShieldCheck, Crown, UserMinus, UserCheck } from 'lucide-react';
import memberService from '../services/memberService';
import useAuthStore from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const roleIcons = { OWNER: Crown, MANAGER: Shield, MEMBER: Shield };
const roleBadge = { OWNER: 'bg-purple-100 text-purple-700', MANAGER: 'bg-indigo-100 text-indigo-700', MEMBER: 'bg-gray-100 text-gray-700' };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { membership, user } = useAuthStore();
  const { can } = usePermissions();

  const fetchMembers = async () => {
    try {
      const res = await memberService.getMembers({ search, limit: 100 });
      setMembers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [search]);

  const handleRoleChange = async (memberId, newRole) => {
    if (!can('CHANGE_MEMBER_ROLES')) {
      toast.error('You don\'t have permission to change member roles');
      return;
    }
    
    try {
      await memberService.updateRole(memberId, newRole);
      toast.success('Role updated');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (memberId) => {
    if (!can('REMOVE_MEMBERS')) {
      toast.error('You don\'t have permission to remove members');
      return;
    }
    
    if (!window.confirm('Remove this member from the workspace?')) return;
    try {
      await memberService.removeMember(memberId);
      toast.success('Member removed');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleReactivate = async (memberId) => {
    try {
      await memberService.reactivateMember(memberId);
      toast.success('Member reactivated');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reactivate');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">{members.length} member{members.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="Invite people to your workspace" />
      ) : (
        <div className="card divide-y divide-gray-100">
          {members.map((m) => {
            const RoleIcon = roleIcons[m.role] || Shield;
            return (
              <div key={m.id} className={`flex items-center justify-between px-5 py-4 ${!m.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-semibold text-primary-700">
                    {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {m.user.firstName} {m.user.lastName}
                        {m.user.id === user?.id && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                      </p>
                      {!m.isActive && <span className="badge bg-red-100 text-red-600 text-xs">Inactive</span>}
                    </div>
                    <p className="text-sm text-gray-500">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${roleBadge[m.role]} flex items-center gap-1`}>
                    <RoleIcon className="w-3.5 h-3.5" /> {m.role}
                  </span>
                  {can('CHANGE_MEMBER_ROLES') && m.role !== 'OWNER' && m.user.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      {m.isActive ? (
                        <>
                          <select
                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          >
                            <option value="MANAGER">Manager</option>
                            <option value="MEMBER">Member</option>
                          </select>
                          <button onClick={() => handleRemove(m.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove member">
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleReactivate(m.id)} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Reactivate">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
