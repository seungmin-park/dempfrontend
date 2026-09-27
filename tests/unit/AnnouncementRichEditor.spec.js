import { mount, flushPromises } from '@vue/test-utils';
import AdminAnnouncementEditor from '@/views/admin/AdminAnnouncementEditor.vue';
import axios from 'axios';
vi.mock('axios');
const options = { global: { stubs: { RouterLink: true }, mocks: { $route: { params: {}, query: {} }, $router: { push: vi.fn() } } } };

it('새 공고는 서식 입력 화면과 채용·교육별 항목을 제공한다', async () => {
  const wrapper = mount(AdminAnnouncementEditor, options);
  await flushPromises();
  expect(wrapper.find('[contenteditable="true"]').exists()).toBe(true);
  expect(wrapper.text()).toContain('채용 항목 추가');
  await wrapper.get('#admin-type').setValue('EDU');
  expect(wrapper.text()).toContain('교육 항목 추가');
  await wrapper.get('[data-test="body-template"]').trigger('click');
  expect(wrapper.get('[contenteditable="true"]').text()).toContain('배우는 내용');
  wrapper.unmount();
});

it('붙여넣은 이미지 파일은 저장 전 본문 위치와 multipart 첨부로 연결하고 실패해도 보존한다', async () => {
  let count = 0;
  URL.createObjectURL = vi.fn(() => `blob:fixture-${count++}`);
  URL.revokeObjectURL = vi.fn();
  axios.post.mockRejectedValue(new Error('server'));
  const wrapper = mount(AdminAnnouncementEditor, options);
  await wrapper.setData({ form: { title: '본문 이미지', company: 'DEMP', type: 'EMP', position: 'BACKEND', minCareer: 0, maxCareer: 0, payment: 0, startedDate: '2026-09-01T00:00', deadLineDate: '2026-12-31T00:00', accessUrl: 'https://employer.test/jobs/7', content: '<p>업무 요약</p>', image: null }, selectedLanguages: ['JAVA'] });
  await flushPromises();
  const file = new File(['png'], 'poster.png', { type: 'image/png' });
  await wrapper.get('#admin-content').trigger('paste', { clipboardData: { files: [file], getData: () => '' } });
  await flushPromises();
  expect(wrapper.find('#admin-content img').exists()).toBe(true);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  const body = axios.post.mock.calls.at(-1)[1];
  expect(body.get('content')).toContain('attachment:0');
  expect(body.get('content')).not.toContain('blob:');
  expect(body.getAll('bodyImages')).toEqual([file]);
  expect(wrapper.get('#admin-content').text()).toContain('업무 요약');
  expect(wrapper.find('#admin-content img').exists()).toBe(true);
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  wrapper.unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-0');
});

it('서식만 남은 빈 본문은 저장하지 않고 입력 안내를 표시한다', async () => {
  axios.post.mockReset();
  const wrapper = mount(AdminAnnouncementEditor, options);
  await flushPromises();
  await wrapper.setData({ form: { title: '빈 본문', company: 'DEMP', type: 'EMP', position: 'BACKEND', minCareer: 0, maxCareer: 0, payment: 0, startedDate: '2026-09-01T00:00', deadLineDate: '2026-12-31T00:00', accessUrl: 'https://employer.test/jobs/7', content: '<p><br></p>', image: null }, selectedLanguages: ['JAVA'] });
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(axios.post).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain('본문 내용을 입력');
  wrapper.unmount();
});

it('대표 이미지와 본문 이미지 합계가 한도를 넘으면 서버 요청 전에 구체적으로 안내한다', async () => {
  axios.post.mockReset();
  const wrapper = mount(AdminAnnouncementEditor, options);
  await flushPromises();
  const image = new File([new Uint8Array(4 * 1024 * 1024)], 'large.png', { type: 'image/png' });
  await wrapper.setData({ form: { title: '첨부 용량', company: 'DEMP', type: 'EMP', position: 'BACKEND', minCareer: 0, maxCareer: 0, payment: 0, startedDate: '2026-09-01T00:00', deadLineDate: '2026-12-31T00:00', accessUrl: 'https://employer.test/jobs/7', content: '<p>업무 요약</p>', image }, selectedLanguages: ['JAVA'], bodyImages: [image, image] });
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(axios.post).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain('합계 9MB');
  wrapper.unmount();
});
