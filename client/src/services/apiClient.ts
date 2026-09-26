import axios from 'axios';

// VITE_API_URL already ends with /api — NEVER append another /api to paths.
// Usage: apiClient.get('/users')  →  {VITE_API_URL}/users
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
