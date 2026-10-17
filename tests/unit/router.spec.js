import { vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createAuthGuard, router } from '@/router';
import { apiClient } from '@/api/client';
import { store } from '@/store';
import { AxiosError } from 'axios';

vi.unmock('axios');

test('토큰만 남은 상태는 보호 경로 진입 시 로그인으로 돌리고 원래 경로를 보존한다', () => {
  const guard = createAuthGuard({ state: { Login: { token: 'stale', username: '' } } });
  expect(guard({ meta: { requiresAuth: true }, fullPath: '/questions/7?tab=answers' })).toEqual({
    path: '/login', query: { redirect: '/questions/7?tab=answers' },
  });
  expect(guard({ meta: {}, fullPath: '/question' })).toBe(true);
});

test('로그인과 회원가입 공개 경로는 유지한다', () => {
  expect(router.resolve('/login').path).toBe('/login');
  expect(router.resolve('/account').path).toBe('/account');
});

test('이전 관심 공고 주소는 마이페이지 관심 공고 섹션으로 연결한다', () => {
  expect(router.resolve('/saved').matched.at(-1).redirect).toEqual({ path: '/mypage', query: { tab: 'saved' } });
});

test('401 처리 뒤 토큰과 사용자 이름이 모두 비워지고 원래 경로로 돌아올 수 있다', async () => {
  store.commit('Login/setToken', 'expired');
  store.commit('Login/setUsername', 'member');
  await router.push('/questions/7?tab=answers');
  await router.isReady();
  await expect(apiClient.get('/api/question/detail/7', {
    adapter: async config => { throw new AxiosError('unauthorized', undefined, config, undefined, { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }); },
  })).rejects.toMatchObject({ response: { status: 401 } });
  await flushPromises();
  expect(store.state.Login).toMatchObject({ token: '', username: '' });
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/login'));
  expect(router.currentRoute.value.query.redirect).toBe('/questions/7?tab=answers');
});
test('이전 공고 등록 주소는 관리자 등록으로 연결한다', () => {
  expect(router.resolve('/addAnnounce').matched.at(-1).redirect).toBe('/admin/announcements/new');
});

test("만료 토큰으로 공개 메인에 접속하면 세션만 비우고 메인에 머문다", async () => {
  store.commit("Login/setToken", "expired");
  store.commit("Login/setUsername", "member");
  await router.push("/");
  await router.isReady();
  await expect(apiClient.get("/api/admin/me", {
    adapter: async config => { throw new AxiosError("unauthorized", undefined, config, undefined, { status: 401, statusText: "Unauthorized", data: {}, headers: {}, config }); },
  })).rejects.toMatchObject({ response: { status: 401 } });
  await flushPromises();
  expect(store.state.Login).toMatchObject({ token: "", username: "" });
  expect(router.currentRoute.value.path).toBe("/");
});
