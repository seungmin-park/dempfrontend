import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';

jest.mock('axios');

afterEach(() => jest.clearAllMocks());

test('공고 더보기는 제목과 직군 조건을 유지한 다음 페이지를 요청한다', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { content: [], last: true } })
    .mockResolvedValueOnce({ data: { content: [{ id: 2, title: 'Java 채용', language: ['JAVA'], position: 'BACKEND' }], last: false } })
    .mockResolvedValueOnce({ data: { content: [{ id: 1, title: 'Java 추가 채용', language: ['JAVA'], position: 'BACKEND' }], last: true } });
  const handlers = {};
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: jest.fn((name, handler) => { handlers[name] = handler; }) },
    $store: { state: { Login: { token: 'token' } } },
    $router: { push: jest.fn() },
  } } });
  await flushPromises();

  handlers.announcementSearchCondition({
    announcementType: 'EMP', positions: ['BACKEND'], career: 0, payment: 0, title: 'Java',
  });
  await flushPromises();
  await wrapper.get('button').trigger('click');
  await flushPromises();

  expect(axios.get).toHaveBeenNthCalledWith(2, '/api/announce', { params: {
    announcementType: 'EMP', positions: 'BACKEND', career: 0, payment: 0,
    title: 'Java', page: 0, size: 8,
  } });
  expect(axios.get).toHaveBeenNthCalledWith(3, '/api/announce', { params: {
    announcementType: 'EMP', positions: 'BACKEND', career: 0, payment: 0,
    title: 'Java', page: 1, size: 8,
  } });
  expect(wrapper.text()).toContain('Java 채용');
  expect(wrapper.text()).toContain('Java 추가 채용');
});
