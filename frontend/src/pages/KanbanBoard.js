import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { List, Calendar, Plus } from 'lucide-react';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import { PageLoader } from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const columns = [
  { id: 'TODO', label: 'To Do', color: 'border-gray-300 bg-gray-50' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-300 bg-blue-50' },
  { id: 'REVIEW', label: 'Review', color: 'border-yellow-300 bg-yellow-50' },
  { id: 'DONE', label: 'Done', color: 'border-green-300 bg-green-50' },
];

const priorityDot = { LOW: 'bg-gray-400', MEDIUM: 'bg-blue-500', HIGH: 'bg-orange-500', URGENT: 'bg-red-500' };

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  const fetchTasks = async () => {
    try {
      const params = { limit: 200 };
      if (selectedProject) params.projectId = selectedProject;
      const res = await taskService.getTasks(params);
      setTasks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await projectService.getProjects({ limit: 100 });
      setProjects(res.data.data || []);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { setLoading(true); fetchTasks(); }, [selectedProject]);

  const getColumnTasks = (status) => tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  const onDragEnd = async (result) => {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const updatedTasks = tasks.map(t => {
      if (t.id === draggableId) return { ...t, status: newStatus };
      return t;
    });
    setTasks(updatedTasks);

    const columnTasks = updatedTasks.filter(t => t.status === newStatus);
    const reorderPayload = columnTasks.map((t, idx) => ({
      id: t.id,
      status: newStatus,
      position: idx,
    }));

    try {
      await taskService.reorderTasks(reorderPayload);
    } catch (err) {
      toast.error('Failed to reorder');
      fetchTasks();
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-600 mt-1">Drag and drop to update task status</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-field text-sm w-auto" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Link to="/tasks" className="btn-secondary"><List className="w-4 h-4 mr-1" /> List View</Link>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className={`rounded-xl border-t-4 ${col.color} min-h-[60vh]`}>
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                    <span className="badge bg-white text-gray-600 border border-gray-200">{colTasks.length}</span>
                  </div>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 space-y-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50/50' : ''}`}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-200' : ''}`}
                            >
                              <p className="text-sm font-medium text-gray-900 mb-2">{task.title}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${priorityDot[task.priority]}`} title={task.priority} />
                                  <span className="text-xs text-gray-500">{task.project?.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {task.dueDate && (
                                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                  {task.assignee && (
                                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                                      {task.assignee.firstName?.[0]}{task.assignee.lastName?.[0]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
