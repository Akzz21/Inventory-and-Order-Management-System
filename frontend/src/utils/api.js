import axios from 'axios';

const api = axios.create({
  baseURL: 'https://inventory-and-order-management-system-ce3j.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Something went wrong';
    return Promise.reject(new Error(Array.isArray(msg) ? msg[0]?.msg : msg));
  }
);

export default api;
