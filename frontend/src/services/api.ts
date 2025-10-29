import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await api.put('/api/users/profile', data);
    return response.data;
  },

  getPotentialMatches: async () => {
    const response = await api.get('/api/users/potential-matches');
    return response.data;
  },
};

// Match API
export const matchAPI = {
  likeUser: async (userId: number) => {
    const response = await api.post(`/api/matches/like/${userId}`);
    return response.data;
  },

  passUser: async (userId: number) => {
    const response = await api.post(`/api/matches/pass/${userId}`);
    return response.data;
  },

  getMatches: async () => {
    const response = await api.get('/api/matches');
    return response.data;
  },
};

// Message API
export const messageAPI = {
  sendMessage: async (matchId: number, content: string) => {
    const response = await api.post(`/api/messages/${matchId}`, { content });
    return response.data;
  },

  getConversation: async (matchId: number) => {
    const response = await api.get(`/api/messages/${matchId}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/messages/unread/count');
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread/count');
    return response.data;
  },

  markAsRead: async (notificationId: number) => {
    const response = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/api/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: number) => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};

// Payment API
export const paymentAPI = {
  checkChatAccess: async () => {
    const response = await api.get('/api/payments/chat/access');
    return response.data;
  },
  initializeChatPayment: async (amount: number, planType: 'daily' | 'monthly') => {
    const response = await api.post('/api/payments/chat/initialize', { 
      amount,
      planType 
    });
    return response.data;
  },
  verifyPayment: async (reference: string) => {
    const response = await api.post('/api/payments/verify', { reference });
    return response.data;
  },
};

export default api;
