import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AdminLayout from '@/views/admin/AdminLayout.vue';
import { createAuthGuard, router } from '@/router';
vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); });
const options = { global: { stubs: { RouterView: { template: '<div data-test="admin-content">운영 데이터</div>' }, RouterLink: true }, mocks: { $store: { state: { Login: { token: 'forged', username: 'user', roles: ['ROLE_ADMIN'] } } } } } };
it('localStorage 역할 대신 서버 권한 확인이 끝나야 운영 화면을 표시한다', async () => {
  let finish;
  axios.get.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const wrapper = mount(AdminLayout, options);
  expect(wrapper.find('[data-test="admin-content"]').exists()).toBe(false);
  expect(axios.get).toHaveBeenCalledWith('/api/admin/me');
  finish({ data: { id: 1, username: 'admin' } });
  await flushPromises();
  expect(wrapper.find('[data-test="admin-content"]').exists()).toBe(true);
});
it('서버가 403을 반환하면 운영 화면을 숨기고 권한 부족을 안내한다', async () => {
  axios.get.mockRejectedValue({ response: { status: 403 } });
  const wrapper = mount(AdminLayout, options);
  await flushPromises();
  expect(wrapper.find('[data-test="admin-content"]').exists()).toBe(false);
  expect(wrapper.get('[role="alert"]').text()).toContain('관리자 권한');
});
it('관리자 경로 직접 접근도 기존 로그인 경계로 보호한다', () => {
  const route = router.resolve('/admin');
  expect(createAuthGuard({ state: { Login: { token: '', username: '' } } })(route)).toEqual({ path: '/login', query: { redirect: '/admin' } });
});
