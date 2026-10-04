import type { Plugin } from 'vuex';
import type { LoginState, RootState } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readLogin(): LoginState | undefined {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('vuex') ?? 'null');
    if (!isRecord(saved) || !isRecord(saved.Login)) return;
    const { username, token } = saved.Login;
    if (typeof username === 'string' && typeof token === 'string') return { username, token };
  } catch {
    // Invalid JSON or unavailable storage leaves the in-memory state logged out.
  }
  return undefined;
}

export const persistAuthentication: Plugin<RootState> = store => {
  const login = readLogin();
  if (login) store.replaceState({ ...store.state, Login: login });
  store.subscribe((mutation, state) => {
    if (!mutation.type.startsWith('Login/')) return;
    try {
      localStorage.setItem('vuex', JSON.stringify({ Login: state.Login }));
    } catch {
      // Storage is optional: this session still works when persistence is blocked.
    }
  });
};
