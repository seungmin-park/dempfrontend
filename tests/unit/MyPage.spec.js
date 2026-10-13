import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import MyPage from '@/views/member/MyPage.vue';
import { Login } from '@/store/modules/Login';
import * as members from '@/api/members';
vi.mock('@/api/members', () => ({ getMyProfile: vi.fn(), updateMyNickname: vi.fn(), changeMyPassword: vi.fn(), getLoginRateLimit: vi.fn() }));
const profile = { id: 41, username: 'member', nickname: null, admin: false };
let wrappers = [];
beforeEach(() => { vi.resetAllMocks(); sessionStorage.clear(); members.getMyProfile.mockResolvedValue({ data: profile }); });
afterEach(() => { wrappers.forEach(w => w.unmount()); wrappers = []; });
function page() {
 const store = createStore({ modules: { Login } });
 store.commit('Login/setUsername', 'member'); store.commit('Login/setToken', 'token');
 const wrapper = mount(MyPage, { global: { plugins: [store], stubs: { RouterLink: true } } });
 wrappers.push(wrapper); return { wrapper, store };
}
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
