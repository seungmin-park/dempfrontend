import { flushPromises } from '@vue/test-utils';
import { createAuthGuard, router } from '@/router';
import { apiClient } from '@/api/client';
import { store } from '@/store';

jest.unmock('axios');

test('토큰만 남은 상태는 보호 경로 진입 시 로그인으로 돌리고 원래 경로를 보존한다', () => {
  const guard = createAuthGuard({ state: { Login: { token: 'stale', username: '' } } });
  expect(guard({ meta: { requiresAuth: true }, fullPath: '/questions/7?tab=answers' })).toEqual({
    path: '/login', query: { redirect: '/questions/7?tab=answers' },
  });
  expect(guard({ meta: {}, fullPath: '/question' })).toBe(true);
});

test('401 처리 뒤 토큰과 사용자 이름이 모두 비워지고 원래 경로로 돌아올 수 있다', async () => {
  store.commit('Login/setToken', 'expired');
  store.commit('Login/setUsername', 'member');
  await router.push('/questions/7?tab=answers');
  await router.isReady();
  await expect(apiClient.get('/api/question/detail/7', {
    adapter: async config => { throw { response: { status: 401 }, config }; },
  })).rejects.toMatchObject({ response: { status: 401 } });
  await flushPromises();
  expect(store.state.Login).toMatchObject({ token: '', username: '' });
  expect(router.currentRoute.value.path).toBe('/login');
  expect(router.currentRoute.value.query.redirect).toBe('/questions/7?tab=answers');
});
