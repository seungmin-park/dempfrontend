import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import axios from 'axios';
import QuestionList from '@/components/question/QuestionList.vue';
import QuestionMenu from '@/components/question/QuestionMenu.vue';
vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); });
async function setup(component, query = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/question', component: { template: '<div />' } }] });
  await router.push({ path: '/question', query });
  const wrapper = mount(component, { global: { plugins: [router], mocks: { emitter: { on: vi.fn(), off: vi.fn() }, $store: { state: { Login: { token: '' } } } } } });
  return { wrapper, router };
}
it('새 검색의 첫 페이지가 실패하면 재시도도 첫 페이지를 요청한다', async () => {
  axios.get.mockResolvedValueOnce({ data: { content: [{ id: 1, title: '이전 검색' }], last: false, number: 0 } })
    .mockResolvedValueOnce({ data: { content: [{ id: 2, title: '이전 두 번째' }], last: true, number: 1 } })
    .mockRejectedValueOnce(new Error('server'))
    .mockResolvedValueOnce({ data: { content: [], last: true, number: 0 } });
  const { wrapper, router } = await setup(QuestionList);
  await flushPromises();
  await wrapper.get('[data-test="next-page"]').trigger('click');
  await flushPromises();
  await router.push('/question?title=Spring');
  await flushPromises();
  await wrapper.get('[data-test="retry"]').trigger('click');
  await flushPromises();
  expect(axios.get.mock.calls.map(([, config]) => config.params.page)).toEqual([0, 1, 0, 0]);
});
it('질문 목록은 로딩과 빈 검색 결과를 구분한다', async () => {
  let resolve;
  axios.get.mockImplementation(() => new Promise(done => { resolve = done; }));
  const { wrapper } = await setup(QuestionList);
  expect(wrapper.get('[role="status"]').text()).toContain('불러오는 중');
  resolve({ data: { content: [], last: true, number: 0 } });
  await flushPromises();
  expect(wrapper.text()).toContain('조건에 맞는 질문이 없습니다');
  expect(wrapper.find('.question-pages').exists()).toBe(false);
});
it('현재 정렬에 해당하는 질문 탭 하나만 선택된다', async () => {
  const { wrapper } = await setup(QuestionMenu, { orderBy: 'hits' });
  expect(wrapper.findAll('[aria-current="page"]').map(item => item.text())).toEqual(['인기 질문']);
});
