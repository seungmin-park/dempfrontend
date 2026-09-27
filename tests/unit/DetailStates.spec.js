import { mount, flushPromises } from '@vue/test-utils';
import { reactive } from 'vue';
import axios from 'axios';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail.vue';
import QuestionDetail from '@/components/question/QuestionDetail.vue';
import QuestionAnswer from '@/components/question/QuestionAnswer.vue';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
import AnnouncementScroll from '@/components/announcement/AnnouncementScroll.vue';
import { router } from '@/router';
vi.mock('axios');
beforeEach(() => axios.get.mockReset());
afterEach(() => vi.clearAllMocks());
const record = title => ({ id: 1, answerId: 1, title, content: title, username: 'member', hits: 1, recommend: 0, dislike: 0, hashtags: [], language: ['JAVA'], company: { name: '회사' }, minCareer: 0, maxCareer: 3 });
function options(route = reactive({ params: { itemId: '1', questionId: '1' }, query: {} })) { return { global: { stubs: { RouterLink: true }, mocks: { $route: route, $store: { state: { Login: { token: 'jwt', username: 'member' } } }, $router: { push: vi.fn() }, emitter: { on: vi.fn(), off: vi.fn() } } } }; }
it.each([[AnnouncementDetail, false], [QuestionDetail, false], [QuestionAnswer, true]])('상세와 답변은 이전 경로 응답을 버리고 새 경로를 표시한다', async (component, array) => {
  let finishOld;
  axios.get.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; })).mockResolvedValueOnce({ data: array ? [record('새 내용')] : record('새 내용') });
  const route = reactive({ params: { itemId: '1', questionId: '1' }, query: {} });
  const wrapper = mount(component, options(route));
  expect(wrapper.get('[role="status"]').text()).toContain('불러오는 중');
  route.params = { itemId: '2', questionId: '2' };
  await flushPromises();
  expect(wrapper.text()).toContain('새 내용');
  finishOld({ data: array ? [record('이전 내용')] : record('이전 내용') });
  await flushPromises();
  expect(wrapper.text()).not.toContain('이전 내용');
});
it.each([[404, '찾을 수 없습니다'], [403, '접근 권한이 없습니다'], [500, '불러오지 못했습니다']])('상세 HTTP %s 오류를 구분하고 재시도한다', async (status, message) => {
  axios.get.mockRejectedValueOnce({ response: { status } }).mockResolvedValueOnce({ data: record('복구 공고') });
  const wrapper = mount(AnnouncementDetail, options());
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain(message);
  expect(wrapper.text()).not.toContain('undefined');
  await wrapper.get('[data-test="retry"]').trigger('click');
  await flushPromises();
  expect(wrapper.text()).toContain('복구 공고');
});
it('지원 링크에서 실행 가능한 프로토콜을 허용하지 않는다', async () => {
  axios.get.mockResolvedValue({ data: { ...record('공고'), accessUrl: 'javascript:alert(1)' } });
  const wrapper = mount(AnnouncementDetail, options());
  await flushPromises();
  expect(wrapper.find('a[href^="javascript:"]').exists()).toBe(false);
  expect(wrapper.text()).toContain('지원 링크가 없습니다');
});
it('공고 상세로 이동하고 목록으로 돌아와도 검색 조건을 유지한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 8, title: '공고' }], last: true } });
  const route = { params: {}, query: { type: 'EDU', tuition: 'FREE' } };
  const opts = options(route);
  const list = mount(AnnouncementList, opts);
  await flushPromises();
  await list.get('.job-card').trigger('click');
  expect(opts.global.mocks.$router.push).toHaveBeenCalledWith({ path: '/detail/8', query: route.query });
  axios.get.mockResolvedValue({ data: [] });
  const sidebar = mount(AnnouncementScroll, opts);
  await flushPromises();
  await sidebar.get('.anncoucement-scroll-history').trigger('click');
  expect(opts.global.mocks.$router.push).toHaveBeenLastCalledWith({ path: '/', query: route.query });
});
it('알 수 없는 URL도 404 화면으로 연결한다', () => {
  expect(router.resolve('/does-not-exist').matched).toHaveLength(1);
});
it('빈 검색 결과와 다음 페이지의 끝을 구분한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [], last: true } });
  const wrapper = mount(AnnouncementList, options());
  await flushPromises();
  expect(wrapper.text()).toContain('조건에 맞는 공고가 없습니다');
});
