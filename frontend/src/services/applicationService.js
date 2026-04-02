import api from './api';

const applicationService = {
  listWorkspaces: (params) => api.get('/applications/workspaces', { params }),

  createCompany: (data) => {
    return api.post('/applications/create-company', {
      name: data.name,
      logoUrl: data.logoUrl || null
    });
  },

  applyToCompany: (workspaceId, data) => {
    const formData = new FormData();
    if (data.coverLetter) formData.append('coverLetter', data.coverLetter);
    if (data.cvFile) formData.append('cvFile', data.cvFile);
    return api.post(`/applications/apply/${workspaceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMyApplications: () => api.get('/applications/my-applications'),

  getWorkspaceApplications: (params) => api.get('/applications/workspace-applications', { params }),

  acceptApplication: (applicationId, note) => api.post(`/applications/${applicationId}/accept`, { note }),

  rejectApplication: (applicationId, note) => api.post(`/applications/${applicationId}/reject`, { note }),
};

export default applicationService;
