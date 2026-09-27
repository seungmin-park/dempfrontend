import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionAnswer from '@/components/question/QuestionAnswer.vue';

vi.mock('axios');
afterEach(() => vi.clearAllMocks());

test('답변 Markdown 저장 실패는 입력을 보존하고 재시도 성공 시 본문을 비운다', async () => {
  global.$ = () => ({ summernote: vi.fn(() => '<p>이전 입력</p>') });
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockRejectedValueOnce(new Error('server')).mockResolvedValueOnce({ data: [{ answerId: 2, username: 'member', content: '<p><strong>답변</strong></p>', recommend: 0, dislike: 0 }] });
  const wrapper = mount(QuestionAnswer, { global: { mocks: {
    $store: { state: { Login: { token: 'jwt', username: 'member' } } }, $route: { params: { questionId: '7' } },
  } } });
  await flushPromises();
  await wrapper.get('#answer').setValue('**답변**');
  await wrapper.get('button[type="submit"]').trigger('click');
  await flushPromises();
  expect(axios.post.mock.calls[0][1].answerContent).toContain('<strong>답변</strong>');
  expect(wrapper.get('[role="alert"]').text()).toContain('저장하지 못했습니다');
  expect(wrapper.get('#answer').element.value).toBe('**답변**');
  await wrapper.get('button[type="submit"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('#answer').element.value).toBe('');
  expect(wrapper.get('.question-answer').text()).toContain('답변');
});

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
