import api from './api';

const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  reorderTasks: (tasks) => api.post('/tasks/reorder', { tasks }),
  archiveTask: (id) => api.post(`/tasks/${id}/archive`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

export default taskService;
