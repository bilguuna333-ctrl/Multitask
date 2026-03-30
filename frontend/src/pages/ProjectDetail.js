import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Users, CheckSquare, Calendar, MoreVertical } from 'lucide-react';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import memberService from '../services/memberService';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const statusBadge = { ACTIVE: 'bg-green-100 text-green-700', ON_HOLD: 'bg-yellow-100 text-yellow-700', COMPLETED: 'bg-blue-100 text-blue-700' };
const priorityBadge = { LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-100 text-blue-600', HIGH: 'bg-orange-100 text-orange-600', URGENT: 'bg-red-100 text-red-600' };
const taskStatusBadge = { TODO: 'bg-gray-100 text-gray-700', IN_PROGRESS: 'bg-blue-100 text-blue-700', REVIEW: 'bg-yellow-100 text-yellow-700', DONE: 'bg-green-100 text-green-700' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { membership } = useAuthStore();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' });
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await projectService.getProject(id);
      setProject(res.data.data);
      setEditForm({ name: res.data.data.name, description: res.data.data.description || '', status: res.data.data.status });
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await memberService.getMembers({ limit: 100 });
      setMembers(res.data.data || []);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { fetchProject(); fetchMembers(); }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectService.updateProject(id, editForm);
      toast.success('Project updated');
      setShowEdit(false);
      fetchProject();
    } catch (err) {
      toast.error('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await projectService.deleteProject(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error('Failed to delete project');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Task title is required');
    setSaving(true);
    try {
      await taskService.createTask({ ...taskForm, projectId: id, assigneeId: taskForm.assigneeId || null, dueDate: taskForm.dueDate || null });
      toast.success('Task created');
      setShowCreateTask(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '' });
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!project) return null;

  const isAdmin = membership?.role === 'OWNER' || membership?.role === 'ADMIN';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/projects" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`badge ${statusBadge[project.status] || 'bg-gray-100'}`}>{project.status}</span>
            </div>
            {project.description && <p className="text-gray-600 mt-2 max-w-2xl">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreateTask(true)} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> Add Task</button>
            {isAdmin && (
              <>
                <button onClick={() => setShowEdit(true)} className="btn-secondary"><Edit2 className="w-4 h-4" /></button>
                <button onClick={handleDelete} className="btn-danger"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{project._count?.tasks || 0}</p>
          <p className="text-xs text-gray-500">Total Tasks</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{project.tasks?.filter(t => t.status === 'DONE').length || 0}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{project.tasks?.filter(t => t.status === 'IN_PROGRESS').length || 0}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{project._count?.projectMembers || 0}</p>
          <p className="text-xs text-gray-500">Members</p>
        </div>
      </div>

      {/* Members */}
      <div className="card p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Members</h3>
        <div className="flex flex-wrap gap-2">
          {project.projectMembers?.map((pm) => (
            <div key={pm.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-sm">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">
                {pm.user.firstName?.[0]}{pm.user.lastName?.[0]}
              </div>
              <span className="text-gray-700">{pm.user.firstName} {pm.user.lastName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Tasks</h3>
        </div>
        {project.tasks?.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={CheckSquare} title="No tasks yet" description="Create your first task for this project" action={<button onClick={() => setShowCreateTask(true)} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> Add Task</button>} />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {project.tasks?.map((task) => (
              <Link key={task.id} to={`/tasks?projectId=${id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'DONE' ? 'bg-green-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : task.status === 'REVIEW' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                  <span className={`text-sm ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge text-xs ${priorityBadge[task.priority]}`}>{task.priority}</span>
                  <span className={`badge text-xs ${taskStatusBadge[task.status]}`}>{task.status.replace('_', ' ')}</span>
                  {task.assignee && (
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                      {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                    </div>
                  )}
                  {task.dueDate && (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="input-field" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Create Task Modal */}
      <Modal isOpen={showCreateTask} onClose={() => setShowCreateTask(false)} title="Create Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input-field" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" className="input-field" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select className="input-field" value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.firstName} {m.user.lastName}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateTask(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
