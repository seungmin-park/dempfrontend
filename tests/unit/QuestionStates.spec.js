import { mount, flushPromises } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import axios from 'axios';
import QuestionList from '@/components/question/QuestionList.vue';
import QuestionMenu from '@/components/question/QuestionMenu.vue';
import QuestionControl from '@/components/question/QuestionControl.vue';
import QuestionListPage from '@/views/question/QuestionList.vue';
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

it('상세에서 전달된 태그를 표시하고 개별 해제할 때 검색과 정렬을 보존한다', async () => {
  axios.get.mockImplementation(path => Promise.resolve({ data: path === '/api/question/hashtags' ? ['Docker', 'JAVA'] : { content: [], number: 0, last: true } }));
  const { wrapper, router } = await setup(QuestionListPage, { hashtags: ['Docker', 'JAVA'], title: '면접', orderBy: 'hits' });
  await flushPromises();
  expect(wrapper.get('[aria-label="선택한 해시태그"]').text()).toContain('#Docker');
  await wrapper.get('button[aria-label="Docker 태그 조건 해제"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ hashtags: ['JAVA'], title: '면접', orderBy: 'hits' });
  expect(wrapper.get('[aria-label="선택한 해시태그"]').text()).not.toContain('#Docker');
  await wrapper.get('button[aria-label="태그 조건 모두 해제"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ title: '면접', orderBy: 'hits' });
  expect(wrapper.find('[aria-label="선택한 해시태그"]').exists()).toBe(false);
});

it('태그 선택창은 URL 조건과 브라우저 뒤로 이동을 반영한다', async () => {
  axios.get.mockResolvedValue({ data: ['Docker', 'JAVA'] });
  const { wrapper, router } = await setup(QuestionControl, { hashtags: 'Docker', content: '본문', orderBy: 'hits' });
  await flushPromises();
  await wrapper.get('button[aria-expanded]').trigger('click');
  expect(wrapper.get('input[value="Docker"]').element.checked).toBe(true);
  await wrapper.get('input[value="JAVA"]').setValue(true);
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ hashtags: ['Docker', 'JAVA'], content: '본문', orderBy: 'hits' });
  router.back();
  await vi.waitFor(() => expect(router.currentRoute.value.query.hashtags).toBe('Docker'));
  expect(wrapper.get('input[value="Docker"]').element.checked).toBe(true);
  expect(wrapper.get('input[value="JAVA"]').element.checked).toBe(false);
});
