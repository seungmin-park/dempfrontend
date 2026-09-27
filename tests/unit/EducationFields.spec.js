import { mount, flushPromises } from '@vue/test-utils';
import AdminAnnouncementEditor from '@/views/admin/AdminAnnouncementEditor.vue';
import axios from 'axios';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());
it('관리자는 교육 조건을 선택해 저장하고 API 재조회 값으로 편집한다', async () => {
  const record = { title: '온라인 교육', company: { name: 'DEMP' }, announcementType: 'EDU', position: 'BACKEND', language: ['JAVA'], payment: null, content: '<p>과정 안내</p>', accessUrl: 'https://example.com/camp', minCareer: 0, maxCareer: 0, startedDate: '2026-09-01T00:00', deadLineDate: '2026-10-01T00:00', education: { deliveryMode: 'ONLINE', commitment: 'PART_TIME', fundingType: 'CARD_REQUIRED', region: 'SEOUL', selectionProcess: 'NO_CODING', learningLevel: 'BEGINNER', learningStartDate: '2026-10-01', learningEndDate: '2026-12-31' } };
  axios.get.mockResolvedValue({ data: record }); axios.patch.mockResolvedValue({ data: {} });
  const wrapper = mount(AdminAnnouncementEditor, { global: { stubs: { RouterLink: true }, mocks: { $route: { params: { id: '1' } }, $router: { push: vi.fn() } } } });
  await flushPromises();
  expect(wrapper.get('[aria-label="수업 방식"]').element.value).toBe('ONLINE');
  await wrapper.get('[aria-label="수업 방식"]').setValue('HYBRID');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.lastCall[1].get('deliveryMode')).toBe('HYBRID');
  expect(axios.patch.mock.lastCall[1].get('learningStartDate')).toBe('2026-10-01');
  expect(axios.patch.mock.lastCall[1].has('payment')).toBe(false);
  wrapper.unmount();
});
it('공고 종류를 바꾸면 연봉을 교육비로 재사용하지 않는다', async () => {
  const wrapper = mount(AdminAnnouncementEditor, { global: { stubs: { RouterLink: true }, mocks: { $route: { params: {} }, $router: { push: vi.fn() } } } });
  await flushPromises(); await wrapper.setData({ form: { payment: 5000, salaryStatus: 'DISCLOSED', salaryMax: 7000 } });
  await wrapper.get('#admin-type').setValue('EDU');
  expect(wrapper.get('#admin-payment').element.value).toBe('');
  expect(wrapper.vm.form.salaryMax).toBeNull();
  wrapper.unmount();
});
it('새 공고는 초안이며 게시 상태와 출처 확인 정보를 입력한다', async () => {
  const wrapper = mount(AdminAnnouncementEditor, { global: { stubs: { RouterLink: true }, mocks: { $route: { params: {} }, $router: { push: vi.fn() } } } });
  await flushPromises();
  expect(wrapper.get('[aria-label="게시 상태"]').element.value).toBe('DRAFT');
  expect(wrapper.find('[aria-label="출처 이름"]').exists()).toBe(true);
  expect(wrapper.find('[aria-label="지원 URL (선택)"]').exists()).toBe(true);
  wrapper.unmount();
});
