import axios from 'axios';

const API_URL = '/api/v1/orchestrator';
const AUTH_URL = '/api/v1/auth';

const api = axios.create({
  baseURL: API_URL,
});

const authApi = axios.create({
  baseURL: AUTH_URL,
});

// Interceptor: Inyecta de forma automática el Bearer Token guardado
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bank_token');
  if (token) {
    config.headers.Authorization = token;
  }
  // Generamos un Correlation-ID único para cada solicitud desde el frontend para trazabilidad
  config.headers['X-Correlation-ID'] = `front-tx-${Date.now()}`;
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  login: (username, password) => authApi.post('/login', { username, password }),
  register: ({ username, email, documentType, documentId, password, phone_number }) => 
    authApi.post('/register', { username, email, documentType, documentId, password, phone_number })
};

export const bankService = {
  getBalance: (userId) => api.get(`/balance/${userId}`),
  getMovements: (userId) => api.get(`/movements/${userId}`),
  executeTransfer: (originUserId, destinationPhone, amount) => 
    api.post('/transfer', { origin_user_id: originUserId, destination_phone: destinationPhone, amount: parseFloat(amount) }),
};

export default api;