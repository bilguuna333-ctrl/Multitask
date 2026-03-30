import api from './api';

const projectService = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  archiveProject: (id) => api.post(`/projects/${id}/archive`),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  addProjectMember: (id, userId) => api.post(`/projects/${id}/members`, { userId }),
  removeProjectMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export default projectService;
