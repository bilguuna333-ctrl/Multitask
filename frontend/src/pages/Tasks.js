import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Filter, CheckSquare, Calendar, MessageSquare, Trash2, Edit2, KanbanSquare, List, FileText, Code, Table, HelpCircle, Upload, CheckCircle, XCircle, ClipboardCheck, Send } from 'lucide-react';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import memberService from '../services/memberService';
import commentService from '../services/commentService';
import useAuthStore from '../store/authStore';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const priorityBadge = { LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-100 text-blue-600', HIGH: 'bg-orange-100 text-orange-600', URGENT: 'bg-red-100 text-red-600' };
const taskStatusBadge = { TODO: 'bg-gray-100 text-gray-700', IN_PROGRESS: 'bg-blue-100 text-blue-700', REVIEW: 'bg-yellow-100 text-yellow-700', DONE: 'bg-green-100 text-green-700' };
const statusDot = { TODO: 'bg-gray-400', IN_PROGRESS: 'bg-blue-500', REVIEW: 'bg-yellow-500', DONE: 'bg-green-500' };
const reviewStatusBadge = { PENDING: 'bg-yellow-100 text-yellow-700', APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700' };

const SUBMISSION_TYPES = [
  { value: 'CODE', label: 'Code', icon: Code, color: 'text-purple-600 bg-purple-50' },
  { value: 'DOC', label: 'Document', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { value: 'SHEET', label: 'Spreadsheet', icon: Table, color: 'text-green-600 bg-green-50' },
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle, color: 'text-orange-600 bg-orange-50' },
  { value: 'FILE_UPLOAD', label: 'File Upload', icon: Upload, color: 'text-gray-600 bg-gray-50' },
];

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';
  const { user, membership } = useAuthStore();
  const userRole = membership?.role || 'MEMBER';
  const isManager = ['OWNER', 'MANAGER'].includes(userRole);

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

  // Submission state
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({ type: 'CODE', title: '', content: '', file: null, fileUrl: '' });

  // Review state
  const [reviewNote, setReviewNote] = useState('');

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

  const toggleMyTasks = () => {
    if (filters.assigneeId === user.id) {
      setFilters({ ...filters, assigneeId: '' });
    } else {
      setFilters({ ...filters, assigneeId: user.id });
    }
  };

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

  const handleStartTask = async (taskId) => {
    try {
      await taskService.updateTask(taskId, { status: 'IN_PROGRESS' });
      toast.success('Task started!');
      fetchTasks();
      if (showDetail?.id === taskId) {
        setShowDetail({ ...showDetail, status: 'IN_PROGRESS' });
      }
    } catch (err) {
      toast.error('Failed to start task');
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
    setReviewNote('');
    setShowSubmitForm(false);
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

  // Submission handler
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitForm.title.trim()) return toast.error('Title is required');
    if (!showDetail) return;
    setSaving(true);
    try {
      await taskService.createSubmission(showDetail.id, submitForm);
      toast.success('Submission sent for review!');
      setShowSubmitForm(false);
      setSubmitForm({ type: 'CODE', title: '', content: '', file: null, fileUrl: '' });
      setShowDetail(null); // Close detail after submission
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  // Approve handler
  const handleApprove = async (taskId) => {
    setSaving(true);
    try {
      await taskService.approveTask(taskId, reviewNote);
      toast.success('Task approved!');
      setShowDetail(null);
      setReviewNote('');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setSaving(false);
    }
  };

  // Cancel/reject handler
  const handleReject = async (taskId) => {
    setSaving(true);
    try {
      await taskService.cancelTask(taskId, reviewNote);
      toast.success('Task returned for revision');
      setShowDetail(null);
      setReviewNote('');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
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
          {isManager && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> New Task</button>}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-10 text-sm" placeholder="Search tasks..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <button
            onClick={toggleMyTasks}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filters.assigneeId === user.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <CheckSquare className="w-4 h-4" /> My Tasks
          </button>
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
          {!filters.assigneeId && (
            <select className="input-field text-sm w-auto" value={filters.assigneeId} onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}>
              <option value="">All Assignees</option>
              {members.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.firstName} {m.user.lastName}</option>)}
            </select>
          )}
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
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                    {task.reviewStatus === 'PENDING' && task.status === 'REVIEW' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700"><ClipboardCheck className="w-3 h-3" /> Needs Review</span>
                    )}
                    {task.reviewStatus === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Approved</span>
                    )}
                    {task.reviewStatus === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Returned</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{task.project?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className={`badge text-xs ${priorityBadge[task.priority]}`}>{task.priority}</span>
                {isManager ? (
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
                ) : (
                  <span className={`badge text-xs ${taskStatusBadge[task.status]}`}>{task.status.replace('_', ' ')}</span>
                )}
                {task.assignee && (
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                    {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                  </div>
                )}
                {task.dueDate && <span className="text-xs text-gray-500"><Calendar className="w-3 h-3 inline mr-0.5" />{new Date(task.dueDate).toLocaleDateString()}</span>}
                {task._count?.comments > 0 && <span className="text-xs text-gray-400"><MessageSquare className="w-3 h-3 inline mr-0.5" />{task._count.comments}</span>}
                {task._count?.submissions > 0 && <span className="text-xs text-gray-400"><FileText className="w-3 h-3 inline mr-0.5" />{task._count.submissions}</span>}
                {isManager && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setEditingTask({ ...task, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' }); }} className="p-1 hover:bg-gray-200 rounded"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="p-1 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" /></button>
                  </>
                )}
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
      <Modal isOpen={!!editingTask && isManager} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && isManager && (
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

      {/* Task Detail / Comments / Submissions / Review Drawer */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.title || 'Task Detail'} size="lg">
        {showDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b">
              <div><span className="text-xs text-gray-500 block">Status</span><span className={`badge ${taskStatusBadge[showDetail.status]}`}>{showDetail.status.replace('_', ' ')}</span></div>
              <div><span className="text-xs text-gray-500 block">Priority</span><span className={`badge ${priorityBadge[showDetail.priority]}`}>{showDetail.priority}</span></div>
              <div><span className="text-xs text-gray-500 block">Project</span><span className="text-sm font-medium text-gray-900">{showDetail.project?.name}</span></div>
              <div><span className="text-xs text-gray-500 block">Assignee</span><span className="text-sm font-medium text-gray-900">{showDetail.assignee ? `${showDetail.assignee.firstName} ${showDetail.assignee.lastName}` : 'Unassigned'}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Instructions / Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-primary-500" /> Instructions</h4>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[100px]">
                    {showDetail.description ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{showDetail.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No description provided</p>
                    )}
                  </div>
                </div>

                {/* Submissions Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Submissions ({showDetail.submissions?.length || 0})</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {showDetail.submissions && showDetail.submissions.length > 0 ? (
                      showDetail.submissions.map((sub) => {
                        const typeInfo = SUBMISSION_TYPES.find(st => st.value === sub.type);
                        const SubIcon = typeInfo?.icon || FileText;
                        return (
                          <div key={sub.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${typeInfo?.color || 'bg-gray-50 text-gray-600'}`}>
                                <SubIcon className="w-3 h-3" />{typeInfo?.label || sub.type}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{sub.title}</span>
                              <span className="text-xs text-gray-400 ml-auto">{new Date(sub.createdAt).toLocaleString()}</span>
                            </div>
                            {sub.content && (
                              <pre className="text-xs bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono max-h-32 mb-2">{sub.content}</pre>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">{sub.user?.firstName?.[0]}{sub.user?.lastName?.[0]}</div>
                                {sub.user?.firstName} {sub.user?.lastName}
                              </div>
                              {sub.fileUrl && (
                                <a href={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${sub.fileUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline px-2 py-1 bg-primary-50 rounded">
                                  <Upload className="w-3 h-3" /> File
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400 italic bg-gray-50 rounded-lg p-3 border border-dashed border-gray-200">No work submitted yet</p>
                    )}
                  </div>
                </div>

                {/* Submission Form (Integrated) */}
                {showSubmitForm ? (
                  <div className="border-2 border-primary-100 rounded-xl p-4 bg-primary-50/30 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Send className="w-4 h-4 text-primary-600" /> New Submission</h4>
                    <form onSubmit={handleSubmitWork} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Type</label>
                        <div className="flex flex-wrap gap-2">
                          {SUBMISSION_TYPES.map((st) => {
                            const Icon = st.icon;
                            return (
                              <button
                                key={st.value}
                                type="button"
                                onClick={() => setSubmitForm({ ...submitForm, type: st.value })}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium ${submitForm.type === st.value ? 'border-primary-500 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                              >
                                <Icon className="w-3.5 h-3.5" /> {st.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <input className="input-field text-sm" value={submitForm.title} onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })} placeholder="Submission Title (e.g. Github Repo, Feature Implementation)" />
                        <textarea
                          className="input-field font-mono text-sm"
                          rows={4}
                          value={submitForm.content}
                          onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
                          placeholder={submitForm.type === 'CODE' ? 'Paste your Github link here...' : 'Enter your submission content or notes...'}
                        />
                      </div>
                      {(submitForm.type === 'FILE_UPLOAD' || submitForm.type === 'DOC' || submitForm.type === 'SHEET') && (
                        <div>
                          <input type="file" onChange={(e) => setSubmitForm({ ...submitForm, file: e.target.files[0] || null })} className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 cursor-pointer" />
                          <input className="input-field mt-2 text-xs" value={submitForm.fileUrl} onChange={(e) => setSubmitForm({ ...submitForm, fileUrl: e.target.value })} placeholder="Or paste a link to your work (Drive, Github, etc.)" />
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowSubmitForm(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-1.5">{saving ? 'Submitting...' : 'Send Submission'}</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Member Actions */
                  showDetail.assigneeId === user?.id && showDetail.status !== 'DONE' && (
                    <div className="flex gap-3">
                      {isManager && showDetail.status === 'TODO' && (
                        <button
                          onClick={() => handleStartTask(showDetail.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                        ><Calendar className="w-4 h-4" /> Start Working</button>
                      )}
                      {showDetail.reviewStatus !== 'PENDING' && (
                        <button
                          onClick={() => { setShowSubmitForm(true); setSubmitForm({ type: 'CODE', title: '', content: '', file: null, fileUrl: '' }); }}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-sm"
                        ><Send className="w-4 h-4" /> Submit Work</button>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="space-y-6">
                {/* Review Info / Feedback */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2"><Table className="w-4 h-4 text-orange-500" /> Review Details</h4>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest mb-1">Status</span>
                      <span className={`badge ${reviewStatusBadge[showDetail.reviewStatus] || 'bg-gray-100 text-gray-600'}`}>{showDetail.reviewStatus || 'NONE'}</span>
                    </div>
                    {showDetail.reviewedBy && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest mb-1">Reviewer</span>
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">{showDetail.reviewedBy.firstName?.[0]}{showDetail.reviewedBy.lastName?.[0]}</div>
                          {showDetail.reviewedBy.firstName} {showDetail.reviewedBy.lastName}
                        </div>
                      </div>
                    )}
                    {showDetail.reviewNote && (
                      <div className="pt-2 border-t">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest mb-1">Feedback</span>
                        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 italic">{showDetail.reviewNote}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags & Dates */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Due Date</span>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {showDetail.dueDate ? new Date(showDetail.dueDate).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                  {showDetail.tags && (
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Tags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {showDetail.tags.split(',').map((t, i) => <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[11px] text-gray-600">{t.trim()}</span>)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Manager Review Actions */}
                {isManager && showDetail.status === 'REVIEW' && showDetail.reviewStatus === 'PENDING' && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Review Action</h4>
                    <div className="space-y-3">
                      <textarea className="input-field text-sm" rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add feedback note..." />
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(showDetail.id)} disabled={saving} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700">APPROVE</button>
                        <button onClick={() => handleReject(showDetail.id)} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700">REJECT</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary-500" /> Discussion ({comments.length})</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700 flex-shrink-0">{c.user?.firstName?.[0]}{c.user?.lastName?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold text-gray-900">{c.user?.firstName} {c.user?.lastName}</span><span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleString()}</span></div>
                      <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-sm text-gray-400 text-center py-4 italic">No comments yet</p>}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input className="input-field flex-1 text-sm bg-gray-50" placeholder="Ask a question or share an update..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button type="submit" className="btn-primary text-sm px-4">Send</button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
