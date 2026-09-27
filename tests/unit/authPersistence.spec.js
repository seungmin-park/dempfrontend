import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

it('기존 vuex 저장 형식의 로그인은 새로고침 후에도 유지한다', async () => {
  localStorage.setItem('vuex', JSON.stringify({ Login: { username: 'member', token: 'legacy-jwt' } }));
  const { store } = await import('@/store');
  expect(store.state.Login).toEqual({ username: 'member', token: 'legacy-jwt' });
  expect(store.getters['Login/isLogin']).toBe(true);
});

it('저장된 인증 값의 타입이 잘못되면 로그아웃 상태로 시작한다', async () => {
  localStorage.setItem('vuex', JSON.stringify({ Login: { username: 123, token: { value: 'jwt' } } }));
  const { store } = await import('@/store');
  expect(store.state.Login).toEqual({ username: '', token: '' });
  expect(store.getters['Login/isLogin']).toBe(false);
});

it('깨진 JSON이 있어도 앱이 시작되고 로그아웃 상태가 된다', async () => {
  localStorage.setItem('vuex', '{broken');
  const { store } = await import('@/store');
  expect(store.state.Login).toEqual({ username: '', token: '' });
});

it('로그인 변경과 로그아웃을 기존 저장 형식으로 보존한다', async () => {
  const { store } = await import('@/store');
  store.commit('Login/setToken', 'jwt');
  store.commit('Login/setUsername', 'member');
  expect(JSON.parse(localStorage.getItem('vuex'))).toEqual({ Login: { username: 'member', token: 'jwt' } });
  store.commit('Login/logout');
  expect(JSON.parse(localStorage.getItem('vuex'))).toEqual({ Login: { username: '', token: '' } });
});

it('브라우저가 저장을 거부해도 현재 세션의 로그인과 로그아웃은 동작한다', async () => {
  const { store } = await import('@/store');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError'); });
  expect(() => {
    store.commit('Login/setToken', 'jwt');
    store.commit('Login/setUsername', 'member');
  }).not.toThrow();
  expect(store.getters['Login/isLogin']).toBe(true);
  expect(() => store.commit('Login/logout')).not.toThrow();
  expect(store.getters['Login/isLogin']).toBe(false);
});
