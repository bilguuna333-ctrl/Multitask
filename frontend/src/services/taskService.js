import api from './api';

const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  reorderTasks: (tasks) => api.post('/tasks/reorder', { tasks }),
  archiveTask: (id) => api.post(`/tasks/${id}/archive`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),

  // Submissions
  getSubmissions: (taskId) => api.get(`/submissions/task/${taskId}`),
  createSubmission: (taskId, data) => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.fileUrl) formData.append('fileUrl', data.fileUrl);
    if (data.file) formData.append('file', data.file);
    return api.post(`/submissions/task/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Manager review
  getReviewQueue: (params) => api.get('/submissions/review-queue', { params }),
  approveTask: (taskId, note) => api.post(`/submissions/task/${taskId}/approve`, { note }),
  cancelTask: (taskId, note) => api.post(`/submissions/task/${taskId}/cancel`, { note }),
};

export default taskService;
