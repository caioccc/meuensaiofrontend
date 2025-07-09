import axios from 'axios';
import Router from 'next/router';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Rotas livres (não exigem autenticação)
const UNPROTECTED_ROUTES = [
  '/token/',
  '/token/refresh/',
  // Adicione outras rotas livres se necessário
];

// Interceptor para adicionar o token de acesso no header Authorization
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access');
      if (token && config && !UNPROTECTED_ROUTES.some((route) => config.url?.includes(route))) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const isUnprotected = UNPROTECTED_ROUTES.some((route) => originalRequest.url?.includes(route));
    if (error.response && error.response.status === 401 && !isUnprotected) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        Router.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
