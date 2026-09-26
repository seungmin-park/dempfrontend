import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import LoginForm from '@/components/LoginForm.vue';

jest.mock('axios');
afterEach(() => jest.restoreAllMocks());

function mountLogin() {
  const commit = jest.fn();
  const push = jest.fn();
  const wrapper = mount(LoginForm, {
    global: {
      mocks: {
        $store: { state: { Login: { token: '' } }, commit },
        $router: { push, replace: jest.fn() },
        $route: { query: { redirect: '/question' } },
      },
      stubs: { RouterLink: true },
    },
  });
  return { wrapper, commit, push };
}

async function submit(wrapper) {
  await wrapper.get('#username').setValue('tester');
  await wrapper.get('#password').setValue('private-password');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await flushPromises();
}

test('로그인 성공 시 인증 상태와 이동 경로를 반영하고 자격 증명을 출력하지 않는다', async () => {
  axios.post.mockResolvedValue({ data: { jwt: 'test-token', username: 'tester' } });
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const { wrapper, commit, push } = mountLogin();
  await submit(wrapper);
  expect(axios.post.mock.calls.at(-1)[1].get('password')).toBe('private-password');
  expect(commit).toHaveBeenCalledWith('Login/setToken', 'test-token');
  expect(commit).toHaveBeenCalledWith('Login/setUsername', 'tester');
  expect(push).toHaveBeenCalledWith({ path: '/question' });
  expect(log).not.toHaveBeenCalled();
});

test('로그인 실패 시 오류를 알리고 인증 상태와 경로를 바꾸지 않는다', async () => {
  axios.post.mockRejectedValue(new Error('unauthorized'));
  const alert = jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  const { wrapper, commit, push } = mountLogin();
  await submit(wrapper);
  expect(alert).toHaveBeenCalledWith('아이디 혹은 비밀번호가 잘못 되었습니다.');
  expect(commit).not.toHaveBeenCalled();
  expect(push).not.toHaveBeenCalled();
});
