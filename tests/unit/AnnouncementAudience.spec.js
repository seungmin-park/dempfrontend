import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail.vue';
import AnnouncementScroll from '@/components/announcement/AnnouncementScroll.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());

const cases = [
  ['EDU', 3, 5, '교육', ''],
  ['EMP', 0, 0, '경력 무관', ''],
  ['EMP', 0, 3, '신입·경력', '3년 이하'],
  ['EMP', 3, 5, '경력', '3~5년'],
  ['EMP', 3, 0, '경력', '3년 이상'],
  ['EMP', 3, 3, '경력', '3년'],
  ['EMP', null, null, '채용', '경력 정보 없음'],
];
for (const [announcementType, minCareer, maxCareer, label, years] of cases) {
  it(`${announcementType} ${minCareer}~${maxCareer}의 모집 구분을 목록·상세·관련 공고에서 동일하게 표시한다`, async () => {
    const item = { id: 1, title: '대상 공고', company: null, language: [], image: '', announcementType, minCareer, maxCareer };
    axios.get.mockResolvedValueOnce({ data: { content: [item], last: true } });
    const list = mount(AnnouncementList, { global: { mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } });
    await flushPromises();
    axios.get.mockResolvedValueOnce({ data: item });
    const detail = mount(AnnouncementDetail, { global: { mocks: { $store: { state: { Login: { token: 'jwt' } } }, $route: { params: { itemId: '1' } } } } });
    await flushPromises();
    axios.get.mockResolvedValueOnce({ data: [item] });
    const scroll = mount(AnnouncementScroll);
    await flushPromises();
    for (const wrapper of [list, detail, scroll]) {
      expect(wrapper.get('[aria-label="모집 구분"]').text()).toBe(label);
      if (years) expect(wrapper.get('.announcement-audience').text()).toContain(years);
      if (announcementType === 'EDU') expect(wrapper.text()).not.toMatch(/경력|신입/);
      wrapper.unmount();
    }
  });
}
