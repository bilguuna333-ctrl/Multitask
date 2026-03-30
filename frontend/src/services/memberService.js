import api from './api';

const memberService = {
  getMembers: (params) => api.get('/members', { params }),
  updateRole: (id, role) => api.put(`/members/${id}/role`, { role }),
  removeMember: (id) => api.delete(`/members/${id}`),
  reactivateMember: (id) => api.post(`/members/${id}/reactivate`),
};

export default memberService;
