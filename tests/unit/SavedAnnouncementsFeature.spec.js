import { vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AnnouncementList from '@/components/announcement/AnnouncementList.vue';
import LoginForm from '@/components/LoginForm.vue';
import AccountForm from '@/components/AccountForm.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());

function list(token = 'token', route = { path: '/', fullPath: '/?title=Java', query: { title: 'Java' } }, savedIds = () => []) {
  const push=vi.fn(), replace=vi.fn();
  axios.get.mockImplementation(url => Promise.resolve({ data: url.includes('/bookmarks/status') ? { savedIds: savedIds() }
    : { content: [{ id: 71, title: '관심 채용', language: [], position: 'BACKEND' }], last: true } }));
  const wrapper=mount(AnnouncementList,{global:{mocks:{
    emitter:{on:vi.fn(),off:vi.fn()}, $store:{state:{Login:{token,username: token ? 'member' : ''}}},
    $router:{push,replace},$route:route,
  }}});
  return {wrapper,push,replace};
}
test('목록에서 상세 이동 없이 관심 공고를 저장하고 실패한 해제는 확정 상태를 보존한다',async()=>{
  const {wrapper,push}=list(); await flushPromises();
  axios.put.mockResolvedValueOnce({data:{announcementId:71,saved:true}}).mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({data:{announcementId:71,saved:false}});
  const button=wrapper.get('[aria-label="관심 공고 저장"]');
  await button.trigger('click');await flushPromises();
  expect(wrapper.get('[aria-label="관심 공고 해제"]').attributes('aria-pressed')).toBe('true');
  expect(push).not.toHaveBeenCalled();
  await wrapper.get('[aria-label="관심 공고 해제"]').trigger('click'); await flushPromises();
  expect(wrapper.get('[aria-label="관심 공고 해제"]').attributes('aria-pressed')).toBe('true');
  expect(wrapper.text()).toContain('다시');
  await wrapper.get('[aria-label="관심 공고 해제"]').trigger('click'); await flushPromises();
  expect(wrapper.get('[aria-label="관심 공고 저장"]').attributes('aria-pressed')).toBe('false');
});
test('비로그인 저장은 검색 조건과 저장 의도를 유지하여 로그인으로 이동한다',async()=>{
  const {wrapper,push}=list(''); await flushPromises();
  await wrapper.get('[aria-label="관심 공고 저장"]').trigger('click');
  expect(push).toHaveBeenCalledWith({path:'/login',query:{redirect:'/?title=Java&saveAnnouncement=71'}});
  expect(axios.put).not.toHaveBeenCalled();
});
test('인증 복귀 저장 의도는 한 번 소비하고 저장 요청을 자동으로 이어간다',async()=>{
  let saved = false;
  axios.put.mockImplementation(() => { saved = true; return Promise.resolve({data:{announcementId:71,saved:true}}); });
  const {wrapper,replace}=list('token',{path:'/',fullPath:'/?title=Java&saveAnnouncement=71',query:{title:'Java',saveAnnouncement:'71'}}, () => saved ? [71] : []);
  await flushPromises();
  expect(axios.put).toHaveBeenCalledWith('/api/member/me/bookmarks/71',{saved:true});
  expect(replace).toHaveBeenCalledWith({path:'/',query:{title:'Java'}});
  expect(wrapper.get('[aria-label="관심 공고 해제"]').attributes('aria-pressed')).toBe('true');
});
test('로그인 화면의 가입 링크는 원래 검색과 저장 복귀 주소를 유지한다',async()=>{
  const redirect='/?title=Java&saveAnnouncement=71';
  const wrapper=mount(LoginForm,{global:{mocks:{$store:{state:{Login:{token:''}}},$route:{query:{redirect}},$router:{replace:vi.fn()}},stubs:{RouterLink:{name:'RouterLink',props:['to'],template:'<a><slot /></a>'}}}});
  await flushPromises();
  expect(wrapper.getComponent({name:'RouterLink'}).props('to')).toEqual({path:'/account',query:{redirect}});
});
test('가입 성공 후 로그인 화면까지 저장 복귀 주소를 유지한다',async()=>{
  const redirect='/?title=Java&saveAnnouncement=71',push=vi.fn();
  axios.post.mockResolvedValue({data:{}});
  const wrapper=mount(AccountForm,{global:{mocks:{$store:{state:{Login:{token:''}}},$route:{query:{redirect}},$router:{push,replace:vi.fn()}},stubs:{RouterLink:{name:'RouterLink',props:['to'],template:'<a><slot /></a>'}}}});
  await wrapper.setData({username:'new-member',password:'password123',checkedPassword:'password123'});
  await wrapper.setData({checkedUsername:true});
  wrapper.vm.registerAccount();await flushPromises();
  expect(push).toHaveBeenCalledWith({path:'/login',query:{redirect}});
});
