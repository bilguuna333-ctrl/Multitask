import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, Users, CheckSquare, Archive } from 'lucide-react';
import projectService from '../services/projectService';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const statusBadge = { ACTIVE: 'bg-green-100 text-green-700', ON_HOLD: 'bg-yellow-100 text-yellow-700', COMPLETED: 'bg-blue-100 text-blue-700' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await projectService.getProjects({ search });
      setProjects(res.data.data);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setCreating(true);
    try {
      await projectService.createProject(form);
      toast.success('Project created');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this project?')) return;
    try {
      await projectService.archiveProject(id);
      toast.success('Project archived');
      fetchProjects();
    } catch (err) {
      toast.error('Failed to archive project');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to get started"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4 mr-2" /> Create Project</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-primary-600" />
                </div>
                <span className={`badge ${statusBadge[project.status] || 'bg-gray-100 text-gray-700'}`}>{project.status}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">{project.name}</h3>
              {project.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" /> {project._count?.tasks || 0} tasks</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {project._count?.projectMembers || 0} members</span>
              </div>
              <button onClick={(e) => { e.preventDefault(); handleArchive(project.id); }} className="mt-3 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Archive className="w-3 h-3" /> Archive
              </button>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Website Redesign" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
