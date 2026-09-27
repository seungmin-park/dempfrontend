import axios from 'axios';
import { store } from '@/store';
import { router } from '@/router';

interface ApiClientOptions {
  baseURL: string;
  getToken: () => string;
  onUnauthorized: () => void;
}

export function createApiClient({ baseURL, getToken, onUnauthorized }: ApiClientOptions) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use(config => {
    const token = getToken();
    if (token) config.headers['X-AUTH-TOKEN'] = token;
    return config;
  });
  client.interceptors.response.use(response => response, (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error
      && typeof error.response === 'object' && error.response !== null
      && 'status' in error.response && error.response.status === 401) onUnauthorized();
    return Promise.reject(error);
  });
  return client;
}

export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VUE_APP_API_BASE_URL || '',
  getToken: () => store.state.Login.token,
  onUnauthorized: clearExpiredSession,
});

export function clearExpiredSession() {
  store.commit('Login/logout');
  const current = router.currentRoute.value;
  if (current.path !== '/login') router.replace({ path: '/login', query: { redirect: current.fullPath } });
}
