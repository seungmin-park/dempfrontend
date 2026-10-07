import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import AdminAnnouncements from '@/views/admin/AdminAnnouncements.vue';
import AdminPostEditor from '@/views/admin/AdminPostEditor.vue';
import AdminAnnouncementEditor from '@/views/admin/AdminAnnouncementEditor.vue';
import { toAnnouncementFormData } from '@/api/announcements';
vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); axios.post.mockReset(); axios.patch.mockReset(); axios.delete.mockReset(); });
const options = (params = {}) => ({ global: { stubs: { RouterLink: { props: ['to'], template: '<a><slot /></a>' } }, mocks: { $route: { params, query: {} }, $router: { push: vi.fn() }, $store: { state: { Login: { token: 'admin' } } } } } });
it('현황은 서버 집계를 표시하고 실패 뒤 재시도한다', async () => {
  axios.get.mockRejectedValueOnce(new Error()).mockResolvedValueOnce({ data: { announcements: 3, bootcamps: 2, questions: 7, answers: 9, members: 4 } });
  const wrapper = mount(AdminDashboard, options());
  await flushPromises();
  await wrapper.get('[data-test="retry"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('[data-test="stat-questions"]').text()).toContain('7');
});
it('공고 삭제는 확인 뒤에만 요청하고 취소하면 원본 목록을 유지한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 7, title: '삭제 공고', language: ['JAVA'], company: 'DEMP' }], last: true, number: 0 } });
  axios.delete.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncements, options());
  await flushPromises();
  await wrapper.get('[data-test="delete-7"]').trigger('click');
  expect(axios.delete).not.toHaveBeenCalled();
  await wrapper.get('[data-test="cancel-delete"]').trigger('click');
  expect(wrapper.text()).toContain('삭제 공고');
  await wrapper.get('[data-test="delete-7"]').trigger('click');
  await wrapper.get('[data-test="confirm-delete"]').trigger('click');
  await flushPromises();
  expect(axios.delete).toHaveBeenCalledWith('/api/admin/announcements/7');
});
it('기존 HTML 질문을 Markdown으로 불러와 안전한 HTML로 저장하며 중복 제출을 막는다', async () => {
  axios.get.mockResolvedValue({ data: { id: 7, questionId: 7, title: '원본', content: '<h2>기존 제목</h2><p><u>밑줄</u></p>', username: 'author', hashtags: ['JAVA'] } });
  let finish;
  axios.patch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const wrapper = mount(AdminPostEditor, { ...options({ id: '7' }), props: { kind: 'questions' } });
  await flushPromises();
  expect(wrapper.get('#admin-content').element.value).toContain('## 기존 제목');
  expect(wrapper.get('.admin-original h2').text()).toBe('기존 제목');
  await wrapper.get('#admin-content').setValue('## 수정 제목\n\n<u>밑줄</u>');
  await wrapper.get('form').trigger('submit');
  await wrapper.get('form').trigger('submit');
  expect(axios.patch).toHaveBeenCalledTimes(1);
  expect(axios.patch.mock.calls[0]).toEqual(['/api/admin/questions/7', expect.objectContaining({ content: expect.stringContaining('<h2>수정 제목</h2>') })]);
  expect(axios.patch.mock.calls[0][1].content).toContain('<u>밑줄</u>');
  finish({ data: {} }); await flushPromises();
});
it('공고 수정은 기존 HTML과 필드를 복원하고 파일을 선택하지 않으면 image를 보내지 않는다', async () => {
  axios.get.mockResolvedValue({ data: { title: '원본 공고', company: { name: 'DEMP' }, content: '<h2>기존</h2>', language: ['JAVA', 'SPRING'], announcementType: 'EDU', position: 'BACKEND', minCareer: 0, maxCareer: 0, payment: 0, startedDate: '2026-01-01T00:00:00', deadLineDate: '2026-12-31T00:00:00', accessUrl: 'https://example.test', image: '' } });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' }));
  await flushPromises();
  expect(wrapper.get('#admin-content').text()).toContain('기존');
  await wrapper.setData({ form: { ...wrapper.vm.form, content: '<h2>수정</h2>' } });
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  const [url, data] = axios.patch.mock.calls[0];
  expect(url).toBe('/api/admin/announcements/7');
  expect(data.has('image')).toBe(false);
  expect(data.getAll('language')).toEqual(['JAVA', 'SPRING']);
  expect(data.get('content')).toContain('<h2>수정</h2>');
});
it('관리자 저장의 400 오류는 입력값 안내를 표시하고 작성 내용을 보존한다', async () => {
  axios.get.mockResolvedValue({ data: { id: 7, questionId: 7, title: '원본', content: '<p>기존 본문</p>', username: 'author', hashtags: [] } });
  axios.patch.mockRejectedValue({ response: { status: 400 } });
  const wrapper = mount(AdminPostEditor, { ...options({ id: '7' }), props: { kind: 'questions' } });
  await flushPromises();
  await wrapper.get('#admin-content').setValue('수정한 본문');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('입력값');
  expect(wrapper.get('#admin-content').element.value).toBe('수정한 본문');
});

