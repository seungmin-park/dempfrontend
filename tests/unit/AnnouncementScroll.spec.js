import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementScroll from '@/components/announcement/AnnouncementScroll.vue';
vi.mock('axios');

it('이전 공고에 회사 정보가 없어도 관련 공고를 보여준다', async () => {
  axios.get.mockResolvedValue({ data: [{ id: 1, title: '레거시 공고', company: null, image: '' }] });
  const wrapper = mount(AnnouncementScroll, { global: { mocks: { $router: { push: vi.fn() } } } });
  await flushPromises();
  expect(wrapper.text()).toContain('레거시 공고');
  expect(wrapper.findAll('.anncoucement-scroll-items')).toHaveLength(1);
});

afterEach(() => history.replaceState(null, ''));
function mountWithHistory(back) {
  axios.get.mockResolvedValue({ data: [] });
  history.replaceState({ back }, '');
  const router = { push: vi.fn(), back: vi.fn(), resolve: vi.fn(location => ({ fullPath: `${location.path}?${new URLSearchParams(location.query)}` })) };
  const wrapper = mount(AnnouncementScroll, { global: { mocks: { $router: router, $route: { query: { languages: 'JAVA' } } } } });
  return { wrapper, router };
}
it('바로 앞 기록이 같은 검색 목록이면 새 기록을 만들지 않고 그 목록으로 돌아간다', async () => {
  const { wrapper, router } = mountWithHistory('/?languages=JAVA');
  await wrapper.get('[aria-label="검색 결과로 돌아가기"]').trigger('click');
  expect(router.back).toHaveBeenCalledOnce();
  expect(router.push).not.toHaveBeenCalled();
});
it('다른 화면에서 들어온 상세는 검색 조건을 담은 목록으로 이동한다', async () => {
  const { wrapper, router } = mountWithHistory('/mypage?tab=saved');
  await wrapper.get('[aria-label="검색 결과로 돌아가기"]').trigger('click');
  expect(router.back).not.toHaveBeenCalled();
  expect(router.push).toHaveBeenCalledWith({ path: '/', query: { languages: 'JAVA' } });
});
