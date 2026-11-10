import { vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import { createStore } from 'vuex';
import SavedAnnouncements from '@/views/member/SavedAnnouncements.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());
async function screen() {
  return mount(SavedAnnouncements, { props: { embedded: true }, global: { provide: { store: createStore({state:{Login:{token:'token',username:'member'}}}) }, mocks: {
    $store: { state: { Login: { token: 'token', username: 'member' } } },
    $router: { push: vi.fn() }, $route: { path: '/saved', fullPath: '/saved', query: {} },
  }, stubs: { RouterLink: { props:['to'], template:'<a><slot /></a>' } } } });
}
test('내 관심 공고는 저장한 공개 공고와 이용 불가 항목을 보여주고 해제할 수 있다', async () => {
  axios.get.mockImplementation(url => Promise.resolve({ data: url.includes('/status') ? { savedIds: [71,72] }
    : { content: [{ announcementId: 71, available: true, savedAt: '2026-10-15T10:00:00', announcement: { id:71,title:'저장한 채용',company:'DEMP',language:[],deadLineDate:'2026-10-26T17:00:00' } },
      { announcementId:72, available:false, savedAt:'2026-10-14T10:00:00',announcement:null }], hasNext:false,number:0 } }));
  axios.put.mockImplementation(() => { axios.get.mockResolvedValue({data:{content:[{announcementId:71,available:true,announcement:{id:71,title:'저장한 채용',language:[]}}],hasNext:false,number:0}}); return Promise.resolve({data:{announcementId:72,saved:false}}); });
  const wrapper = await screen(); await flushPromises();
  expect(wrapper.text()).toContain('저장한 채용'); expect(wrapper.text()).toContain('이용할 수 없는 공고');
  expect(wrapper.text()).toContain('17:00');
  await wrapper.findAll('[aria-label="관심 공고 해제"]')[1].trigger('click'); await flushPromises();
  expect(wrapper.text()).not.toContain('이용할 수 없는 공고');
});
test('내 목록 조회 실패는 같은 화면에서 재시도하고 빈 결과를 탐색으로 안내한다', async () => {
  axios.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({data:{content:[],hasNext:false,number:0}});
  const wrapper=await screen(); await flushPromises();
  expect(wrapper.text()).toContain('불러오지 못했습니다');
  await wrapper.get('[data-test="retry-saved"]').trigger('click');await flushPromises();
  expect(wrapper.text()).toContain('저장한 공고가 없습니다');
});
const RouterLinkStub = { name: 'RouterLink', props: ['to'], template: '<a class="router-link-stub"><slot /></a>' };
const entry = id => ({ announcementId: id, available: true, savedAt: '2026-10-15T10:00:00', announcement: { id, title: `저장 ${id}`, company: 'DEMP', language: [] } });
function mountSaved(compareIds) {
  axios.get.mockResolvedValue({ data: { content: [entry(1), entry(2), entry(3), entry(4), entry(5), { announcementId: 6, available: false, savedAt: '2026-10-15T10:00:00', announcement: null }], hasNext: false, number: 0 } });
  return mount(SavedAnnouncements, { props: { embedded: true, compareIds }, global: { provide: { store: createStore({ state: { Login: { token: 'token', username: 'member' } } }) }, stubs: { RouterLink: RouterLinkStub } } });
}
test('이용 가능한 공고만 비교에 담을 수 있고 선택은 부모에게 알려 URL에 남긴다', async () => {
  const wrapper = mountSaved([1]); await flushPromises();
  const boxes = wrapper.findAll('input[type="checkbox"][data-test="compare-select"]');
  expect(boxes).toHaveLength(5);
  expect(boxes.map(box => box.element.checked)).toEqual([true, false, false, false, false]);
  await boxes[2].setValue(true);
  expect(wrapper.emitted('update:compareIds')).toEqual([[[1, 3]]]);
});
test('두 개 이상 고르면 비교 화면으로 가고 네 개를 고르면 나머지는 고를 수 없다', async () => {
  const one = mountSaved([1]); await flushPromises();
  expect(one.find('[data-test="open-compare"]').exists()).toBe(false);
  const four = mountSaved([1, 2, 3, 4]); await flushPromises();
  expect(four.findAllComponents(RouterLinkStub).map(link => link.props('to'))).toContainEqual({ path: '/compare', query: { ids: '1,2,3,4' } });
  expect(four.findAll('input[data-test="compare-select"]').map(box => box.element.disabled)).toEqual([false, false, false, false, true]);
  expect(four.text()).toContain('최대 4개');
});
