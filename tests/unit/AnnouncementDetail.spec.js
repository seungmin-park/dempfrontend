import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail.vue';

vi.mock('axios');

afterEach(() => {
  vi.clearAllMocks();
  delete global.$;
});

test('공고 상세의 기간·금액·회사·본문을 평면 응답 계약으로 표시한다', async () => {
  axios.get.mockResolvedValue({ data: {
    title: '백엔드 채용',
    company: { name: 'DEMP' },
    announcementType: 'EMP',
    position: 'BACKEND',
    minCareer: 0,
    maxCareer: 3,
    startedDate: '2026-09-01T00:00:00',
    deadLineDate: '2026-09-30T23:59:00',
    content: '<strong>설명</strong>',
    accessUrl: 'https://example.com/jobs/1',
    payment: 3000,
    language: ['JAVA', 'SPRING'],
    image: 'https://example.com/company.png',
  } });
  const wrapper = mount(AnnouncementDetail, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } },
    $route: { params: { itemId: 71 } },
    $router: { replace: vi.fn(), currentRoute: { value: { fullPath: '/detail/71' } } },
  } } });

  await flushPromises();

  expect(wrapper.text()).toContain('회사명 : DEMP');
  expect(wrapper.text()).toContain('연봉 : 3000 만원');
  expect(wrapper.text()).toContain('지원기간 : 2026.09.01 00:00 ~ 2026.09.30 23:59');
  expect(wrapper.get('[aria-label="기술 스택"]').text()).toBe('Java, Spring');
  expect(wrapper.text()).toContain('경력 : 0년 ~ 3년');
  expect(wrapper.get('.detail-announce-content').text()).toContain('설명');
});
