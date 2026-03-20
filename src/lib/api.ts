import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.siu.edu.vn/certificate/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // In a real app, this might be a cookie or safer storage, but localStorage is fine for MVP
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Handle 401 Unauthorized globally (e.g., token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.siu.edu.vn/certificate/api/v1'}/auth/refresh`, {
            refresh_token: refreshToken
          });
          const { access_token } = res.data;
          localStorage.setItem('access_token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (err) {
        // Refresh token failed, force logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/certificate/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
