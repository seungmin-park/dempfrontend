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
    stubs: { hashtags: { template: '<button type="button" data-test="tags" @click="$emit(\'addHashtags\', [{ value: \'JAVA\' }])">태그 추가</button>' } },
    mocks: {
      $store: { state: { Login: { token: 'token', username: 'member' } } },
      $router: { push: vi.fn(), replace: vi.fn(), currentRoute: { value: { fullPath: '/question/add' } } },
    },
  } });
  await wrapper.get('#question-title').setValue('질문');
  await wrapper.get('[data-test="tags"]').trigger('click');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await wrapper.get('form').trigger('submit');
  await flushPromises();

  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(axios.post.mock.calls[0][1].hashtags).toEqual(['JAVA']);
  expect(axios.post.mock.calls[1][1].hashtags).toEqual(['JAVA']);
});
