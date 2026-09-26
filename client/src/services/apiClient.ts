import axios from 'axios';

// VITE_API_URL already ends with /api — NEVER append another /api to paths.
// Usage: apiClient.get('/users')  →  {VITE_API_URL}/users
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
    if (status === 401 && url && !url.includes('/auth/login') && !url.includes('/auth/me')) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default apiClient;
