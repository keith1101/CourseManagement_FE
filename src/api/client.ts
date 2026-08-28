import axios from 'axios';
import { setupMockAdapter } from './mockAdapter';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Initialize mock adapter
setupMockAdapter(apiClient);

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiMessage = error.response?.data?.message;
    const isLocked = error.response?.status === 403 && typeof apiMessage === 'string' && apiMessage.toLowerCase().includes('account is locked');
    if (isLocked) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_info');
      localStorage.setItem('auth_message', 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }
    if (error.response?.status === 401) {
      // Token is invalid/expired - clear storage if not on auth page
      const isAuthRoute = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthRoute && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        window.location.href = '/login';
      }
    }
    if (isLocked && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
