import axios from 'axios';

const ACCESS_TOKEN_KEY = 'idp_access_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3100'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const isAuthEndpoint = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
