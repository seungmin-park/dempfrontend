import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import { createMemoryHistory, createRouter } from 'vue-router';
import MyPage from '@/views/member/MyPage.vue';
import { Login } from '@/store/modules/Login';
import * as members from '@/api/members';
import * as bookmarks from '@/api/bookmarks';
vi.mock('@/api/members', () => ({ getMyProfile: vi.fn(), updateMyNickname: vi.fn(), changeMyPassword: vi.fn(), getLoginRateLimit: vi.fn() }));
vi.mock('@/api/bookmarks', () => ({ getBookmarks: vi.fn(), setAnnouncementSaved: vi.fn() }));
const profile = { id: 41, username: 'member', nickname: null, admin: false };
let wrappers = [];
beforeEach(() => { vi.resetAllMocks(); sessionStorage.clear(); members.getMyProfile.mockResolvedValue({ data: profile }); bookmarks.getBookmarks.mockResolvedValue({ data: { content: [], hasNext: false, number: 0 } }); });
afterEach(() => { wrappers.forEach(w => w.unmount()); wrappers = []; });
function page() {
 const store = createStore({ modules: { Login } });
 const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/mypage', component: MyPage }, { path: '/:pathMatch(.*)*', component: { template: '<div />' } }] });
 store.commit('Login/setUsername', 'member'); store.commit('Login/setToken', 'token');
 const wrapper = mount(MyPage, { global: { plugins: [store, router] } });
 wrappers.push(wrapper); return { wrapper, store, router };
}
it('마이페이지에서 관심 공고와 계정 설정을 같은 화면의 섹션으로 찾는다', async () => {
 const { wrapper } = page(); await flushPromises();
 expect(wrapper.findAll('.account-section-nav a').map(link => link.text())).toEqual(['관심 공고', '계정 설정']);
 expect(wrapper.get('.page-heading').text()).toContain('마이페이지');
 expect(wrapper.find('.page-heading .eyebrow').exists()).toBe(false);
 expect(wrapper.find('.page-heading .button').exists()).toBe(false);
});
it('계정 설정은 하나의 카드에서 회원 정보와 비밀번호 변경을 세로로 표시한다', async () => {
 const { wrapper } = page(); await flushPromises();
 const panels = wrapper.findAll('.account-panel');
 expect(panels).toHaveLength(1);
 expect(panels[0].findAll('h2').map(heading => heading.text())).toEqual(['회원 정보', '비밀번호 변경']);
 expect(panels[0].find('[data-test=nickname-form]').exists()).toBe(true);
 expect(panels[0].find('[data-test=password-form]').exists()).toBe(true);
});
it('관심 공고 섹션은 저장 목록을 마이페이지 안에 표시하고 계정 설정으로 돌아온다', async () => {
 const { wrapper, router } = page();
 bookmarks.getBookmarks.mockResolvedValue({ data: { content: [{ announcementId: 71, available: true, savedAt: '2026-10-15T12:00:00', announcement: { id: 71, title: '저장한 채용', company: 'DEMP', language: [] } }], hasNext: false, number: 0 } });
 await router.push('/mypage?tab=saved'); await flushPromises();
 expect(wrapper.text()).toContain('저장한 채용');
 expect(wrapper.find('#nickname').exists()).toBe(false);
 await router.push('/mypage'); await flushPromises();
 expect(wrapper.get('#nickname').exists()).toBe(true);
});
it('본인 아이디와 회원 구분을 조회하고 닉네임 저장 성공을 표시한다', async () => {
 const { wrapper } = page(); await flushPromises();
 expect(wrapper.text()).toContain('member'); expect(wrapper.text()).toContain('일반 회원');
 await wrapper.get('#nickname').setValue('새 이름');
 members.updateMyNickname.mockResolvedValue({ data: { ...profile, nickname: '새 이름' } });
 await wrapper.get('[data-test=nickname-form]').trigger('submit'); await flushPromises();
 expect(members.updateMyNickname).toHaveBeenCalledWith('새 이름');
 expect(wrapper.text()).toContain('닉네임을 저장했습니다');
});
it('닉네임 저장 실패 후 입력을 보존하고 같은 화면에서 재시도한다', async () => {
 const { wrapper } = page(); await flushPromises();
 await wrapper.get('#nickname').setValue('남길 이름');
 members.updateMyNickname.mockRejectedValueOnce({ response: { status: 500 } });
 await wrapper.get('[data-test=nickname-form]').trigger('submit'); await flushPromises();
 expect(wrapper.get('#nickname').element.value).toBe('남길 이름');
 expect(wrapper.text()).toContain('다시 시도');
 members.updateMyNickname.mockResolvedValue({ data: { ...profile, nickname: '남길 이름' } });
 await wrapper.get('[data-test=nickname-form]').trigger('submit'); await flushPromises();
 expect(wrapper.text()).toContain('닉네임을 저장했습니다');
});
it('비밀번호 불일치는 API 호출 없이 안내하고 성공 후 비밀 입력과 세션을 지운다', async () => {
 const { wrapper, store } = page(); await flushPromises();
 await wrapper.get('#current-password').setValue('password');
 await wrapper.get('#new-password').setValue('new-password');
 await wrapper.get('#confirm-password').setValue('different');
 await wrapper.get('[data-test=password-form]').trigger('submit');
 expect(members.changeMyPassword).not.toHaveBeenCalled();
 expect(wrapper.text()).toContain('일치하지');
 await wrapper.get('#confirm-password').setValue('new-password');
 members.changeMyPassword.mockResolvedValue({});
 await wrapper.get('[data-test=password-form]').trigger('submit'); await flushPromises();
 expect(members.changeMyPassword).toHaveBeenCalledWith('password', 'new-password');
 expect(store.state.Login.token).toBe('');
 expect(wrapper.text()).toContain('다시 로그인');
 expect(wrapper.find('#current-password').exists()).toBe(false);
});
it('조회 실패를 재시도하면 실제 회원 정보를 표시한다', async () => {
 members.getMyProfile.mockRejectedValueOnce(new Error('offline'));
 const { wrapper } = page(); await flushPromises();
 expect(wrapper.find('#nickname').exists()).toBe(false);
 await wrapper.get('[data-test=retry-profile]').trigger('click'); await flushPromises();
 expect(wrapper.get('#nickname').exists()).toBe(true);
});

