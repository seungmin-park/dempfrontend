import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';

vi.mock('axios');

afterEach(() => vi.clearAllMocks());

test('공고 더보기는 제목과 직군 조건을 유지한 다음 페이지를 요청한다', async () => {
  axios.get
    .mockResolvedValueOnce({ data: { content: [], last: true } })
    .mockResolvedValueOnce({ data: { content: [{ id: 2, title: 'Java 채용', language: ['JAVA'], position: 'BACKEND' }], last: false } })
    .mockResolvedValueOnce({ data: { content: [{ id: 1, title: 'Java 추가 채용', language: ['JAVA'], position: 'BACKEND' }], last: true } });
  const handlers = {};
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn((name, handler) => { handlers[name] = handler; }), off: vi.fn() },
    $store: { state: { Login: { token: 'token' } } },
    $router: { push: vi.fn() },
  } } });
  await flushPromises();

  handlers.announcementSearchCondition({
    announcementType: 'EMP', positions: ['BACKEND'], career: 0, payment: 0, title: 'Java',
  });
  await flushPromises();
  await wrapper.get('button').trigger('click');
  await flushPromises();

  expect(axios.get).toHaveBeenNthCalledWith(2, '/api/announce', { params: {
    announcementType: 'EMP', positions: 'BACKEND', career: 0,
    title: 'Java', page: 0, size: 8,
  } });
  expect(axios.get).toHaveBeenNthCalledWith(3, '/api/announce', { params: {
    announcementType: 'EMP', positions: 'BACKEND', career: 0,
    title: 'Java', page: 1, size: 8,
  } });
  expect(wrapper.text()).toContain('Java 채용');
  expect(wrapper.text()).toContain('Java 추가 채용');
});

test('공고 항목 클릭은 해당 상세 경로로 이동한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 71, title: '채용 공고', hits: 23 }], last: true } });
  const push = vi.fn();
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() },
    $store: { state: { Login: { token: 'token' } } }, $router: { push },
  } } });
  await flushPromises();
  expect(wrapper.get('[aria-label="공고 조회수"]').text()).toBe('조회 23');
  await wrapper.get('.item').trigger('click');
  expect(push).toHaveBeenCalledWith('/detail/71');
});

test('더보기를 연속 클릭해도 진행 중인 페이지는 한 번만 요청한다', async () => {
  let finishPage;
  axios.get.mockResolvedValueOnce({ data: { content: [{ id: 1, title: '첫 공고' }], last: false } })
    .mockImplementationOnce(() => new Promise(resolve => { finishPage = resolve; }));
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() },
    $store: { state: { Login: { token: 'token' } } }, $router: { push: vi.fn() },
  } } });
  await flushPromises();
  await wrapper.get('button').trigger('click');
  await wrapper.get('button').trigger('click');
  expect(axios.get).toHaveBeenCalledTimes(2);
  finishPage({ data: { content: [], last: true } });
  await flushPromises();
});

test('요청 실패는 재시도할 수 있고 성공한 빈 페이지에서만 마지막 상태가 된다', async () => {
  axios.get.mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce({ data: { content: [], last: true } });
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() },
    $store: { state: { Login: { token: 'token' } } }, $router: { push: vi.fn() },
  } } });
  await flushPromises();
  expect(wrapper.text()).toContain('불러오지 못했습니다');
  await wrapper.get('[data-test="retry"]').trigger('click');
  await flushPromises();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(wrapper.text()).toContain('아직 등록된 공고가 없습니다');
  expect(wrapper.text()).not.toContain('불러오지 못했습니다');
});

test('공고 이벤트 구독은 해제되어 다시 마운트해도 한 번만 조회한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [], last: true } });
  const handlers = new Set();
  const emitter = { on: vi.fn((name, handler) => handlers.add(handler)), off: vi.fn((name, handler) => handlers.delete(handler)) };
  const options = { global: { mocks: {
    emitter, $store: { state: { Login: { token: 'token' } } }, $router: { push: vi.fn() },
  } } };
  const first = mount(AnnouncementList, options);
  await flushPromises();
  first.unmount();
  const second = mount(AnnouncementList, options);
  await flushPromises();
  expect(handlers.size).toBe(1);
  handlers.forEach(handler => handler({ announcementType: 'EMP', positions: [], title: 'Java', career: 0, payment: 0 }));
  await flushPromises();
  expect(axios.get).toHaveBeenCalledTimes(3);
  second.unmount();
  expect(handlers.size).toBe(0);
});

