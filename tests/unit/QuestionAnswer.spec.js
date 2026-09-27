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

test('답변 비추천을 답변 전용 경로에 저장하고 내 선택을 표시한다', async () => {
  global.$ = () => ({ summernote: vi.fn() });
  axios.get.mockResolvedValue({ data: [{ answerId: 4, username: 'writer', content: '답변', recommend: 3, dislike: 0 }] });
  const wrapper = mount(QuestionAnswer, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } }, $route: { params: { questionId: 7 } },
  } } });
  await flushPromises();
  axios.put.mockResolvedValue({ data: { recommend: 3, dislike: 1, myReaction: 'DISLIKE' } });
  const buttons = wrapper.findAll('.question-answer-reaction button');
  expect(buttons[0].text()).toContain('3');
  await buttons[1].trigger('click'); await flushPromises();
  expect(axios.put).toHaveBeenCalledWith('/api/answer/4/reaction', { reaction: 'DISLIKE' });
  expect(buttons[1].attributes('aria-pressed')).toBe('true');
  expect(buttons[1].text()).toContain('1');
  delete global.$;
});
