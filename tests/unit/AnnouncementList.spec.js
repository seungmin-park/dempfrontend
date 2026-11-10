import { vi } from 'vitest';
import { config } from '@vue/test-utils';
beforeEach(() => { config.global.mocks.$route = { path: '/', fullPath: '/', query: {} }; });
afterEach(() => { delete config.global.mocks.$route; });
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';

vi.mock('axios');
vi.mock('@/api/bookmarks', () => ({ getBookmarkStatus: vi.fn().mockResolvedValue({ data: { savedIds: [] } }), setAnnouncementSaved: vi.fn() }));

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
  await wrapper.get('[data-test="load-more"]').trigger('click');
  await flushPromises();

  expect(axios.get).toHaveBeenNthCalledWith(2, '/api/announce', { params: {
    announcementType: 'EMP', positions: 'BACKEND', career: 0, orderBy: 'DEADLINE',
    title: 'Java', page: 0, size: 8,
  } });
  expect(axios.get).toHaveBeenNthCalledWith(3, '/api/announce', { params: {
    announcementType: 'EMP', positions: 'BACKEND', career: 0, orderBy: 'DEADLINE',
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

test('비로그인 공고 클릭은 검색 조건을 담은 상세 경로로 이동해 라우터의 로그인 복귀를 사용한다', async () => {
  axios.get.mockResolvedValue({ data: { content: [{ id: 71, title: '채용 공고' }], last: true } });
  const push = vi.fn();
  const alert = vi.fn();
  vi.stubGlobal('alert', alert);
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() },
    $store: { state: { Login: { token: '' } } },
    $route: { path: '/', fullPath: '/?title=Java', query: { title: 'Java' } },
    $router: { push },
  } } });
  await flushPromises();
  await wrapper.get('.item').trigger('click');
  expect(push).toHaveBeenCalledWith({ path: '/detail/71', query: { title: 'Java' } });
  expect(alert).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
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
  await wrapper.get('[data-test="load-more"]').trigger('click');
  await wrapper.get('[data-test="load-more"]').trigger('click');
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
  expect(wrapper.text()).toContain('현재 모집 중이거나 예정된 공고가 없습니다');
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
  const sizes = axios.get.mock.calls.map(([, options]) => options.params.size);
  expect(sizes.filter(size => size === 8)).toHaveLength(3);
  expect(sizes.filter(size => size === 1)).toHaveLength(1);
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


test('열어 둔 모집 중 필터는 재조회로 시작된 공고를 반영하고 재조회 실패에도 기존 목록을 보존한다', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2030-11-01T00:00:00Z'));
  const item = { id: 91, title: '자동 전환 공고', startedDate: '2030-11-01T09:00:01', deadLineDate: '2030-11-01T09:02:00' };
  const listResponses = [() => Promise.resolve({ data: { content: [], last: true } }), () => Promise.resolve({ data: { content: [item], last: true } }), () => Promise.reject(new Error('network'))];
  axios.get.mockReset(); axios.get.mockImplementation((url, { params }) => params.size === 1 ? Promise.resolve({ data: { content: [], last: true } }) : listResponses.shift()());
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() }, $route: { query: { status: 'OPEN', q: '자동' } },
    $store: { state: { Login: { token: 'token' } } }, $router: { push: vi.fn() },
  } } });
  try {
    await flushPromises();
    await vi.advanceTimersByTimeAsync(30000); await flushPromises();
    expect(wrapper.text()).toContain('자동 전환 공고');
    expect(wrapper.get('[aria-label="현재 모집 상태"]').text()).toBe('모집 중');
    expect(axios.get.mock.calls.filter(([, options]) => options.params.size === 8).at(-1)[1].params).toMatchObject({ recruitmentStatus: 'OPEN', title: '자동', page: 0 });
    await vi.advanceTimersByTimeAsync(30000); await flushPromises();
    expect(wrapper.text()).toContain('자동 전환 공고');
    expect(wrapper.text()).toContain('최신 모집 상태를 확인하지 못했습니다');
  } finally { wrapper.unmount(); vi.useRealTimers(); }
});

