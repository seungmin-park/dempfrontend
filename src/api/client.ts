import axios from 'axios';
import { store } from '@/store';
import { router } from '@/router';
import { bookmarkReturnPath } from '@/router/authReturn';

interface ApiClientOptions {
  baseURL: string;
  getToken: () => string;
  onUnauthorized: (pendingBookmarkId?: number) => void;
}

export function createApiClient({ baseURL, getToken, onUnauthorized }: ApiClientOptions) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use(config => {
    const token = getToken();
    if (token) config.headers['X-AUTH-TOKEN'] = token;
    return config;
  });
  client.interceptors.response.use(response => response, (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
      const issuedToken = error.config.headers.get('X-AUTH-TOKEN') ?? '';
      if (issuedToken && issuedToken === getToken()) {
        const match = error.config.method === 'put' ? error.config.url?.match(/^\/api\/member\/me\/bookmarks\/(-?[1-9]\d*)$/) : null;
        let desired: unknown;
        try { desired = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data; } catch { desired = null; }
        const id = Number(match?.[1]);
        if (match && Number.isSafeInteger(id) && typeof desired === 'object' && desired !== null && 'saved' in desired && desired.saved === true) onUnauthorized(id);
        else onUnauthorized();
      }
    }
    return Promise.reject(error);
  });
  return client;
}

export const apiClient = createApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VUE_APP_API_BASE_URL || '',
  getToken: () => store.state.Login.token,
  onUnauthorized: clearExpiredSession,
});

export function clearExpiredSession(pendingBookmarkId?: number) {
  store.commit('Login/logout');
  const current = router.currentRoute.value;
  if (current.path !== '/login' && (current.matched.some(record => record.meta.requiresAuth) || pendingBookmarkId != null)) router.replace({ path: '/login', query: { redirect: pendingBookmarkId ? bookmarkReturnPath(current.fullPath, pendingBookmarkId) : current.fullPath } });
}
