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

it.each([
  ['REGULAR', '정규직'], ['CONTRACT', '계약직'], ['CONVERSION_INTERNSHIP', '전환형 인턴'],
  ['EXPERIENTIAL_INTERNSHIP', '체험형 인턴'], [null, '고용 형태 미확인'],
])('고용 형태 %s를 모집 대상과 별개로 목록·상세·관련 공고에 표시한다', async (employmentType, label) => {
  const item = { id: 1, title: '대상 공고', company: null, language: [], image: '', announcementType: 'EMP', recruitmentAudience: 'NEW', minCareer: 0, maxCareer: 0, employmentType };
  axios.get.mockResolvedValueOnce({ data: { content: [item], last: true } });
  const list = mount(AnnouncementList, { global: { mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } }); await flushPromises();
  axios.get.mockResolvedValueOnce({ data: item });
  const detail = mount(AnnouncementDetail, { global: { mocks: { $store: { state: { Login: { token: 'jwt' } } }, $route: { params: { itemId: '1' } } } } }); await flushPromises();
  axios.get.mockResolvedValueOnce({ data: [item] });
  const scroll = mount(AnnouncementScroll); await flushPromises();
  for (const wrapper of [list, detail, scroll]) {
    expect(wrapper.get('[aria-label="고용 형태"]').text()).toBe(label);
    expect(wrapper.get('[aria-label="모집 구분"]').text()).toBe('신입');
    wrapper.unmount();
  }
});
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
it.each([['EXPERIENCED', 3, 5, '3~5년'], ['EXPERIENCED', 3, 0, '3년 이상'], ['MIXED', 0, 5, '5년 이하']])('명시적 %s 모집 대상도 저장된 연차 범위를 표시한다', async (recruitmentAudience, minCareer, maxCareer, years) => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 1, title: '명시적 대상', announcementType: 'EMP', recruitmentAudience, minCareer, maxCareer, language: [] }], last: true } });
  const wrapper = mount(AnnouncementList, { global: { mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } });
  await flushPromises(); expect(wrapper.get('.announcement-audience').text()).toContain(years); wrapper.unmount();
});
