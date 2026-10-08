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

it('검색으로 숨겨진 선택도 요약에서 한 번 눌러 해제하고 남은 값만 저장한다', async () => {
  axios.get.mockResolvedValue({ data: { ...datedAnnouncement(), language: ['JAVA', 'React', 'KUBERNETES'] } });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  await wrapper.get('[aria-label="관리자 기술 스택 검색"]').setValue('Spring');
  expect(wrapper.find('input[value=JAVA]').exists()).toBe(false);
  expect(wrapper.get('[aria-label="선택한 기술 스택"]').text()).toContain('Java');
  await wrapper.get('button[aria-label="Java 선택 해제"]').trigger('click');
  expect(wrapper.get('[aria-label="선택한 기술 스택"]').text()).not.toContain('Java');
  await wrapper.get('button[aria-label="기술 검색어 지우기"]').trigger('click');
  expect(wrapper.findAll('.technology-group')).toHaveLength(8);
  expect(wrapper.findAll('.technology-choice')).toHaveLength(66);
  expect(wrapper.get('input[value=JAVA]').element.checked).toBe(false);
  expect(wrapper.get('input[value=React]').element.checked).toBe(true);
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.lastCall[1].getAll('language')).toEqual(['React', 'KUBERNETES']);
  wrapper.unmount();
});

it('검색 결과가 없어도 검색을 바로 초기화하고 기존 선택을 유지한다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  await wrapper.get('[aria-label="관리자 기술 스택 검색"]').setValue('없는 기술');
  expect(wrapper.get('[role="status"]').text()).toContain('일치하는 기술이 없습니다');
  expect(wrapper.get('[aria-label="선택한 기술 스택"]').text()).toContain('Java');
  await wrapper.get('button[aria-label="기술 검색어 지우기"]').trigger('click');
  expect(wrapper.get('[aria-label="관리자 기술 스택 검색"]').element.value).toBe('');
  expect(wrapper.get('input[value=JAVA]').element.checked).toBe(true);
  wrapper.unmount();
});

it('저장 중에는 선택 요약에서도 해제를 막아 제출한 값을 보존한다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  let finish; axios.patch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  await wrapper.get('form').trigger('submit');
  const remove = wrapper.get('button[aria-label="Java 선택 해제"]');
  expect(remove.element.disabled).toBe(true);
  await remove.trigger('click');
  expect(wrapper.get('input[value=JAVA]').element.checked).toBe(true);
  expect(axios.patch.mock.lastCall[1].getAll('language')).toEqual(['JAVA']);
  finish({ data: {} }); await flushPromises(); wrapper.unmount();
});

it('기술을 모두 해제한 저장은 요청하지 않고 고칠 곳으로 초점을 옮기며 선택 즉시 오류를 지운다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, { ...options({ id: '7' }), attachTo: document.body }); await flushPromises();
  await wrapper.get('[aria-label="Java 선택 해제"]').trigger('click');
  wrapper.get('button[type=submit]').element.focus();
  await wrapper.get('form').trigger('submit'); await flushPromises();
  const search = wrapper.get('[aria-label="관리자 기술 스택 검색"]');
  expect(axios.patch).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(search.element);
  expect(search.attributes('aria-invalid')).toBe('true');
  expect(wrapper.get('#admin-technology-error').text()).toContain('하나 이상');
  await wrapper.get('input[value=KOTLIN]').setValue(true);
  expect(wrapper.find('#admin-technology-error').exists()).toBe(false);
  expect(search.attributes('aria-invalid')).toBe('false');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.lastCall[1].getAll('language')).toEqual(['KOTLIN']);
  wrapper.unmount();
});

it('저장 서버 오류에서도 검색·선택·본문을 보존하고 같은 화면에서 동일한 값으로 재시도한다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  axios.patch.mockRejectedValueOnce({ response: { status: 500 } }).mockResolvedValueOnce({ data: { cleanupPending: false } });
  const config = options({ id: '7' });
  const wrapper = mount(AdminAnnouncementEditor, config); await flushPromises();
  await wrapper.get('input[value=KOTLIN]').setValue(true);
  await wrapper.get('[aria-label="관리자 기술 스택 검색"]').setValue('Spring');
  await wrapper.get('#admin-title').setValue('오류 후 보존할 제목');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(wrapper.get('[role=alert]').text()).toContain('다시');
  expect(config.global.mocks.$router.push).not.toHaveBeenCalled();
  expect(wrapper.get('[aria-label="관리자 기술 스택 검색"]').element.value).toBe('Spring');
  expect(wrapper.get('[aria-label="선택한 기술 스택"]').text()).toContain('Kotlin');
  expect(wrapper.get('#admin-title').element.value).toBe('오류 후 보존할 제목');
  expect(wrapper.get('#admin-content').text()).toContain('지원 안내');
  expect(wrapper.get('button[type=submit]').element.disabled).toBe(false);
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.calls).toHaveLength(2);
  expect(axios.patch.mock.calls.map(([, form]) => form.getAll('language'))).toEqual([['JAVA', 'KOTLIN'], ['JAVA', 'KOTLIN']]);
  expect(config.global.mocks.$router.push).toHaveBeenCalledTimes(1);
  wrapper.unmount();
});

