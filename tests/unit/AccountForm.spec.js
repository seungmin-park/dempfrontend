import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AccountForm from '@/components/AccountForm.vue';
vi.mock('axios');
beforeEach(() => vi.clearAllMocks());

async function fillRegistration(password) {
  axios.get.mockResolvedValue({ data: true });
  axios.post.mockResolvedValue({ data: { id: 1, username: 'member' } });
  const push = vi.fn();
  const wrapper = mount(AccountForm, { global: { mocks: {
    $store: { state: { Login: { token: '' } } }, $router: { push },
  } } });
  await wrapper.get('#username').setValue('member');
  await wrapper.get('button[type="button"]').trigger('click');
  await flushPromises();
  await wrapper.get('#password').setValue(password);
  await wrapper.get('#checkedPassword').setValue(password);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  return { wrapper, push };
}

it.each(['a'.repeat(73), '가'.repeat(25)])('가입 비밀번호의 바이트 제한을 안내하고 초과 입력은 전송하지 않는다 (%s)', async password => {
  const { wrapper } = await fillRegistration(password);
  await vi.waitFor(() => expect(wrapper.text()).toContain('비밀번호가 너무 깁니다'));
  expect(axios.post).not.toHaveBeenCalled();
});

it('72바이트 경계의 비밀번호는 잘라내지 않고 그대로 가입 요청한다', async () => {
  const password = '가'.repeat(24);
  const { push } = await fillRegistration(password);
  await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
  expect(axios.post.mock.calls[0][1].get('password')).toBe(password);
});
