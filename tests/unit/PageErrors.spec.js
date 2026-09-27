import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import LoginForm from '@/components/LoginForm.vue';
import AccountForm from '@/components/AccountForm.vue';
import AnnouncementScroll from '@/components/announcement/AnnouncementScroll.vue';
import QuestionPage from '@/views/question/QuestionDetail.vue';
vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); axios.post.mockReset(); vi.spyOn(window, 'alert').mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());
const opts = { global: { stubs: { RouterLink: true }, mocks: { $store: { state: { Login: { token: '', username: '' } }, commit: vi.fn() }, $router: { push: vi.fn(), replace: vi.fn(), currentRoute: { value: { fullPath: '/' } } }, $route: { params: { questionId: '1' }, query: {} } } } };
it.each([[LoginForm, 'loginMethod'], [AccountForm, 'registerAccount']])('인증 폼은 서버 오류를 안내하고 입력을 보존한다', async (component, method) => {
  axios.post.mockRejectedValue(new Error('server'));
  const wrapper = mount(component, opts);
  await wrapper.get('#username').setValue('member');
  await wrapper.get('#password').setValue('password');
  if (component === AccountForm) await wrapper.setData({ checkedUsername: true });
  wrapper.vm[method]();
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('다시');
  expect(wrapper.get('#username').element.value).toBe('member');
});
it('아이디를 바꾸면 이전 중복 확인 성공을 다시 사용하지 않는다', async () => {
  const wrapper = mount(AccountForm, opts);
  await wrapper.get('#username').setValue('checked');
  await wrapper.setData({ checkedUsername: true });
  await wrapper.get('#username').setValue('changed');
  expect(wrapper.text()).not.toContain('사용 가능한 아이디');
});
it('공고 사이드 목록 실패는 재시도할 수 있다', async () => {
  axios.get.mockRejectedValueOnce(new Error('server')).mockResolvedValueOnce({ data: [{ id: 1, title: '복구 목록', image: '', company: { name: '회사' } }] });
  const wrapper = mount(AnnouncementScroll, opts);
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('불러오지 못했습니다');
  await wrapper.get('[data-test="retry"]').trigger('click');
  await flushPromises();
  expect(wrapper.text()).toContain('복구 목록');
});
it('존재하지 않는 질문에는 답변 작성기를 표시하지 않는다', async () => {
  axios.get.mockImplementation(url => url.includes('/detail/') ? Promise.reject({ response: { status: 404 } }) : Promise.resolve({ data: [] }));
  const wrapper = mount(QuestionPage, { global: { ...opts.global, mocks: { ...opts.global.mocks, $store: { state: { Login: { token: 'jwt', username: 'member' } } } } } });
  await flushPromises();
  expect(wrapper.text()).toContain('찾을 수 없습니다');
  expect(wrapper.find('#answer').exists()).toBe(false);
});
