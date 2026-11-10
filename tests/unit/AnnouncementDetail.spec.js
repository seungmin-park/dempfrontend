import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail.vue';

vi.mock('axios');
vi.mock('@/api/bookmarks', () => ({ getBookmarkStatus: vi.fn().mockResolvedValue({ data: { savedIds: [] } }), setAnnouncementSaved: vi.fn() }));

afterEach(() => {
  vi.clearAllMocks();
  delete global.$;
});
const facts = wrapper => Object.fromEntries(wrapper.findAll('.detail-facts > div').map(row => [row.get('dt').text(), row.get('dd').text()]));

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

  expect(wrapper.get('.job-detail-heading').text()).toContain('DEMP');
  expect(facts(wrapper)).toEqual({ 직무: '백엔드', 급여: '연봉 3,000만원', '지원 시작': '2026.09.01 00:00', 마감: '2026.09.30 23:59 마감', '기술 스택': 'Java, Spring' });
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


test('열어 둔 상세는 한국 시각의 시작·마감을 지나면 예정·모집 중·마감과 지원 안내를 갱신한다', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2030-11-01T00:00:00Z'));
  axios.get.mockResolvedValue({ data: { title: '시간 경계', company: { name: 'DEMP' }, language: [],
    startedDate: '2030-11-01T09:00:02', deadLineDate: '2030-11-01T09:00:04',
    accessUrl: 'https://example.com/original', applicationUrl: 'https://example.com/apply' } });
  const wrapper = mount(AnnouncementDetail, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } }, $route: { params: { itemId: 71 } },
    $router: { replace: vi.fn(), currentRoute: { value: { fullPath: '/detail/71' } } },
  } } });
  try {
    await flushPromises();
    expect(wrapper.get('[aria-label="현재 모집 상태"]').text()).toBe('모집 예정');
    expect(wrapper.get('.apply-bar a').text()).toBe('원문 확인');
    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.get('[aria-label="현재 모집 상태"]').text()).toBe('모집 중');
    expect(wrapper.get('.apply-bar a').text()).toBe('지원하기');
    await vi.advanceTimersByTimeAsync(2000);
    expect(wrapper.get('[aria-label="현재 모집 상태"]').text()).toBe('모집 중');
    await vi.advanceTimersByTimeAsync(1000);
    expect(wrapper.get('[aria-label="현재 모집 상태"]').text()).toBe('모집 마감');
    expect(wrapper.get('.apply-bar a').attributes('href')).toBe('https://example.com/original');
    expect(wrapper.get('.apply-bar a').text()).toBe('원문 확인');
    expect(axios.get.mock.calls.filter(([url]) => url.startsWith('/api/announce/detail/'))).toHaveLength(1);
  } finally { wrapper.unmount(); vi.useRealTimers(); }
});


test('월급은 연봉으로 환산하지 않고 직무별 필수·우대와 근무 조건을 표시한다', async () => {
  axios.get.mockResolvedValue({ data: { title: '인턴 공고', company: { name: 'DEMP' }, announcementType: 'EMP', language: [],
    salaryPeriod: 'MONTH', salaryStatus: 'DISCLOSED', payment: 230, workPeriod: '약 5개월', conversionNote: '전환 불가',
    roles: [{ title: 'AI-OCR', requiredSkills: 'Python 또는 PyTorch', preferredSkills: '문서 인식 경험' }],
    referenceUrls: ['https://example.com/job.pdf'] } });
  const wrapper = mount(AnnouncementDetail, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } }, $route: { params: { itemId: 71 } },
    $router: { replace: vi.fn(), currentRoute: { value: { fullPath: '/detail/71' } } },
  } } });
  await flushPromises();
  expect(wrapper.text()).toContain('월급 230만원');
  expect(wrapper.text()).not.toContain('연봉 230');
  expect(wrapper.text()).toContain('약 5개월');
  expect(wrapper.text()).toContain('전환 불가');
  expect(wrapper.get('[aria-label="직무별 모집 조건"]').text()).toContain('필수 요건');
  expect(wrapper.get('[aria-label="직무별 모집 조건"]').text()).toContain('문서 인식 경험');
  expect(wrapper.find('a[href="https://example.com/job.pdf"]').exists()).toBe(true);
  wrapper.unmount();
});

const RouterLinkStub = { name: 'RouterLink', props: ['to'], template: '<a class="router-link-stub"><slot /></a>' };
const open = { title: '백엔드 채용', company: { name: 'DEMP' }, announcementType: 'EMP', position: 'BACKEND', language: ['KOTLIN', 'SPRING', 'JAVA'],
  deadlineMode: 'FIXED', startedDate: '2026-11-01T09:00:00', deadLineDate: '2026-11-11T18:00:00', sourceVerifiedAt: '2026-11-08T14:20:00',
  content: '<p>본문</p>', accessUrl: 'https://example.com/jobs/1' };
