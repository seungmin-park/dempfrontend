import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionAnswer from '@/components/question/QuestionAnswer.vue';

vi.mock('axios');

test('답변 추천 수를 서버 값으로 표시하고 반응 버튼을 비활성화한다', async () => {
  global.$ = () => ({ summernote: vi.fn() });
  axios.get.mockResolvedValue({ data: [{ answerId: 4, username: 'writer', content: '답변', recommend: 3, dislike: 0 }] });
  const wrapper = mount(QuestionAnswer, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } }, $route: { params: { questionId: 7 } },
  } } });
  await flushPromises();
  const buttons = wrapper.findAll('.question-answer-reaction button');
  expect(buttons[0].text()).toContain('3');
  expect(buttons.every(button => button.attributes('disabled') !== undefined)).toBe(true);
  expect(wrapper.text()).toContain('반응 저장 기능 준비 중');
  delete global.$;
});
