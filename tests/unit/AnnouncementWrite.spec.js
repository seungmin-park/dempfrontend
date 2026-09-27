import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementWrite from '@/components/announcement/AnnouncementWrite.vue';

vi.mock('axios');

test('공고 Markdown은 안전한 HTML로 전송하며 저장 중 중복 요청과 실패 시 입력 유실을 막는다', async () => {
  global.$ = () => ({ summernote: vi.fn(() => '<p>이전 입력</p>') });
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  let rejectRequest;
  axios.post.mockImplementation(() => new Promise((_resolve, reject) => { rejectRequest = reject; }));
  const wrapper = mount(AnnouncementWrite, { global: { mocks: {
    $store: { state: { Login: { token: 'jwt' } } }, $router: { push: vi.fn() },
  } } });
  await wrapper.get('#content').setValue('## 업무\n\n**개발**');
  wrapper.vm.saveAnnounce();
  wrapper.vm.saveAnnounce();
  await flushPromises();
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post.mock.calls[0][1].get('content')).toContain('<h2>업무</h2>');
  rejectRequest(new Error('server'));
  await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('저장하지 못했습니다');
  expect(wrapper.get('#content').element.value).toContain('## 업무');
});

afterEach(() => {
  vi.clearAllMocks();
  delete global.$;
});

test('공고 등록은 서버의 평면 multipart 필드로 요청한다', async () => {
  const summernote = vi.fn(argument => argument === 'code' ? '<p>설명</p>' : undefined);
  global.$ = () => ({ summernote });
  axios.post.mockResolvedValue({ data: 'ok' });
  const push = vi.fn();
  const wrapper = mount(AnnouncementWrite, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } },
    $router: { push },
  } } });
  const image = new File(['png'], 'company.png', { type: 'image/png' });
  await wrapper.setData({
    title: '백엔드 채용', company: 'DEMP', type: 'EMP', position: 'BACKEND',
    minCareer: 0, maxCareer: 3,
    startedDate: '2026-09-01T00:00:00', deadLineDate: '2026-09-30T23:59:00',
    accessUrl: 'https://example.com/jobs/1', payment: 3000,
    language: ['JAVA', 'SPRING'], content: '설명',
  });

  const imageInput = wrapper.get('input[type="file"]');
  Object.defineProperty(imageInput.element, 'files', { value: [image] });
  await imageInput.trigger('change');
  wrapper.vm.saveAnnounce();
  await flushPromises();

  const request = axios.post.mock.calls[0][1];
  expect(Object.fromEntries(request.entries())).toMatchObject({
    title: '백엔드 채용', company: 'DEMP', type: 'EMP', position: 'BACKEND',
    minCareer: '0', maxCareer: '3',
    startedDate: '2026-09-01T00:00:00', deadLineDate: '2026-09-30T23:59:00',
    content: '<p>설명</p>\n', accessUrl: 'https://example.com/jobs/1', payment: '3000',
  });
  expect(request.getAll('language')).toEqual(['JAVA', 'SPRING']);
  expect(request.get('image')).toBe(image);
  expect(push).toHaveBeenCalledWith('/');
});

test('공고 이미지는 필수 JPEG 또는 PNG로 선택을 제한한다', () => {
  global.$ = () => ({ summernote: vi.fn() });
  const wrapper = mount(AnnouncementWrite, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } },
    $router: { push: vi.fn() },
  } } });

  const imageInput = wrapper.get('input[type="file"]');
  expect(imageInput.attributes('required')).toBeDefined();
  expect(imageInput.attributes('accept')).toBe('image/jpeg,image/png,.jpg,.jpeg,.png');
});
