import api from './api';

const workspaceService = {
  getWorkspace: () => api.get('/workspace'),
  updateWorkspace: (data) => api.put('/workspace', data),
};

export default workspaceService;
