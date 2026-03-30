import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  workspace: JSON.parse(localStorage.getItem('workspace') || 'null'),
  membership: JSON.parse(localStorage.getItem('membership') || 'null'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,

  setAuth: (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('workspace', JSON.stringify(data.workspace));
    localStorage.setItem('membership', JSON.stringify(data.membership));
    set({
      user: data.user,
      workspace: data.workspace,
      membership: data.membership,
      isAuthenticated: true,
    });
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', formData);
      if (data.success) {
        get().setAuth(data.data);
        return data;
      }
      throw new Error(data.message);
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        get().setAuth(data.data);
        return data;
      }
      throw new Error(data.message);
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.clear();
    set({
      user: null,
      workspace: null,
      membership: null,
      isAuthenticated: false,
    });
  },

  updateUser: (userData) => {
    const updated = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  updateWorkspace: (wsData) => {
    const updated = { ...get().workspace, ...wsData };
    localStorage.setItem('workspace', JSON.stringify(updated));
    set({ workspace: updated });
  },

  switchWorkspace: async (workspaceId) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/switch-workspace', { workspaceId });
      if (data.success) {
        get().setAuth({ ...data.data, user: get().user });
        return data;
      }
      throw new Error(data.message);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useAuthStore;
