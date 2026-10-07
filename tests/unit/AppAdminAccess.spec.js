import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import axios from 'axios';
import App from '@/App.vue';
import { Login } from '@/store/modules/Login';
vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); });

function app(token = '', username = '') {
  const store = createStore({ modules: { Login } });
  store.commit('Login/setUsername', username); store.commit('Login/setToken', token);
  const wrapper = mount(App, { global: { plugins: [store], stubs: { RouterLink: true, RouterView: true } } });
  return { store, wrapper };
}
const adminLink = wrapper => wrapper.find('.site-footer router-link-stub[to="/admin"]');

it('비회원에게 관리자 footer를 숨기고 권한 API도 호출하지 않는다', async () => {
  const { wrapper } = app(); await flushPromises();
  expect(adminLink(wrapper).exists()).toBe(false);
  expect(axios.get).not.toHaveBeenCalled();
});

it('일반 회원의 서버 403에는 관리자 footer를 표시하지 않는다', async () => {
  axios.get.mockRejectedValue({ response: { status: 403 } });
  const { wrapper } = app('member-token', 'member'); await flushPromises();
  expect(axios.get).toHaveBeenCalledWith('/api/admin/me');
  expect(adminLink(wrapper).exists()).toBe(false);
});

it('서버 권한 확인 중에는 숨기고 성공한 관리자에게만 표시하며 로그아웃에 초기화한다', async () => {
  let finish;
  axios.get.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const { wrapper, store } = app('admin-token', 'admin');
  expect(axios.get).toHaveBeenCalledWith('/api/admin/me');
  expect(adminLink(wrapper).exists()).toBe(false);
  finish({ data: { id: 1, username: 'admin' } }); await flushPromises();
  expect(adminLink(wrapper).exists()).toBe(true);
  store.commit('Login/logout'); await flushPromises();
  expect(adminLink(wrapper).exists()).toBe(false);
});

it('이전 관리자 응답이 늦게 도착해도 새 일반 회원에게 링크를 노출하지 않는다', async () => {
  let finish;
  axios.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
    .mockRejectedValueOnce({ response: { status: 403 } });
  const { wrapper, store } = app('admin-token', 'admin');
  expect(axios.get).toHaveBeenCalledWith('/api/admin/me');
  store.commit('Login/logout');
  store.commit('Login/setUsername', 'member'); store.commit('Login/setToken', 'member-token');
  await flushPromises();
  finish({ data: { id: 1, username: 'admin' } }); await flushPromises();
  expect(adminLink(wrapper).exists()).toBe(false);
});