const datedAnnouncement = () => ({ title: '모집 공고', company: { name: 'DEMP' }, content: '<p>지원 안내</p>', language: ['JAVA'], announcementType: 'EMP', position: 'BACKEND', minCareer: 0, maxCareer: 0, payment: null, startedDate: '2026-10-07T17:56:53', deadLineDate: '2026-10-31T18:30:45', accessUrl: 'https://example.test', image: '' });

it.each(['REGULAR', 'CONTRACT', 'CONVERSION_INTERNSHIP', 'EXPERIENTIAL_INTERNSHIP'])('고용 형태 %s를 모집 대상과 따로 복원하고 저장한다', async employmentType => {
  axios.get.mockResolvedValue({ data: { ...datedAnnouncement(), recruitmentAudience: 'NEW', employmentType } });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' }));
  await flushPromises();
  const employment = wrapper.get('select[aria-label="고용 형태"]');
  expect(employment.findAll('option').map(option => option.text())).toEqual(['미확인', '정규직', '계약직', '전환형 인턴', '체험형 인턴']);
  expect(employment.element.value).toBe(employmentType);
  await wrapper.get('#admin-audience').setValue('EXPERIENCED');
  expect(employment.element.value).toBe(employmentType);
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.calls[0][1].get('employmentType')).toBe(employmentType);
  expect(axios.patch.mock.calls[0][1].get('recruitmentAudience')).toBe('EXPERIENCED');
  wrapper.unmount();
});

it('기존 공고의 고용 형태는 미확인으로 복원하며 명시한 형태도 다시 비울 수 있다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  const select = wrapper.get('select[aria-label="고용 형태"]');
  expect(select.element.selectedOptions[0].textContent).toBe('미확인');
  await select.setValue('CONVERSION_INTERNSHIP');
  await select.findAll('option')[0].setSelected();
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.calls[0][1].has('employmentType')).toBe(false);
  wrapper.unmount();
});

it('고용 형태 저장 실패에는 선택과 입력을 보존하고 교육 전환 시 채용 값과 필드를 비운다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  axios.patch.mockRejectedValue({ response: { status: 500 } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  await wrapper.get('select[aria-label="고용 형태"]').setValue('EXPERIENTIAL_INTERNSHIP');
  await wrapper.get('#admin-title').setValue('보존할 제목');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('다시');
  expect(wrapper.get('select[aria-label="고용 형태"]').element.value).toBe('EXPERIENTIAL_INTERNSHIP');
  expect(wrapper.get('#admin-title').element.value).toBe('보존할 제목');
  await wrapper.get('#admin-type').setValue('EDU');
  expect(wrapper.find('select[aria-label="고용 형태"]').exists()).toBe(false);
  expect(wrapper.vm.form.employmentType).toBe(null);
  wrapper.unmount();
});

it('공고 multipart는 채용 고용 형태만 보내며 교육 값과 미확인을 임의 추정하지 않는다', () => {
  expect(toAnnouncementFormData({ type: 'EMP', employmentType: 'REGULAR' }).get('employmentType')).toBe('REGULAR');
  expect(toAnnouncementFormData({ type: 'EMP', employmentType: null }).has('employmentType')).toBe(false);
  expect(toAnnouncementFormData({ type: 'EDU', employmentType: 'CONVERSION_INTERNSHIP' }).has('employmentType')).toBe(false);
});

