import axios from 'axios';

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