it('이전 회원 조회 응답이 늦게 와도 새 로그인 회원 정보를 덮지 않는다', async () => {
 let finish;
 members.getMyProfile.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
   .mockResolvedValueOnce({ data: { ...profile, username: 'other', nickname: '다른 회원' } });
 const { wrapper, store } = page();
 store.commit('Login/setUsername', 'other'); store.commit('Login/setToken', 'other-token');
 await flushPromises();
 finish({ data: profile }); await flushPromises();
 expect(wrapper.get('#nickname').element.value).toBe('다른 회원');
 expect(wrapper.text()).toContain('other');
});
it('비밀번호 서버 거절 시 입력과 로그인 상태를 보존하고 원인을 안내한다', async () => {
 const { wrapper, store } = page(); await flushPromises();
 await wrapper.get('#current-password').setValue('wrong-password');
 await wrapper.get('#new-password').setValue('new-password');
 await wrapper.get('#confirm-password').setValue('new-password');
 members.changeMyPassword.mockRejectedValue({ response: { status: 400 } });
 await wrapper.get('[data-test=password-form]').trigger('submit'); await flushPromises();
 expect(wrapper.get('#current-password').element.value).toBe('wrong-password');
 expect(store.state.Login.token).toBe('token');
 expect(wrapper.text()).toContain('현재 비밀번호와');
 expect(JSON.stringify(sessionStorage)).not.toContain('password');
});
