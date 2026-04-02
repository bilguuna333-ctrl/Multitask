import api from './api';

const invitationService = {
  getInvitations: (params) => api.get('/invitations', { params }),
  searchUsers: (params) => api.get('/invitations/search-users', { params }),
  createInvitation: (data) => api.post('/invitations', data),
  acceptInvitation: (data) => api.post('/invitations/accept', data),
  cancelInvitation: (id) => api.delete(`/invitations/${id}`),
  resendInvitation: (id) => api.post(`/invitations/${id}/resend`),
  getMyInvitations: () => api.get('/invitations/my-invitations'),
  acceptMyInvitation: (id) => api.post(`/invitations/my-invitations/${id}/accept`),
  rejectMyInvitation: (id) => api.post(`/invitations/my-invitations/${id}/reject`),
};

export default invitationService;