it('기술 스택은 선택 칩 전체를 눌러 선택·해제하고 같은 값으로 저장한다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, { ...options({ id: '7' }), attachTo: document.body }); await flushPromises();
  const choices = wrapper.findAll('.technology-choice');
  expect(choices.map(choice => choice.text())).toEqual(['Java', 'Spring', 'JPA', 'HTML', 'CSS', 'React']);
  expect(choices[0].classes()).toContain('is-selected');
  await choices[1].trigger('click');
  expect(choices[1].get('input').element.checked).toBe(true);
  expect(choices[1].classes()).toContain('is-selected');
  await choices[0].trigger('click');
  expect(choices[0].get('input').element.checked).toBe(false);
  expect(choices[0].classes()).not.toContain('is-selected');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.calls[0][1].getAll('language')).toEqual(['SPRING']);
  wrapper.unmount();
});

it('저장 중 기술 스택 칩은 비활성이고 선택과 중복 요청을 바꾸지 않는다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  let finish;
  axios.patch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const wrapper = mount(AdminAnnouncementEditor, { ...options({ id: '7' }), attachTo: document.body }); await flushPromises();
  await wrapper.get('form').trigger('submit');
  const choices = wrapper.findAll('.technology-choice');
  expect(choices).toHaveLength(6);
  for (const choice of choices) expect(choice.get('input').element.disabled).toBe(true);
  await choices[1].trigger('click');
  expect(choices[1].get('input').element.checked).toBe(false);
  await wrapper.get('form').trigger('submit');
  expect(axios.patch).toHaveBeenCalledTimes(1);
  expect(axios.patch.mock.calls[0][1].getAll('language')).toEqual(['JAVA']);
  finish({ data: { cleanupPending: false } }); await flushPromises(); wrapper.unmount();
});

it('변경 이력은 원래 순서와 모든 표시 값을 보존하고 날짜·작성자·상태와 제목을 분리한다', async () => {
  axios.get.mockResolvedValueOnce({ data: datedAnnouncement() }).mockResolvedValueOnce({ data: [
    { changedAt: '2026-10-07T18:00:00', actor: 'first-admin', status: 'PUBLISHED', title: '전환형 인턴 모집 공고의 아주 긴 제목', sourceUrl: 'https://example.test/first' },
    { changedAt: '2026-10-07T18:03:00', actor: 'second-admin', status: 'HIDDEN', title: '두 번째 이력', sourceUrl: 'https://example.test/second' },
  ] });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  await wrapper.findAll('button').find(button => button.text() === '이력 보기').trigger('click'); await flushPromises();
  const rows = wrapper.get('ol[aria-label="공고 변경 이력"]').findAll('li');
  expect(rows).toHaveLength(2);
  expect(rows.map(row => row.get('time').text())).toEqual(['2026.10.07 18:00', '2026.10.07 18:03']);
  expect(rows.map(row => row.get('time').attributes('datetime'))).toEqual(['2026-10-07T18:00:00', '2026-10-07T18:03:00']);
  expect(rows.map(row => row.get('.history-actor').text())).toEqual(['first-admin', 'second-admin']);
  expect(rows.map(row => row.get('.history-status').text())).toEqual(['공개', '비공개']);
  expect(rows.map(row => row.get('.history-title').text())).toEqual(['전환형 인턴 모집 공고의 아주 긴 제목', '두 번째 이력']);
  expect(rows[0].get('.history-meta').text()).not.toContain('전환형 인턴');
  expect(axios.get).toHaveBeenLastCalledWith('/api/admin/announcements/7/history');
  wrapper.unmount();
});

it('기존 초를 입력 화면에서는 숨기고 날짜를 바꾸지 않은 저장에서는 보존한다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' }));
  await flushPromises();
  expect(wrapper.get('#admin-startedDate').element.value).toBe('2026-10-07T17:56');
  expect(wrapper.get('#admin-deadLineDate').element.value).toBe('2026-10-31T18:30');
  expect(wrapper.get('#admin-startedDate').element.validity.stepMismatch).toBe(false);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(axios.patch.mock.calls[0][1].get('startedDate')).toBe('2026-10-07T17:56:53');
  expect(axios.patch.mock.calls[0][1].get('deadLineDate')).toBe('2026-10-31T18:30:45');
});

it('시각을 직접 바꾸면 입력한 분 단위를 저장하고 다른 날짜의 초는 보존한다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' }));
  await flushPromises();
  await wrapper.get('#admin-startedDate').setValue('2026-10-08T09:15');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(axios.patch.mock.calls[0][1].get('startedDate')).toBe('2026-10-08T09:15');
  expect(axios.patch.mock.calls[0][1].get('deadLineDate')).toBe('2026-10-31T18:30:45');
});
