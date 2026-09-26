import axios from 'axios';
import { store } from '@/store';
import { router } from '@/router';

export function createApiClient({ baseURL, getToken, onUnauthorized }) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use(config => {
    const token = getToken();
    if (token) config.headers['X-AUTH-TOKEN'] = token;
    return config;
  });
  client.interceptors.response.use(response => response, error => {
    if (error.response && error.response.status === 401) onUnauthorized();
    return Promise.reject(error);
  });
  return client;
}

export const apiClient = createApiClient({
  baseURL: process.env.VUE_APP_API_BASE_URL || '',
  getToken: () => store.state.Login.token,
  onUnauthorized: clearExpiredSession,
});

export function clearExpiredSession() {
  store.commit('Login/logout');
  const current = router.currentRoute.value;
  if (current.path !== '/login') router.replace({ path: '/login', query: { redirect: current.fullPath } });
}
