import { vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import ContentReactionControl from '@/components/common/ContentReactionControl.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());

test('같은 답변의 새 집계 props가 저장 중 요청을 해제하거나 성공 응답을 버리지 않는다', async () => {
  let resolve;
  axios.put.mockImplementation(() => new Promise(done => { resolve = done; }));
  const wrapper = mount(ContentReactionControl, { props: { target: 'answer', targetId: 3, recommend: 0, dislike: 0, myReaction: 'NONE' } });
  await wrapper.get('button').trigger('click');
  await wrapper.setProps({ recommend: 1 });
  expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  await wrapper.get('button').trigger('click');
  expect(axios.put).toHaveBeenCalledTimes(1);
  resolve({ data: { recommend: 2, dislike: 0, myReaction: 'RECOMMEND' } });
  await flushPromises();
  expect(wrapper.get('button').text()).toContain('2');
  expect(wrapper.get('button').attributes('aria-pressed')).toBe('true');
});

test('다른 대상으로 이동한 뒤 도착한 이전 반응 응답은 무시한다', async () => {
  let resolve;
  axios.put.mockImplementation(() => new Promise(done => { resolve = done; }));
  const wrapper = mount(ContentReactionControl, { props: { target: 'question', targetId: 3, recommend: 0, dislike: 0, myReaction: 'NONE' } });
  await wrapper.get('button').trigger('click');
  await wrapper.setProps({ targetId: 4, recommend: 9, myReaction: 'DISLIKE' });
  resolve({ data: { recommend: 1, dislike: 0, myReaction: 'RECOMMEND' } });
  await flushPromises();
  expect(wrapper.get('button').text()).toContain('9');
  expect(wrapper.get('button').attributes('aria-pressed')).toBe('false');
  expect(wrapper.findAll('button')[1].attributes('aria-pressed')).toBe('true');
});
