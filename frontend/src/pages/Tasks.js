import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Filter, CheckSquare, Calendar, MessageSquare, Trash2, Edit2, KanbanSquare, List } from 'lucide-react';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import memberService from '../services/memberService';
import commentService from '../services/commentService';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const priorityBadge = { LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-100 text-blue-600', HIGH: 'bg-orange-100 text-orange-600', URGENT: 'bg-red-100 text-red-600' };
const taskStatusBadge = { TODO: 'bg-gray-100 text-gray-700', IN_PROGRESS: 'bg-blue-100 text-blue-700', REVIEW: 'bg-yellow-100 text-yellow-700', DONE: 'bg-green-100 text-green-700' };
const statusDot = { TODO: 'bg-gray-400', IN_PROGRESS: 'bg-blue-500', REVIEW: 'bg-yellow-500', DONE: 'bg-green-500' };

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({ projectId: initialProjectId, status: '', priority: '', assigneeId: '', search: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', projectId: initialProjectId, priority: 'MEDIUM', assigneeId: '', dueDate: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await taskService.getTasks(params);
      setTasks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        projectService.getProjects({ limit: 100 }),
        memberService.getMembers({ limit: 100 }),
      ]);
      setProjects(projRes.data.data || []);
      setMembers(memRes.data.data || []);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchTasks(); }, [filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Title is required');
    if (!taskForm.projectId) return toast.error('Project is required');
    setSaving(true);
    try {
      await taskService.createTask({ ...taskForm, assigneeId: taskForm.assigneeId || null, dueDate: taskForm.dueDate || null });
      toast.success('Task created');
      setShowCreate(false);
      setTaskForm({ title: '', description: '', projectId: initialProjectId, priority: 'MEDIUM', assigneeId: '', dueDate: '', tags: '' });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      fetchTasks();
      if (showDetail?.id === taskId) {
        setShowDetail({ ...showDetail, status: newStatus });
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted');
      setShowDetail(null);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const openDetail = async (task) => {
    setShowDetail(task);
    try {
      const res = await commentService.getComments(task.id);
      setComments(res.data.data || []);
    } catch (err) {
      setComments([]);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !showDetail) return;
    try {
      await commentService.createComment({ taskId: showDetail.id, content: newComment });
      setNewComment('');
      const res = await commentService.getComments(showDetail.id);
      setComments(res.data.data || []);
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setSaving(true);
    try {
      await taskService.updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        status: editingTask.status,
        assigneeId: editingTask.assigneeId || null,
        dueDate: editingTask.dueDate || null,
        tags: editingTask.tags || '',
      });
      toast.success('Task updated');
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/kanban" className="btn-secondary"><KanbanSquare className="w-4 h-4 mr-1" /> Kanban</Link>
          <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> New Task</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-10 text-sm" placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <select className="input-field text-sm w-auto" value={filters.projectId} onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="input-field text-sm w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
          </select>
          <select className="input-field text-sm w-auto" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <select className="input-field text-sm w-auto" value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}>
            <option value="">All Assignees</option>
            {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.firstName} {m.user.lastName}</option>)}
          </select>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks found" description="Create a new task or adjust your filters" action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4 mr-1" /> New Task</button>} />
      ) : (
        <div className="card divide-y divide-gray-100">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetail(task)}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[task.status]}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{task.project?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className={`badge text-xs ${priorityBadge[task.priority]}`}>{task.priority}</span>
                <select
                  className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                  value={task.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); handleStatusChange(task.id, e.target.value); }}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
                {task.assignee && (
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                    {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                  </div>
                )}
                {task.dueDate && <span className="text-xs text-gray-500"><Calendar className="w-3 h-3 inline mr-0.5" />{new Date(task.dueDate).toLocaleDateString()}</span>}
                {task._count?.comments > 0 && <span className="text-xs text-gray-400"><MessageSquare className="w-3 h-3 inline mr-0.5" />{task._count.comments}</span>}
                <button onClick={(e) => { e.stopPropagation(); setEditingTask({ ...task, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' }); }} className="p-1 hover:bg-gray-200 rounded"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input-field" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select className="input-field" value={taskForm.projectId} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}>
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
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
              {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.firstName} {m.user.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input className="input-field" value={taskForm.tags} onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })} placeholder="Comma-separated tags" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && (
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input className="input-field" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="input-field" rows={3} value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field" value={editingTask.status} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="input-field" value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" className="input-field" value={editingTask.dueDate || ''} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select className="input-field" value={editingTask.assigneeId || ''} onChange={(e) => setEditingTask({ ...editingTask, assigneeId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.firstName} {m.user.lastName}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input className="input-field" value={editingTask.tags || ''} onChange={(e) => setEditingTask({ ...editingTask, tags: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditingTask(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Task Detail / Comments Drawer */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.title || 'Task Detail'} size="lg">
        {showDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-500 block">Status</span><span className={`badge ${taskStatusBadge[showDetail.status]}`}>{showDetail.status.replace('_', ' ')}</span></div>
              <div><span className="text-xs text-gray-500 block">Priority</span><span className={`badge ${priorityBadge[showDetail.priority]}`}>{showDetail.priority}</span></div>
              <div><span className="text-xs text-gray-500 block">Project</span><span className="text-sm text-gray-900">{showDetail.project?.name}</span></div>
              <div><span className="text-xs text-gray-500 block">Assignee</span><span className="text-sm text-gray-900">{showDetail.assignee ? `${showDetail.assignee.firstName} ${showDetail.assignee.lastName}` : 'Unassigned'}</span></div>
              {showDetail.dueDate && <div><span className="text-xs text-gray-500 block">Due Date</span><span className="text-sm text-gray-900">{new Date(showDetail.dueDate).toLocaleDateString()}</span></div>}
              {showDetail.tags && <div><span className="text-xs text-gray-500 block">Tags</span><div className="flex flex-wrap gap-1 mt-1">{showDetail.tags.split(',').map((t, i) => <span key={i} className="badge bg-gray-100 text-gray-600">{t.trim()}</span>)}</div></div>}
            </div>
            {showDetail.description && (
              <div><span className="text-xs text-gray-500 block mb-1">Description</span><p className="text-sm text-gray-700 whitespace-pre-wrap">{showDetail.description}</p></div>
            )}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments ({comments.length})</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700 flex-shrink-0">{c.user?.firstName?.[0]}{c.user?.lastName?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{c.user?.firstName} {c.user?.lastName}</span><span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span></div>
                      <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet</p>}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input className="input-field flex-1 text-sm" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button type="submit" className="btn-primary text-sm">Send</button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
