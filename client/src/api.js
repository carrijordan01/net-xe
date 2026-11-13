import axios from 'axios';
import { cerrarSesion } from './auth/sesion';

// Única URL base del cliente hacia el servidor
export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Agrega el token guardado al iniciar sesión en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el servidor rechaza el token (expirado o inválido), se cierra la sesión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const enviabaToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && enviabaToken) {
      cerrarSesion();
      window.location.assign('/login?expirada=1');
    }
    return Promise.reject(error);
  }
);
