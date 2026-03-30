import api from './api';

const commentService = {
  getComments: (taskId) => api.get(`/comments/task/${taskId}`),
  createComment: (data) => api.post('/comments', data),
  updateComment: (id, content) => api.put(`/comments/${id}`, { content }),
  deleteComment: (id) => api.delete(`/comments/${id}`),
};

export default commentService;
