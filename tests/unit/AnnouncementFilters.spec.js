import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import axios from 'axios';
import AnnouncementHeader from '@/components/announcement/AnnouncementHeader.vue';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());
async function setup(url) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
  await router.push(url);
  await router.isReady();
  axios.get.mockResolvedValue({ data: { content: [], last: true } });
  const wrapper = mount({ components: { AnnouncementHeader, AnnouncementList }, template: '<AnnouncementHeader /><AnnouncementList />' }, { global: { plugins: [router], mocks: { emitter: { on: vi.fn(), off: vi.fn() } } } });
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
