import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import axios from 'axios';
import AnnouncementHeader from '@/components/announcement/AnnouncementHeader.vue';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
vi.mock('axios');
it('정렬을 URL에서 복원하고 변경해도 기존 필터를 보존하며 뒤로 가기에 첫 페이지를 다시 요청한다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&positions=SRE&languages=KOTLIN&q=운영&orderBy=DEADLINE');
  const select = wrapper.get('[aria-label="공고 정렬"]');
  expect(select.findAll('option').map(option => option.text())).toEqual(['최신 등록순', '마감 임박순', '조회 많은 순']);
  expect(select.element.value).toBe('DEADLINE');
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ orderBy: 'DEADLINE', positions: 'SRE', languages: 'KOTLIN', title: '운영', page: 0 });
  await select.setValue('VIEWS'); await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EMP', positions: 'SRE', languages: 'KOTLIN', q: '운영', orderBy: 'VIEWS' });
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ orderBy: 'VIEWS', page: 0 });
  await wrapper.get('button[aria-label="기술 스택"]').trigger('click');
  await wrapper.get('input[value=JAVA]').setValue(true); await flushPromises();
  expect(router.currentRoute.value.query.orderBy).toBe('VIEWS');
  router.back(); await vi.waitFor(() => expect(router.currentRoute.value.query.languages).toBe('KOTLIN'));
  router.back(); await vi.waitFor(() => expect(router.currentRoute.value.query.orderBy).toBe('DEADLINE'));
  await flushPromises();
  expect(wrapper.get('[aria-label="공고 정렬"]').element.value).toBe('DEADLINE');
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ orderBy: 'DEADLINE', page: 0 });
  wrapper.unmount();
});
it('잘못된 정렬 URL과 기본 최신순은 호환되는 기본 검색 요청으로 복원한다', async () => {
  const { wrapper } = await setup('/?orderBy=INVALID');
  expect(wrapper.get('[aria-label="공고 정렬"]').element.value).toBe('LATEST');
  expect(axios.get.mock.lastCall[1].params.orderBy).toBeUndefined();
  wrapper.unmount();
});
it('확장된 직무와 기술 값은 기존 값과 함께 URL·첫 검색 요청·표시에 보존된다', async () => {
  const { wrapper } = await setup('/?positions=SRE,BACKEND&languages=JAVA,KOTLIN,SPRING_BOOT,KUBERNETES,FASTAPI,RAG');
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ positions: 'BACKEND,SRE', languages: expect.stringContaining('KOTLIN') });
  for (const value of ['JAVA','KOTLIN','SPRING_BOOT','KUBERNETES','FASTAPI','RAG']) expect(axios.get.mock.lastCall[1].params.languages.split(',')).toContain(value);
  for (const label of ['SRE','Kotlin','Spring Boot','Kubernetes','FastAPI','RAG']) expect(wrapper.get('.active-filters').text()).toContain(label);
  wrapper.unmount();
});
it('기술 항목을 분류별로 찾고 검색해도 기존 선택과 새 선택이 함께 요청된다', async () => {
  const { wrapper, router } = await setup('/?languages=JAVA');
  await wrapper.get('button[aria-label="기술 스택"]').trigger('click');
  const groups = wrapper.findAll('#languages-filter-panel fieldset');
  expect(groups.map(group => group.get('legend').text())).toEqual(['언어', '웹 UI', '서버 프레임워크', '모바일·게임', '데이터 저장·메시징', '클라우드·운영', '데이터·AI', '개발 도구']);
  await wrapper.get('[aria-label="기술 스택 검색"]').setValue('Kotlin');
  await wrapper.get('input[value=KOTLIN]').setValue(true); await flushPromises();
  expect(router.currentRoute.value.query.languages.split(',')).toEqual(expect.arrayContaining(['JAVA','KOTLIN']));
  expect(wrapper.find('input[value=JAVA]').exists()).toBe(false);
  await wrapper.get('[aria-label="기술 스택 검색"]').setValue('');
  expect(wrapper.get('input[value=JAVA]').element.checked).toBe(true);
  wrapper.unmount();
});
const hosts = [];
afterEach(() => { vi.clearAllMocks(); for (const host of hosts.splice(0)) host.remove(); });
async function setup(url) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
  await router.push(url);
  await router.isReady();
  axios.get.mockResolvedValue({ data: { content: [], last: true } });
  const host = document.createElement('div'); document.body.append(host); hosts.push(host);
  const wrapper = mount({ components: { AnnouncementHeader, AnnouncementList }, template: '<AnnouncementHeader /><AnnouncementList />' }, { attachTo: host, global: { plugins: [router], mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } });
  await flushPromises();
  return { wrapper, router };
}
it('URL에서 교육·분야·기술·모집상태·비용·검색을 복원해 첫 서버 요청에 전달한다', async () => {
  const { wrapper } = await setup('/?type=EDU&positions=BACKEND&languages=JAVA,SPRING&status=OPEN&tuition=FREE&q=스쿨');
  expect(axios.get.mock.calls[0][1].params).toMatchObject({ announcementType: 'EDU', positions: 'BACKEND', languages: 'JAVA,SPRING', recruitmentStatus: 'OPEN', tuition: 'FREE', title: '스쿨', page: 0 });
  expect(wrapper.get('#edu').element.checked).toBe(true);
  expect(wrapper.get('[aria-label="공고 검색어"]').element.value).toBe('스쿨');
  expect(wrapper.text()).toContain('무료');
});
it('필터 선택은 URL에 저장되고 개별 해제·뒤로 가기는 목록을 첫 페이지부터 복원한다', async () => {
  const { wrapper, router } = await setup('/?type=EMP');
  await wrapper.get('button[aria-label="기술 스택"]').trigger('click');
  await wrapper.get('input[value="JAVA"]').setValue(true);
  await flushPromises();
  expect(router.currentRoute.value.query.languages).toBe('JAVA');
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ languages: 'JAVA', page: 0 });
  await wrapper.get('[aria-label="Java 조건 해제"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.query.languages).toBeUndefined();
  router.back();
  await vi.waitFor(() => expect(router.currentRoute.value.query.languages).toBe('JAVA'));
  await flushPromises();
  await wrapper.get('button[aria-label="기술 스택"]').trigger('click');
  expect(wrapper.get('input[value="JAVA"]').element.checked).toBe(true);
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ languages: 'JAVA', page: 0 });
});
it('교육 전환은 경력·연봉을 해제하고 지원하지 않는 URL 조건을 요청하지 않는다', async () => {
  const { wrapper } = await setup('/?type=EMP&career=3&payment=5000&languages=JAVA,NOPE&positions=BACKEND,INVALID');
  await wrapper.get('#edu').setValue(true);
  await flushPromises();
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ announcementType: 'EDU', career: 0, languages: 'JAVA', positions: 'BACKEND' });
  expect(wrapper.find('[aria-label="내 경력"]').exists()).toBe(false);
  expect(wrapper.find('[aria-label="교육비"]').exists()).toBe(true);
});
it('모바일 필터 열기와 전체 초기화는 선택 상태 및 결과를 함께 갱신한다', async () => {
  const { wrapper, router } = await setup('/?type=EDU&tuition=FREE&q=개발');
  await wrapper.get('[aria-label="필터 열기"]').trigger('click');
  expect(wrapper.get('[aria-label="필터 열기"]').attributes('aria-expanded')).toBe('true');
  await wrapper.get('[aria-label="전체 조건 초기화"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EDU' });
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ announcementType: 'EDU', title: '', page: 0 });
});
it('연봉 필터를 숨기고 과거 연봉 URL도 검색에 적용하지 않는다', async () => {
  const { wrapper } = await setup('/?type=EMP&payment=5000');
  expect(wrapper.find('[aria-label="최소 연봉"]').exists()).toBe(false);
  expect(axios.get.mock.lastCall[1].params.payment).toBeUndefined();
  expect(wrapper.text()).not.toContain('연봉 5,000만원 이상');
});
it('제출 전 검색어는 다른 필터 선택의 조회 조건과 적용 요약에 섞이지 않는다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&q=기존 검색');
  await wrapper.get('[aria-label="공고 검색어"]').setValue('아직 제출하지 않은 검색');
  expect(wrapper.get('.active-filters').text()).toContain('기존 검색');
  expect(wrapper.get('.active-filters').text()).not.toContain('아직 제출하지 않은 검색');
  await wrapper.get('button[aria-label="기술 스택"]').trigger('click');
  await wrapper.get('input[value="JAVA"]').setValue(true);
  await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EMP', languages: 'JAVA', q: '기존 검색' });
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ title: '기존 검색', languages: 'JAVA', page: 0 });
  expect(wrapper.get('[aria-label="공고 검색어"]').element.value).toBe('아직 제출하지 않은 검색');
  await wrapper.get('.discovery-search').trigger('submit');
  await flushPromises();
  expect(router.currentRoute.value.query.q).toBe('아직 제출하지 않은 검색');
  expect(wrapper.get('.active-filters').text()).toContain('아직 제출하지 않은 검색');
});
it('전체 초기화는 제출하지 않은 검색어도 지우고 현재 공고 종류만 유지한다', async () => {
  const { wrapper, router } = await setup('/?type=EDU&tuition=FREE');
  await wrapper.get('[aria-label="공고 검색어"]').setValue('입력 중');
  await wrapper.get('[aria-label="전체 조건 초기화"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('[aria-label="공고 검색어"]').element.value).toBe('');
  expect(router.currentRoute.value.query).toEqual({ type: 'EDU' });
});
it('교육 상세 조건은 URL에서 복원되어 실제 검색 API에 전달되고 채용 전환 시 제거된다', async () => {
  const { wrapper, router } = await setup('/?type=EDU&deliveryMode=ONLINE&region=SEOUL&commitment=PART_TIME&fundingType=CARD_REQUIRED&selectionProcess=NO_CODING&learningLevel=BEGINNER&duration=LONG&startAfter=2026-10-01');
  expect(axios.get.mock.lastCall[1].params).toMatchObject({ deliveryMode: 'ONLINE', region: 'SEOUL', commitment: 'PART_TIME', fundingType: 'CARD_REQUIRED', selectionProcess: 'NO_CODING', learningLevel: 'BEGINNER', duration: 'LONG', startAfter: '2026-10-01' });
  expect(wrapper.get('[aria-label="수업 방식"]').element.value).toBe('ONLINE');
  await wrapper.get('[aria-label="온라인 조건 해제"]').trigger('click');
  await flushPromises();
  expect(router.currentRoute.value.query.deliveryMode).toBeUndefined();
  await wrapper.get('#emp').setValue(true); await flushPromises();
  expect(router.currentRoute.value.query.commitment).toBeUndefined();
  expect(axios.get.mock.lastCall[1].params.fundingType).toBeUndefined();
});
