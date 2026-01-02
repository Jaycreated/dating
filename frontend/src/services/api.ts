import axios from 'axios';

interface TokenPayload {
  userId?: number;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

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
    // Log token details
    const tokenParts = token.split('.');
    let tokenPayload: TokenPayload = {};
    
    if (tokenParts.length === 3) {
      try {
        tokenPayload = JSON.parse(atob(tokenParts[1]));
        console.log('🔑 Token payload:', tokenPayload);
        
        // Check if token is expired
        if (tokenPayload.exp) {
          const isExpired = Date.now() >= tokenPayload.exp * 1000;
          console.log(`⏰ Token is ${isExpired ? 'expired' : 'valid'}, expires: ${new Date(tokenPayload.exp * 1000).toISOString()}`);
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    // Add token to request
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Adding auth token to request:', {
      tokenPrefix: token.substring(0, 10) + '...',
      header: config.headers.Authorization.substring(0, 30) + '...',
      url: config.url
    });
  } else {
    console.warn('⚠️ No auth token found in localStorage');
  }
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API] Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ [API] Error Response:', {
        url: error.config?.url,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          method: error.config?.method,
          headers: error.config?.headers,
          params: error.config?.params,
          data: error.config?.data
        }
      });
    } else if (error.request) {
      console.error('❌ [API] No response received:', {
        message: error.message,
        request: error.request
      });
    } else {
      console.error('❌ [API] Error:', {
        message: error.message,
        stack: error.stack
      });
    }
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
interface RegisterData {
  name: string;
  email: string;
  password: string;
  preferences?: {
    lookingFor?: string;
  };
}

export const authAPI = {
  register: async (data: RegisterData) => {
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
  getPublicProfile: async (userId: number) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data.user;
  },
  
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

  getSettings: async () => {
    const response = await api.get('/api/users/settings');
    return response.data;
  },
  
  updateSettings(settings: any) {
    return api.put('/api/users/settings', settings);
  },
  
  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    const response = await api.post('/api/auth/change-password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword || data.newPassword // Fallback to newPassword if confirmPassword is not provided
    });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  }
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

  getConversations: async () => {
    const response = await api.get('/api/conversations');
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
    const response = await api({
      method: 'PUT',
      url: `/api/notifications/${notificationId}/read`,
    });
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api({
      method: 'PUT',
      url: '/api/notifications/read-all',
    });
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
  verifyPayment: async (data: { reference: string; email?: string }) => {
    const response = await api.post('/api/payments/chat/verify', data);
    return response.data;
  },
};

export default api;
