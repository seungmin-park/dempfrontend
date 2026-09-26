import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementWrite from '@/components/announcement/AnnouncementWrite.vue';

jest.mock('axios');

afterEach(() => {
  jest.clearAllMocks();
  delete global.$;
});

test('공고 등록은 서버의 평면 multipart 필드로 요청한다', async () => {
  const summernote = jest.fn(argument => argument === 'code' ? '<p>설명</p>' : undefined);
  global.$ = () => ({ summernote });
  axios.post.mockResolvedValue({ data: 'ok' });
  const push = jest.fn();
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
    language: ['JAVA', 'SPRING'], image,
  });

  wrapper.vm.saveAnnounce();
  await flushPromises();

  const request = axios.post.mock.calls[0][1];
  expect(Object.fromEntries(request.entries())).toMatchObject({
    title: '백엔드 채용', company: 'DEMP', type: 'EMP', position: 'BACKEND',
    minCareer: '0', maxCareer: '3',
    startedDate: '2026-09-01T00:00:00', deadLineDate: '2026-09-30T23:59:00',
    content: '<p>설명</p>', accessUrl: 'https://example.com/jobs/1', payment: '3000',
  });
  expect(request.getAll('language')).toEqual(['JAVA', 'SPRING']);
  expect(request.get('image')).toBe(image);
  expect(push).toHaveBeenCalledWith('/');
});

test('공고 이미지는 필수 JPEG 또는 PNG로 선택을 제한한다', () => {
  global.$ = () => ({ summernote: jest.fn() });
  const wrapper = mount(AnnouncementWrite, { global: { mocks: {
    $store: { state: { Login: { token: 'token' } } },
    $router: { push: jest.fn() },
  } } });

  const imageInput = wrapper.get('input[type="file"]');
  expect(imageInput.attributes('required')).toBeDefined();
  expect(imageInput.attributes('accept')).toBe('image/jpeg,image/png,.jpg,.jpeg,.png');
});