function observeListEnd() {
  const callbacks = [];
  const disconnect = vi.fn();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { callbacks.push(callback); }
    observe() {}
    unobserve() {}
    disconnect() { disconnect(); }
  });
  return {
    enter: () => callbacks.forEach(callback => callback([{ isIntersecting: true }])),
    disconnect,
  };
}

function mountScrollableList(handlers = {}) {
  return mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn((name, handler) => { handlers[name] = handler; }), off: vi.fn() },
    $store: { state: { Login: { token: 'token' } } }, $router: { push: vi.fn() },
  } } });
}

afterEach(() => vi.unstubAllGlobals());

test('목록 끝이 보이면 다음 페이지를 한 번만 불러오고 겹치는 공고를 중복 표시하지 않는다', async () => {
  const observer = observeListEnd();
  let finishPage;
  axios.get.mockResolvedValueOnce({ data: { content: [{ id: 3, title: '첫 공고' }, { id: 2, title: '둘째 공고' }], last: false } })
    .mockImplementationOnce(() => new Promise(resolve => { finishPage = resolve; }));
  const wrapper = mountScrollableList();
  await flushPromises();
  observer.enter();
  observer.enter();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(axios.get.mock.calls[1][1].params.page).toBe(1);
  finishPage({ data: { content: [{ id: 2, title: '둘째 공고' }, { id: 1, title: '마지막 공고' }], last: true } });
  await flushPromises();
  expect(wrapper.findAll('.notice-title').map(card => card.text())).toEqual(['첫 공고', '둘째 공고', '마지막 공고']);
  observer.enter();
  expect(axios.get).toHaveBeenCalledTimes(2);
  wrapper.unmount();
  expect(observer.disconnect).toHaveBeenCalledTimes(1);
});

test('스크롤 다음 페이지가 늦게 도착해도 변경된 필터의 결과를 덮거나 추가하지 않는다', async () => {
  const observer = observeListEnd();
  let finishOld;
  axios.get.mockResolvedValueOnce({ data: { content: [{ id: 3, title: '이전 첫 공고' }], last: false } })
    .mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
    .mockResolvedValueOnce({ data: { content: [{ id: 8, title: '새 필터 공고' }], last: true } });
  const handlers = {};
  const wrapper = mountScrollableList(handlers);
  await flushPromises();
  observer.enter();
  handlers.announcementSearchCondition({ announcementType: 'EDU', positions: ['BACKEND'], title: '새 필터', career: 0, payment: 0 });
  await flushPromises();
  expect(axios.get).toHaveBeenCalledTimes(3);
  expect(axios.get.mock.calls[2][1].params).toMatchObject({ announcementType: 'EDU', title: '새 필터', page: 0 });
  finishOld({ data: { content: [{ id: 2, title: '늦은 이전 공고' }], last: false } });
  await flushPromises();
  expect(wrapper.findAll('.notice-title').map(card => card.text())).toEqual(['새 필터 공고']);
});

test('스크롤 요청 실패는 자동 반복하지 않고 재시도 버튼으로 같은 페이지를 다시 요청한다', async () => {
  const observer = observeListEnd();
  axios.get.mockResolvedValueOnce({ data: { content: [{ id: 2, title: '첫 공고' }], last: false } })
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce({ data: { content: [{ id: 1, title: '복구 공고' }], last: true } });
  const wrapper = mountScrollableList();
  await flushPromises();
  observer.enter();
  await flushPromises();
  expect(wrapper.text()).toContain('불러오지 못했습니다');
  observer.enter();
  expect(axios.get).toHaveBeenCalledTimes(2);
  await wrapper.get('[data-test="retry"]').trigger('click');
  await flushPromises();
  expect(axios.get.mock.calls.slice(1).map(([, options]) => options.params.page)).toEqual([1, 1]);
  expect(wrapper.findAll('.notice-title').map(card => card.text())).toEqual(['첫 공고', '복구 공고']);
});