function mountDetail(data, hashtags = ['kotlin', 'Spring', 'React']) {
  freezeAtNovemberEleventh();
  axios.get.mockImplementation(url => url === '/api/question/hashtags' ? Promise.resolve({ data: hashtags }) : Promise.resolve({ data }));
  return mount(AnnouncementDetail, { global: { stubs: { RouterLink: RouterLinkStub }, mocks: {
    $store: { state: { Login: { token: 'token' } } }, $route: { params: { itemId: '71' }, query: {} },
    $router: { replace: vi.fn(), push: vi.fn(), currentRoute: { value: { fullPath: '/detail/71' } } },
  } } });
}
function freezeAtNovemberEleventh() { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-11T00:00:00Z')); }
afterEach(() => { vi.useRealTimers(); delete navigator.clipboard; });

test('핵심 조건에 마감까지 남은 시간과 운영자 확인일을 보여준다', async () => {
  const wrapper = mountDetail(open); await flushPromises();
  expect(facts(wrapper)).toMatchObject({ 마감: '오늘 18:00 마감', '운영자 확인': '2026.11.08' });
  expect(wrapper.get('.detail-facts .is-urgent').text()).toBe('오늘 18:00 마감');
});

test('링크 복사는 검색 조건 없는 상세 주소를 복사하고 결과를 알려준다', async () => {
  const writeText = vi.fn().mockResolvedValueOnce().mockRejectedValueOnce(new Error('denied'));
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  const wrapper = mountDetail(open); await flushPromises();
  await wrapper.get('[data-test="copy-link"]').trigger('click'); await flushPromises();
  expect(writeText).toHaveBeenCalledWith(`${location.origin}/detail/71`);
  expect(wrapper.get('[data-test="copy-status"]').text()).toBe('링크를 복사했습니다.');
  await wrapper.get('[data-test="copy-link"]').trigger('click'); await flushPromises();
  expect(wrapper.get('[data-test="copy-status"]').text()).toBe('복사하지 못했습니다. 주소창의 링크를 이용해 주세요.');
});

test('정확한 마감 시각이 있는 모집 중 공고만 마감 일정 파일을 내려받을 수 있다', async () => {
  const wrapper = mountDetail(open); await flushPromises();
  const link = wrapper.get('[data-test="deadline-calendar"]');
  expect(link.attributes('download')).toBe('demp-deadline-71.ics');
  expect(decodeURIComponent(link.attributes('href'))).toContain('DTEND:20261111T090000Z');
  const flexible = mountDetail({ ...open, deadlineMode: 'UNTIL_FILLED', deadLineDate: null }); await flushPromises();
  expect(flexible.find('[data-test="deadline-calendar"]').exists()).toBe(false);
});

test('공고 기술과 같은 이름의 질문 태그가 있으면 면접 질문 목록으로 바로 이동할 수 있다', async () => {
  const wrapper = mountDetail(open); await flushPromises();
  const links = wrapper.findAllComponents(RouterLinkStub).filter(link => link.props('to')?.path === '/question');
  expect(links.map(link => [link.text(), link.props('to').query])).toEqual([['kotlin', { hashtags: 'kotlin' }], ['Spring', { hashtags: 'Spring' }]]);
  const none = mountDetail(open, ['React']); await flushPromises();
  expect(none.find('[aria-label="관련 면접 질문"]').exists()).toBe(false);
});

afterEach(() => localStorage.clear());
const mountFor = () => mount(AnnouncementDetail, { global: { stubs: { RouterLink: true }, mocks: {
  $store: { state: { Login: { token: 'token', username: 'member' } } }, $route: { params: { itemId: '71' }, query: {} },
  $router: { replace: vi.fn(), push: vi.fn(), currentRoute: { value: { fullPath: '/detail/71' } } },
} } });
test('상세를 성공적으로 불러온 공고만 로그인 계정의 최근 본 공고에 남긴다', async () => {
  axios.get.mockImplementation(url => url === '/api/announce/detail/71' ? Promise.resolve({ data: { title: '백엔드 채용', company: { name: 'DEMP' }, announcementType: 'EMP', language: [] } }) : Promise.resolve({ data: [] }));
  mountFor(); await flushPromises();
  const stored = localStorage.getItem('demp:recent-announcements:member');
  expect(stored).not.toBeNull();
  expect(JSON.parse(stored).map(item => [item.id, item.title, item.company])).toEqual([[71, '백엔드 채용', 'DEMP']]);
});
test('상세 조회에 실패하면 최근 본 공고에 남기지 않는다', async () => {
  axios.get.mockRejectedValue({ response: { status: 404 } });
  mountFor(); await flushPromises();
  expect(localStorage.getItem('demp:recent-announcements:member')).toBeNull();
});
