import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import { compareIdsFromQuery, toggleCompareId, comparisonRows } from '@/presentation/announcementComparison';
import AnnouncementCompare from '@/views/announcement/AnnouncementCompare.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());

const now = Date.parse('2026-11-11T00:00:00Z');
const emp = { type: 'EMP', title: '백엔드 채용', company: 'DEMP', position: 'BACKEND', minCareer: 0, maxCareer: 3, recruitmentAudience: null, employmentType: 'REGULAR',
  payment: 4000, salaryMax: 6000, salaryStatus: 'DISCLOSED', language: ['JAVA'], deadlineMode: 'FIXED', startedDate: '2026-11-01T09:00:00', deadLineDate: '2026-11-11T18:00:00' };
const edu = { type: 'EDU', title: '파이썬 과정', company: '교육원', position: null, language: ['PYTHON'], payment: 0, deadlineMode: 'ALWAYS_OPEN', startedDate: '2026-11-01T09:00:00', deadLineDate: null,
  education: { deliveryMode: 'ONLINE', region: 'SEOUL', learningStartDate: '2026-12-01', learningEndDate: '2027-03-01' } };

test('비교 ID는 URL에서 중복과 잘못된 값을 빼고 최대 4개까지 순서대로 읽는다', () => {
  expect(compareIdsFromQuery('71,72,72,abc,-1,0,73,74,75')).toEqual([71, 72, 73, 74]);
  expect(compareIdsFromQuery(['71', '72,73'])).toEqual([71, 72, 73]);
  expect(compareIdsFromQuery('99999999999')).toEqual([]);
  expect(compareIdsFromQuery(undefined)).toEqual([]);
});

test('비교 선택은 고른 공고를 빼고 새 공고는 4개 미만일 때만 더한다', () => {
  expect(toggleCompareId([71], 72)).toEqual([71, 72]);
  expect(toggleCompareId([71, 72], 71)).toEqual([72]);
  expect(toggleCompareId([1, 2, 3, 4], 5)).toEqual([1, 2, 3, 4]);
});

test('채용과 교육을 함께 비교하면 공통 항목은 나란히, 한쪽에만 있는 항목은 해당 없음으로 보여준다', () => {
  const rows = Object.fromEntries(comparisonRows([emp, null, edu], now).map(row => [row.label, row.values]));
  expect(rows).toEqual({
    회사: ['DEMP', '—', '교육원'],
    종류: ['채용', '—', '부트캠프·교육'],
    직무: ['백엔드', '—', '분야 미정'],
    '경력 조건': ['신입·경력 3년 이하', '—', '해당 없음'],
    '고용 형태': ['정규직', '—', '해당 없음'],
    급여: ['연봉 4,000~6,000만원', '—', '해당 없음'],
    교육비: ['해당 없음', '—', '무료 교육'],
    '기술 스택': ['Java', '—', 'Python'],
    '모집 상태': ['모집 중', '—', '모집 중'],
    마감: ['오늘 18:00 마감', '—', '상시 모집'],
    '수업 방식': ['해당 없음', '—', '온라인'],
    '교육 지역': ['해당 없음', '—', '서울'],
    '교육 일정': ['해당 없음', '—', '2026-12-01 ~ 2027-03-01'],
  });
});

test('채용 공고끼리 비교하면 교육 전용 항목을 만들지 않는다', () => {
  expect(comparisonRows([emp, { ...emp, company: '다른 회사' }], now).map(row => row.label)).toEqual(['회사', '종류', '직무', '경력 조건', '고용 형태', '급여', '기술 스택', '모집 상태', '마감']);
});

const RouterLinkStub = { name: 'RouterLink', props: ['to'], template: '<a class="router-link-stub"><slot /></a>' };
function mountCompare(ids, replace = vi.fn()) {
  return { replace, wrapper: mount(AnnouncementCompare, { props: { ids }, global: { stubs: { RouterLink: RouterLinkStub }, mocks: { $router: { replace } } } }) };
}
test('고른 공고를 조회수 없이 불러와 나란히 보여주고, 이용 불가·일시 실패를 열마다 구분해 다시 시도하거나 뺄 수 있다', async () => {
  let failOnce = true;
  axios.get.mockImplementation(url => {
    if (url.endsWith('/71')) return Promise.resolve({ data: { ...emp, company: { name: 'DEMP' }, announcementType: 'EMP' } });
    if (url.endsWith('/72')) return Promise.reject({ response: { status: 404 } });
    if (failOnce) { failOnce = false; return Promise.reject(new Error('network')); }
    return Promise.resolve({ data: { ...edu, company: { name: '교육원' }, announcementType: 'EDU' } });
  });
  const { wrapper, replace } = mountCompare([71, 72, 73]); await flushPromises();
  expect(axios.get.mock.calls.map(([url, options]) => [url, options.params])).toEqual([71, 72, 73].map(id => [`/api/announce/detail/${id}`, { recordView: false }]));
  const headers = wrapper.findAll('thead th[scope="col"]').slice(1);
  expect(headers[0].text()).toContain('백엔드 채용');
  expect(headers[1].text()).toContain('이용할 수 없는 공고');
  expect(headers[2].text()).toContain('불러오지 못했습니다');
  await headers[2].get('button[data-test="retry-compare"]').trigger('click'); await flushPromises();
  expect(wrapper.findAll('thead th[scope="col"]')[3].text()).toContain('파이썬 과정');
  expect(wrapper.findAll('tbody tr').find(row => row.get('th').text() === '종류').findAll('td').map(cell => cell.text())).toEqual(['채용', '—', '부트캠프·교육']);
  await wrapper.findAll('thead th[scope="col"]')[2].get('button[data-test="remove-compare"]').trigger('click');
  expect(replace).toHaveBeenCalledWith({ path: '/compare', query: { ids: '71,73' } });
});
test('두 개 미만이면 요청 없이 관심 공고에서 고르도록 안내한다', async () => {
  const { wrapper } = mountCompare([71]); await flushPromises();
  expect(axios.get).not.toHaveBeenCalled();
  expect(wrapper.get('[role="status"]').text()).toContain('2개 이상');
  expect(wrapper.findAllComponents(RouterLinkStub).map(link => link.props('to'))).toContainEqual({ path: '/mypage', query: { tab: 'saved', compare: '71' } });
});
