import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionDetail from '@/components/question/QuestionDetail.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());
const detail = { id: 7, title: '질문', username: 'member', content: '본문', recommend: 3, dislike: 1, myReaction: 'NONE', hashtags: [] };
async function page(data = detail) {
  axios.get.mockResolvedValue({ data });
  const wrapper = mount(QuestionDetail, { global: { stubs: { RouterLink: true }, mocks: {
    $store: { state: { Login: { token: 'token', username: 'member' } } },
    $route: { params: { questionId: 7 } },
    $router: { replace: vi.fn(), currentRoute: { value: { fullPath: '/questions/7' } } },
  } } });
  await flushPromises(); return wrapper;
}
test('질문 추천을 서버에 저장한 개수와 내 선택으로 표시하고 다시 누르면 취소한다', async () => {
  axios.put.mockResolvedValueOnce({ data: { recommend: 4, dislike: 1, myReaction: 'RECOMMEND' } })
    .mockResolvedValueOnce({ data: { recommend: 3, dislike: 1, myReaction: 'NONE' } });
  const wrapper = await page();
  const up = wrapper.get('.content-reactions button');
  expect(up.attributes('disabled')).toBeUndefined();
  await up.trigger('click'); await flushPromises();
  expect(axios.put).toHaveBeenLastCalledWith('/api/question/7/reaction', { reaction: 'RECOMMEND' });
  expect(up.text()).toContain('4'); expect(up.attributes('aria-pressed')).toBe('true');
  await up.trigger('click'); await flushPromises();
  expect(axios.put).toHaveBeenLastCalledWith('/api/question/7/reaction', { reaction: 'NONE' });
  expect(up.text()).toContain('3'); expect(up.attributes('aria-pressed')).toBe('false');
});
test('새로 조회한 내 선택을 표시하고 반대 반응으로 전환한다', async () => {
  axios.put.mockResolvedValue({ data: { recommend: 2, dislike: 2, myReaction: 'DISLIKE' } });
  const wrapper = await page({ ...detail, myReaction: 'RECOMMEND' });
  const buttons = wrapper.findAll('.content-reactions button');
  expect(buttons[0].attributes('aria-pressed')).toBe('true');
  await buttons[1].trigger('click'); await flushPromises();
  expect(axios.put).toHaveBeenLastCalledWith('/api/question/7/reaction', { reaction: 'DISLIKE' });
  expect(buttons[0].text()).toContain('2'); expect(buttons[1].attributes('aria-pressed')).toBe('true');
});
test('저장 실패는 기존 개수와 선택을 보존하고 재시도할 수 있다', async () => {
  axios.put.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: { recommend: 4, dislike: 1, myReaction: 'RECOMMEND' } });
  const wrapper = await page(); const up = wrapper.get('.content-reactions button');
  await up.trigger('click'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('저장하지 못했습니다');
  expect(up.text()).toContain('3');
  await up.trigger('click'); await flushPromises();
  expect(up.text()).toContain('4'); expect(wrapper.find('[role="alert"]').exists()).toBe(false);
});
test('저장 중에는 연타를 막고 컴포넌트 종료 후 늦은 응답을 적용하지 않는다', async () => {
  let resolve; axios.put.mockImplementation(() => new Promise(done => { resolve = done; }));
  const wrapper = await page(); const up = wrapper.get('.content-reactions button');
  await up.trigger('click'); await up.trigger('click');
  expect(axios.put).toHaveBeenCalledTimes(1); expect(up.attributes('disabled')).toBeDefined();
  wrapper.unmount(); resolve({ data: { recommend: 4, dislike: 1, myReaction: 'RECOMMEND' } }); await flushPromises();
});
