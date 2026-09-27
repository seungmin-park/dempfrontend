import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());
function setup(query = {}) {
  const push = vi.fn();
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() }, $route: { query }, $router: { push },
  } } });
  return { wrapper, push };
}
it.each([
  [{}, '아직 등록된 공고가 없습니다.', '새 공고가 등록되면 이곳에서 확인할 수 있습니다.'],
  [{ type: 'EMP' }, '아직 등록된 채용 공고가 없습니다.', '전체 공고에서 부트캠프·교육과정도 둘러보세요.'],
  [{ type: 'EDU' }, '아직 등록된 부트캠프·교육과정이 없습니다.', '전체 공고에서 채용 기회도 둘러보세요.'],
  [{ q: '없는 회사' }, '“없는 회사”에 해당하는 공고가 없습니다.', '검색어의 철자를 확인하거나 더 짧은 단어로 검색해 보세요.'],
  [{ languages: 'JAVA', career: '3' }, '선택한 조건에 맞는 공고가 없습니다.', '직무·기술 스택·경력 등 선택한 조건을 줄여보세요.'],
  [{ type: 'EDU', tuition: 'FREE', status: 'OPEN' }, '선택한 조건에 맞는 부트캠프·교육과정이 없습니다.', '분야·기술 스택·모집 상태·교육비 조건을 줄여보세요.'],
])('성공한 빈 응답은 조건 %j에 맞는 안내를 보여준다', async (query, title, description) => {
  axios.get.mockResolvedValue({ data: { content: [], last: true } });
  const { wrapper } = setup(query); await flushPromises();
  expect(wrapper.get('.empty-state h2').text()).toBe(title);
  expect(wrapper.get('.empty-state').text()).toContain(description);
  expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  expect(wrapper.find('[data-test="retry"]').exists()).toBe(false);
});
it('빈 검색에서 조건 해제는 현재 교육 탭만 남기고 URL 조건을 초기화한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [], last: true } });
  const { wrapper, push } = setup({ type: 'EDU', q: '없는 과정', languages: 'JAVA', tuition: 'FREE' }); await flushPromises();
  await wrapper.get('[data-test="empty-reset"]').trigger('click');
  expect(push).toHaveBeenCalledWith({ path: '/', query: { type: 'EDU' } });
});
it('등록된 교육이 없는 경우 전체 공고로 이동할 수 있다', async () => {
  axios.get.mockResolvedValue({ data: { content: [], last: true } });
  const { wrapper, push } = setup({ type: 'EDU' }); await flushPromises();
  await wrapper.get('[data-test="empty-browse"]').trigger('click');
  expect(push).toHaveBeenCalledWith({ path: '/', query: {} });
});
it('첫 요청 중에는 로딩 안내만 표시하고 빈 결과나 실패로 단정하지 않는다', async () => {
  let resolve; axios.get.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const { wrapper } = setup(); await flushPromises();
  expect(wrapper.get('[role="status"]').text()).toContain('공고를 불러오고 있습니다');
  expect(wrapper.find('.empty-state').exists()).toBe(false);
  expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  resolve({ data: { content: [], last: true } }); await flushPromises();
});
it('다음 페이지 실패는 기존 결과를 보존하고 추가 로딩 실패임을 설명한다', async () => {
  axios.get.mockResolvedValueOnce({ data: { content: [{ id: 1, title: '유지할 공고', language: [] }], last: false } }).mockRejectedValueOnce(new Error('network'));
  const { wrapper } = setup(); await flushPromises();
  await wrapper.get('[data-test="load-more"]').trigger('click'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('다음 공고를 불러오지 못했습니다.');
  expect(wrapper.get('[role="alert"]').text()).toContain('지금까지 불러온 공고는 그대로 볼 수 있습니다.');
  expect(wrapper.text()).toContain('유지할 공고');
  expect(wrapper.find('.empty-state').exists()).toBe(false);
});
