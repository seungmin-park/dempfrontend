import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionList from '@/components/question/QuestionList.vue';
import { createMemoryHistory, createRouter } from 'vue-router';

jest.mock('axios');

afterEach(() => jest.clearAllMocks());

test('질문 페이지를 넘겨도 검색 조건을 유지하고 마지막 페이지에서 다음을 막는다', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { content: [{ id: 5, title: 'Java 첫 질문', hits: 0, recommend: 0 }], last: false, number: 0 } })
    .mockResolvedValueOnce({ data: { content: [{ id: 3, title: 'Java 다음 질문', hits: 0, recommend: 0 }], last: true, number: 1 } });
  const wrapper = mount(QuestionList, { global: { mocks: {
    $route: { query: { orderBy: 'hits', title: 'Java', hashtags: ['JAVA'] } },
    $router: { push: jest.fn() },
    $store: { state: { Login: { token: 'token' } } },
    emitter: { on: jest.fn(), off: jest.fn() },
  } } });
  await flushPromises();

  expect(wrapper.text()).toContain('Java 첫 질문');
  expect(axios.get).toHaveBeenNthCalledWith(1, '/api/question', { params: {
    orderBy: 'hits', title: 'Java', content: '', hashtags: ['JAVA'], page: 0, size: 20,
  } });

  await wrapper.get('[data-test="next-page"]').trigger('click');
  await flushPromises();

  expect(wrapper.text()).toContain('Java 다음 질문');
  expect(wrapper.text()).not.toContain('Java 첫 질문');
  expect(axios.get).toHaveBeenNthCalledWith(2, '/api/question', { params: {
    orderBy: 'hits', title: 'Java', content: '', hashtags: ['JAVA'], page: 1, size: 20,
  } });
  expect(wrapper.get('[data-test="next-page"]').attributes('disabled')).toBeDefined();
});

test('검색 조건이 바뀌면 첫 페이지부터 새 태그 조건으로 조회한다', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { content: [{ id: 5, title: 'Java' }], last: false, number: 0 } })
    .mockResolvedValueOnce({ data: { content: [{ id: 4, title: 'Java 다음' }], last: true, number: 1 } })
    .mockResolvedValueOnce({ data: { content: [{ id: 3, title: 'Spring' }], last: true, number: 0 } });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/question', component: { template: '<div />' } }],
  });
  await router.push({ path: '/question', query: { title: 'Java', hashtags: 'JAVA' } });
  await router.isReady();
  const wrapper = mount(QuestionList, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } },
    emitter: { on: jest.fn(), off: jest.fn() },
  }, plugins: [router] } });
  await flushPromises();
  await wrapper.get('[data-test="next-page"]').trigger('click');
  await flushPromises();

  await router.push({ path: '/question', query: { title: 'Spring', hashtags: 'SPRING' } });
  await flushPromises();

  expect(axios.get).toHaveBeenNthCalledWith(3, '/api/question', { params: {
    orderBy: '', title: 'Spring', content: '', hashtags: ['SPRING'], page: 0, size: 20,
  } });
  expect(wrapper.text()).toContain('Spring');
  expect(wrapper.text()).not.toContain('Java 다음');
});
