import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionWrite from '@/components/question/QuestionWrite.vue';

vi.mock('axios');

beforeEach(() => {
  global.$ = vi.fn(() => ({ summernote: vi.fn((action) => action === 'code' ? '<p>본문</p>' : undefined) }));
});
afterEach(() => vi.clearAllMocks());

test('실패한 질문을 같은 태그로 재제출해도 요청마다 태그가 한 번만 들어간다', async () => {
  axios.post.mockRejectedValueOnce(new Error('server')).mockResolvedValueOnce({ data: {} });
  const wrapper = mount(QuestionWrite, { global: {
    stubs: { RouterLink: true, hashtags: { template: '<button type="button" data-test="tags" @click="$emit(\'addHashtags\', [{ value: \'JAVA\' }])">태그 추가</button>' } },
    mocks: {
      $store: { state: { Login: { token: 'token', username: 'member' } } },
      $router: { push: vi.fn(), replace: vi.fn(), currentRoute: { value: { fullPath: '/question/add' } } },
    },
  } });
  await wrapper.get('#question-title').setValue('질문');
  await wrapper.get('#content').setValue('본문');
  await wrapper.get('[data-test="tags"]').trigger('click');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await wrapper.get('form').trigger('submit');
  await flushPromises();

  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(axios.post.mock.calls[0][1].hashtags).toEqual(['JAVA']);
  expect(axios.post.mock.calls[1][1].hashtags).toEqual(['JAVA']);
});

test('질문은 Markdown을 안전한 HTML로 저장하고 실패하면 입력을 보존하며 안내한다', async () => {
  axios.post.mockRejectedValue(new Error('server'));
  const wrapper = mount(QuestionWrite, { global: { stubs: { RouterLink: true }, mocks: {
    $store: { state: { Login: { token: 'jwt', username: 'member' } } },
    $router: { push: vi.fn(), replace: vi.fn(), currentRoute: { value: { fullPath: '/questions/new' } } },
  } } });
  await wrapper.get('#question-title').setValue('서식 질문');
  await wrapper.get('#content').setValue('## 제목\n\n**강조**<script>evil()</script>');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await vi.waitFor(() => expect(axios.post).toHaveBeenCalled());
  expect(axios.post.mock.calls[0][1].content).toContain('<h2>제목</h2>');
  expect(axios.post.mock.calls[0][1].content).toContain('<strong>강조</strong>');
  expect(axios.post.mock.calls[0][1].content).not.toContain('<script>');
  expect(wrapper.get('[role="alert"]').text()).toContain('저장하지 못했습니다');
  expect(wrapper.get('#content').element.value).toContain('## 제목');
});

test('질문 저장 중에는 중복 제출을 막는다', async () => {
  let resolveRequest;
  axios.post.mockImplementation(() => new Promise(resolve => { resolveRequest = resolve; }));
  const wrapper = mount(QuestionWrite, { global: { stubs: { RouterLink: true }, mocks: {
    $store: { state: { Login: { token: 'jwt', username: 'member' } } },
    $router: { push: vi.fn(), replace: vi.fn() },
  } } });
  await wrapper.get('#question-title').setValue('질문');
  await wrapper.get('#content').setValue('본문');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  resolveRequest({ data: 'ok' });
  await flushPromises();
});
