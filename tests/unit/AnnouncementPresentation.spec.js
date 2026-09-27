import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());

it('공고 이미지를 불러오지 못하면 깨진 이미지 대신 기본 표시를 보여준다', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 1, title: '채용', language: ['JAVA'], image: '/missing.png' }], last: true } });
  const wrapper = mount(AnnouncementList, { global: { mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } });
  await flushPromises();
  await wrapper.get('.item-image-box img').trigger('error');
  expect(wrapper.find('.item-image-box img').exists()).toBe(false);
  expect(wrapper.get('.item-image-box').text()).toBe('DEMP');
});

it('공고 목록의 기술 배열은 JSON 기호 없이 쉼표로 구분한 기술명으로 표시한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 1, title: '채용', language: ['JAVA', 'SPRING'], position: 'BACKEND', image: '' }], last: true } });
  const wrapper = mount(AnnouncementList, { global: { mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } });
  await flushPromises();
  expect(wrapper.text()).toContain('Java');
  expect(wrapper.text()).toContain('Spring');
  expect(wrapper.text()).not.toMatch(/[[\]"]/);
  expect(wrapper.get('[aria-label="기술 스택"]').text()).toBe('Java, Spring');
});

it('등록된 기술이 없는 공고는 빈 배열 대신 안내 문구를 표시한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 1, title: '채용', language: [] }], last: true } });
  const wrapper = mount(AnnouncementList, { global: { mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } });
  await flushPromises();
  expect(wrapper.get('[aria-label="기술 스택"]').text()).toBe('기술 정보 없음');
});

it('공고 상세의 모집 기간을 ISO 구분자나 초 없이 보여준다', async () => {
  axios.get.mockResolvedValue({ data: { title: '채용', company: null, language: ['JAVA'], startedDate: '2026-09-01T09:00:00', deadLineDate: '2026-09-30T18:30:00', minCareer: 0, maxCareer: 3, payment: 3000, announcementType: 'EMP' } });
  const wrapper = mount(AnnouncementDetail, { global: { mocks: {
    $store: { state: { Login: { token: 'jwt' } } }, $route: { params: { itemId: '1' } },
  } } });
  await flushPromises();
  expect(wrapper.text()).toContain('2026.09.01 09:00');
  expect(wrapper.text()).toContain('2026.09.30 18:30');
  expect(wrapper.text()).not.toContain('T09:00:00');
  expect(wrapper.text()).not.toContain('T18:30:00');
});
it.each([
  [{ announcementType: 'EMP', payment: null, salaryStatus: 'UNDISCLOSED' }, '연봉 미공개'],
  [{ announcementType: 'EMP', payment: null, salaryStatus: 'NEGOTIABLE' }, '연봉 협의'],
  [{ announcementType: 'EMP', payment: 4000, salaryMax: 6000, salaryStatus: 'DISCLOSED' }, '연봉 4,000~6,000만원'],
  [{ announcementType: 'EDU', payment: null }, '교육비 정보 없음'],
])('상세에서 금액 상태를 정확히 표시한다 %j', async (data, label) => {
  axios.get.mockResolvedValue({ data: { ...data, language: [] } });
  const wrapper = mount(AnnouncementDetail, { global: { mocks: { $store: { state: { Login: { token: 'jwt' } } }, $route: { params: { itemId: '1' } } } } });
  await flushPromises();
  expect(wrapper.text()).toContain(label);
});