it('확장된 스택과 직무를 수정 폼에서 복원하고 선택·저장해 기존 값과 함께 보존한다', async () => {
  axios.get.mockResolvedValue({ data: { ...datedAnnouncement(), position: 'SRE', language: ['React','JAVA','KOTLIN','KUBERNETES'] } });
  axios.patch.mockResolvedValue({ data: { cleanupPending: false } });
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  expect(wrapper.get('#admin-position').element.value).toBe('SRE');
  expect(wrapper.get('input[value=KOTLIN]').element.checked).toBe(true);
  expect(wrapper.get('input[value=React]').element.checked).toBe(true);
  expect(wrapper.findAll('.technology-group > legend').map(group => group.text())).toContain('클라우드·운영');
  await wrapper.get('[aria-label="관리자 기술 스택 검색"]').setValue('Spring Boot');
  await wrapper.get('input[value=SPRING_BOOT]').setValue(true);
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch.mock.lastCall[1].get('position')).toBe('SRE');
  expect(axios.patch.mock.lastCall[1].getAll('language')).toEqual(['React','JAVA','KOTLIN','KUBERNETES','SPRING_BOOT']);
  wrapper.unmount();
});

it('공고 폼은 기본·모집·내용·출처·게시를 읽는 순서대로 구분한다', async () => {
  const wrapper = mount(AdminAnnouncementEditor, options()); await flushPromises();
  const groups = wrapper.findAll('form > fieldset');
  expect(groups.map(group => group.get('legend').text())).toEqual(['기본 정보', '모집 조건·일정', '공고 내용', '출처·지원', '게시 설정']);
  expect(groups[0].find('#admin-title').exists()).toBe(true);
  expect(groups[1].find('#admin-startedDate').exists()).toBe(true);
  expect(groups[2].find('#admin-content').exists()).toBe(true);
  expect(groups[3].find('#admin-accessUrl').exists()).toBe(true);
  expect(groups[4].find('#admin-publication').exists()).toBe(true);
  expect(wrapper.get('button[type="submit"]').text()).toBe('등록하기');
  wrapper.unmount();
});

it('앱 달력은 기존 선택 날짜로 열리고 월 이동·날짜 선택 시 기존 시·분을 보존한다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  const wrapper = mount(AdminAnnouncementEditor, { ...options({ id: '7' }), attachTo: document.body }); await flushPromises();
  await wrapper.get('button[aria-label="모집 시작 달력 열기"]').trigger('click');
  await flushPromises();
  const dialog = wrapper.get('[role="dialog"][aria-label="모집 시작 날짜 선택"]');
  expect(dialog.get('[aria-label="2026년 10월 7일"]').attributes('aria-pressed')).toBe('true');
  expect(document.activeElement).toBe(dialog.get('[aria-label="2026년 10월 7일"]').element);
  await dialog.get('[aria-label="다음 달"]').trigger('click');
  await dialog.get('[aria-label="2026년 11월 1일"]').trigger('click');
  expect(wrapper.get('#admin-startedDate').element.value).toBe('2026-11-01T17:56');
  expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  expect(wrapper.vm.form.deadLineDate).toBe('2026-10-31T18:30:45');
  wrapper.unmount();
});

it('달력의 방향키는 날짜를 이동하고 Escape는 값을 바꾸지 않고 여는 버튼에 초점을 돌린다', async () => {
  axios.get.mockResolvedValue({ data: datedAnnouncement() });
  const wrapper = mount(AdminAnnouncementEditor, { ...options({ id: '7' }), attachTo: document.body }); await flushPromises();
  const trigger = wrapper.get('button[aria-label="모집 시작 달력 열기"]');
  await trigger.trigger('click');
  await wrapper.get('[aria-label="2026년 10월 7일"]').trigger('keydown', { key: 'ArrowRight' });
  expect(document.activeElement).toBe(wrapper.get('[aria-label="2026년 10월 8일"]').element);
  await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' });
  expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  expect(document.activeElement).toBe(trigger.element);
  expect(wrapper.vm.form.startedDate).toBe('2026-10-07T17:56:53');
  wrapper.unmount();
});

it('달력은 윤년 2월 29일을 선택하고 저장 중에는 날짜 입력과 달력 열기를 막는다', async () => {
  axios.get.mockResolvedValue({ data: { ...datedAnnouncement(), startedDate: '2028-02-28T09:15:30', deadLineDate: '2028-03-31T18:00:00' } });
  let finish;
  axios.patch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const wrapper = mount(AdminAnnouncementEditor, options({ id: '7' })); await flushPromises();
  await wrapper.get('button[aria-label="모집 시작 달력 열기"]').trigger('click');
  await wrapper.get('[aria-label="2028년 2월 29일"]').trigger('click');
  expect(wrapper.get('#admin-startedDate').element.value).toBe('2028-02-29T09:15');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.get('#admin-startedDate').element.disabled).toBe(true);
  expect(wrapper.get('button[aria-label="모집 시작 달력 열기"]').element.disabled).toBe(true);
  expect(axios.patch.mock.calls[0][1].get('startedDate')).toBe('2028-02-29T09:15');
  finish({ data: { cleanupPending: false } }); await flushPromises(); wrapper.unmount();
});

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
  expect(choices).toHaveLength(66);
  expect(choices.map(choice => choice.text())).toEqual(expect.arrayContaining(['Java', 'Spring', 'JPA', 'HTML', 'CSS', 'React', 'Kotlin', 'Kubernetes']));
  expect(choices[0].classes()).toContain('is-selected');
  const spring = wrapper.get('label:has(input[value=SPRING])');
  await spring.trigger('click');
  expect(spring.get('input').element.checked).toBe(true);
  expect(spring.classes()).toContain('is-selected');
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
  expect(choices).toHaveLength(66);
  for (const choice of choices) expect(choice.get('input').element.disabled).toBe(true);
  const spring = wrapper.get('label:has(input[value=SPRING])');
  await spring.trigger('click');
  expect(spring.get('input').element.checked).toBe(false);
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
