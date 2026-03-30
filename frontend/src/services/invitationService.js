import api from './api';

const invitationService = {
  getInvitations: (params) => api.get('/invitations', { params }),
  createInvitation: (data) => api.post('/invitations', data),
  acceptInvitation: (data) => api.post('/invitations/accept', data),
  cancelInvitation: (id) => api.delete(`/invitations/${id}`),
  resendInvitation: (id) => api.post(`/invitations/${id}/resend`),
};

export default invitationService;