test('목록 개수는 더 불러올 수 있으면 지금까지 표시한 수, 끝까지 불러오면 전체 수로 구분한다', async () => {
  axios.get.mockReset();
  axios.get
    .mockResolvedValueOnce({ data: { content: [{ id: 2, title: '첫 공고' }, { id: 1, title: '둘째 공고' }], last: false } })
    .mockResolvedValueOnce({ data: { content: [{ id: 0, title: '마지막 공고' }], last: true } });
  const wrapper = mount(AnnouncementList, { global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() }, $store: { state: { Login: { token: 'token' } } }, $router: { push: vi.fn() },
  } } });
  await flushPromises();
  expect(wrapper.get('.results-heading h2').text()).toBe('공고 목록 지금까지 2개');
  await wrapper.get('[data-test="load-more"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('.results-heading h2').text()).toBe('공고 목록 전체 3개');
});

const key = 'demp:announcement-list-return';
const listRequests = () => axios.get.mock.calls.filter(([, options]) => options.params.size === 8).map(([, options]) => options.params.page);
function mountList(fullPath = '/?languages=JAVA') {
  return mount(AnnouncementList, { attachTo: document.body, global: { mocks: {
    emitter: { on: vi.fn(), off: vi.fn() }, $store: { state: { Login: { token: 'token' } } },
    $route: { path: '/', fullPath, query: { languages: 'JAVA' } }, $router: { push: vi.fn() },
  } } });
}
function mockThreePages() {
  axios.get.mockReset();
  axios.get.mockImplementation((url, { params }) => Promise.resolve({ data: { content: [{ id: params.page * 2 + 1, title: `공고 ${params.page * 2 + 1}` }, { id: params.page * 2 + 2, title: `공고 ${params.page * 2 + 2}` }], last: params.page >= 2 } }));
}
afterEach(() => { sessionStorage.clear(); history.replaceState(null, ''); });

test('공고를 누르면 지금 목록 기록에 불러온 페이지 수와 누른 공고를 남긴다', async () => {
  mockThreePages();
  history.replaceState({ position: 4, forward: null }, '');
  const wrapper = mountList(); await flushPromises();
  await wrapper.get('[data-test="load-more"]').trigger('click'); await flushPromises();
  await wrapper.get('[aria-label="공고 3"]').trigger('click');
  expect(JSON.parse(sessionStorage.getItem(key))).toEqual({ position: 4, path: '/?languages=JAVA', pages: 2, id: 3 });
});

test('상세에서 돌아오면 그 페이지까지 다시 불러오고 누른 공고에 포커스를 준다', async () => {
  mockThreePages();
  history.replaceState({ position: 4, forward: '/detail/3?languages=JAVA' }, '');
  sessionStorage.setItem(key, JSON.stringify({ position: 4, path: '/?languages=JAVA', pages: 2, id: 3 }));
  const wrapper = mountList(); await flushPromises();
  expect(listRequests()).toEqual([0, 1]);
  expect(document.activeElement?.getAttribute('aria-label')).toBe('공고 3');
  expect(sessionStorage.getItem(key)).toBeNull();
  wrapper.unmount();
});

test('같은 주소로 새로 들어오거나 다른 목록 기록이면 처음 페이지부터 보여준다', async () => {
  mockThreePages();
  sessionStorage.setItem(key, JSON.stringify({ position: 4, path: '/?languages=JAVA', pages: 2, id: 3 }));
  history.replaceState({ position: 5, forward: null }, '');
  mountList(); await flushPromises();
  history.replaceState({ position: 6, forward: '/detail/3' }, '');
  mountList(); await flushPromises();
  expect(listRequests()).toEqual([0, 0]);
  expect(document.activeElement).toBe(document.body);
});

test('손상되거나 과도한 기록은 무시하고 처음 페이지만 불러온다', async () => {
  mockThreePages();
  history.replaceState({ position: 4, forward: '/detail/3' }, '');
  for (const value of ['{', JSON.stringify({ position: 4, path: '/?languages=JAVA', pages: 500, id: 3 }), JSON.stringify({ position: 4, path: '/?languages=JAVA', pages: '2', id: 3 })]) {
    sessionStorage.setItem(key, value);
    mountList(); await flushPromises();
  }
  expect(listRequests()).toEqual([0, 0, 0]);
});
