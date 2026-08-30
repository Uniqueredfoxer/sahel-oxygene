import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sahel_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired or invalid - clear auth state
      localStorage.removeItem('sahel_token');
      localStorage.removeItem('sahel_user');
      
      // Dispatch custom event so the app can react to logout
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { error: err.response?.data?.error } }));
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/connexion')) {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export function messageErreur(err) {
  return err?.response?.data?.error || 'Une erreur est survenue. Réessayez.';
}
