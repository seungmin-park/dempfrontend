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
    hits: 12,
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
  expect(wrapper.text()).toContain('연봉 3,000만원');
  expect(wrapper.text()).toContain('지원기간 : 2026.09.01 00:00 ~ 2026.09.30 23:59');
  expect(wrapper.get('[aria-label="기술 스택"]').text()).toBe('Java, Spring');
  expect(wrapper.get('[aria-label="공고 조회수"]').text()).toBe('조회 12');
  expect(wrapper.get('[aria-label="모집 구분"]').text()).toBe('신입·경력');
  expect(wrapper.get('.announcement-audience').text()).toContain('3년 이하');
  expect(wrapper.get('.detail-announce-content').text()).toContain('설명');
  const apply = wrapper.get('.apply-bar a');
  expect(apply.attributes('href')).toBe('https://example.com/jobs/1');
  expect(apply.attributes('target')).toBe('_blank');
  expect(apply.attributes('rel')).toContain('noopener');
  expect(wrapper.get('.apply-bar').text()).toContain('원문');
});
test('수동 마감 공고는 지원 대신 원문 확인을 안내하고 오류를 제보할 수 있다', async () => {
  axios.get.mockResolvedValue({ data: { title: '마감 공고', company: { name: 'DEMP' }, announcementType: 'EMP', recruitmentClosed: true, accessUrl: 'https://example.com/original', content: '본문', language: [] } });
  axios.post.mockResolvedValue({ data: {} });
  const wrapper = mount(AnnouncementDetail, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } }, $route: { params: { itemId: 71 } },
    $router: { replace: vi.fn(), currentRoute: { value: { fullPath: '/detail/71' } } },
  } } });
  await flushPromises();
  expect(wrapper.get('.apply-bar').text()).toContain('모집이 종료');
  expect(wrapper.get('.apply-bar a').text()).toBe('원문 확인');
  await wrapper.get('[aria-label="공고 오류 내용"]').setValue('원문 링크가 변경되었습니다');
  await wrapper.get('[data-test="report-form"]').trigger('submit'); await flushPromises();
  expect(axios.post).toHaveBeenCalledWith('/api/announce/71/reports', { message: '원문 링크가 변경되었습니다' });
  expect(wrapper.text()).toContain('제보가 접수되었습니다');
  wrapper.unmount();
});
