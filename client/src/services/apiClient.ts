import axios from 'axios';

// Use empty baseURL so all requests are relative to the current origin.
// In dev, Vite's proxy forwards /api/* to the backend.
// In production, the app and API share the same server.
// Usage: apiClient.get('/api/users')  →  /api/users (same origin)
const apiClient = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// On 401 responses (excluding auth endpoints), redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url as string | undefined;

    // Don't intercept auth endpoint failures — let them propagate to the caller
    if (status === 401 && url && !url.includes('/api/auth/login') && !url.includes('/api/auth/me')) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default apiClient;
