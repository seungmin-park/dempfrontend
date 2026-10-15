import { defineComponent, h, reactive } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useAnnouncementBookmarks } from '@/composables/useAnnouncementBookmarks';
import { useSavedAnnouncements } from '@/composables/useSavedAnnouncements';
import axios from 'axios';
vi.mock('axios');
beforeEach(()=>{axios.get.mockReset();axios.put.mockReset();});
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
async function harness(props={}) {
 const context=reactive({ids:[71],token:'token',username:'member',...props});let state;
 const login=vi.fn(),consume=vi.fn();
 const wrapper=mount(defineComponent({setup(){state=useAnnouncementBookmarks(context,login,consume);return()=>h('div');}}));
 await flushPromises();return {state,context,wrapper,consume};
}
test('로그인 복귀 후 첫 페이지에 없는 저장 대상도 한 번 저장한다',async()=>{
 axios.get.mockResolvedValue({data:{savedIds:[]}});axios.put.mockResolvedValue({data:{announcementId:99,saved:true}});
 const {state,consume}=await harness({intentId:'99'});
 expect(axios.put).toHaveBeenCalledWith('/api/member/me/bookmarks/99',{saved:true});
 expect(state.saved(99)).toBe(true);expect(consume).toHaveBeenCalledTimes(1);
});
test('저장 연타는 한 요청이며 계정 변경과 화면 종료 뒤 응답은 버린다',async()=>{
 axios.get.mockResolvedValue({data:{savedIds:[]}});
 const {state,context,wrapper}=await harness();const slow=deferred();axios.put.mockReturnValue(slow.promise);
 const request=state.toggle(71);await state.toggle(71);expect(axios.put).toHaveBeenCalledTimes(1);
 context.username='another';context.token='another-token';await flushPromises();
 slow.resolve({data:{announcementId:71,saved:true}});await request;expect(state.saved(71)).toBe(false);
 const next=deferred();axios.put.mockReturnValue(next.promise);const pending=state.toggle(71);wrapper.unmount();
 next.resolve({data:{announcementId:71,saved:true}});await pending;expect(state.saved(71)).toBe(false);
});
test('늦은 상태 조회는 그 사이 완료된 저장을 덮지 않는다',async()=>{
 axios.get.mockResolvedValue({data:{savedIds:[]}});const {state}=await harness();const slow=deferred();axios.get.mockReturnValue(slow.promise);
 const lookup=state.load();axios.put.mockResolvedValue({data:{announcementId:71,saved:true}});await state.toggle(71);
 slow.resolve({data:{savedIds:[]}});await lookup;expect(state.saved(71)).toBe(true);
});
test('저장 상태 조회 실패는 선택을 막고 재조회 후 같은 화면에서 저장할 수 있다',async()=>{
 axios.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({data:{savedIds:[]}});
 const {state}=await harness();expect(state.enabled(71)).toBe(false);expect(state.loadError.value).toContain('다시');
 await state.load();expect(state.enabled(71)).toBe(true);expect(state.loadError.value).toBe('');
});
test('내 목록 해제 뒤 재조회 중 중복 해제와 더보기는 동시에 실행되지 않는다',async()=>{
 const entry={announcementId:71,available:false,announcement:null};
 axios.get.mockResolvedValueOnce({data:{content:[entry],hasNext:true,number:0}});
 let state;const auth=reactive({token:'token',username:'member'});
 mount(defineComponent({setup(){state=useSavedAnnouncements(()=>auth.token,()=>auth.username);return()=>h('div');}}));await flushPromises();
 axios.put.mockResolvedValue({data:{announcementId:71,saved:false}});const refresh=deferred();axios.get.mockReturnValue(refresh.promise);
 const remove=state.remove(71);await flushPromises();expect(state.loading.value).toBe(true);
 await state.loadMore();await state.remove(71);expect(axios.put).toHaveBeenCalledTimes(1);expect(axios.get).toHaveBeenCalledTimes(2);
 refresh.resolve({data:{content:[],hasNext:false,number:0}});await remove;expect(state.entries.value).toEqual([]);expect(state.loading.value).toBe(false);
});

test('저장 중 시작된 상태 조회가 저장 완료 뒤 도착해도 이전 상태로 돌아가지 않는다',async()=>{
 axios.get.mockResolvedValue({data:{savedIds:[]}});const {state}=await harness();const save=deferred(),lookup=deferred();
 axios.put.mockReturnValue(save.promise);const saving=state.toggle(71);axios.get.mockReturnValue(lookup.promise);const loading=state.load();
 save.resolve({data:{announcementId:71,saved:true}});await saving;lookup.resolve({data:{savedIds:[]}});await loading;
 expect(state.saved(71)).toBe(true);
});


test('복귀 저장 의도는 실패하면 소비하지 않고 재시도 성공 후에만 소비한다',async()=>{
 axios.get.mockResolvedValue({data:{savedIds:[]}});axios.put.mockRejectedValueOnce(new Error('expired')).mockResolvedValue({data:{announcementId:99,saved:true}});
 const {state,consume}=await harness({intentId:'99'});expect(consume).not.toHaveBeenCalled();expect(state.resumeError.value).toContain('다시');
 await state.resumeSave();expect(consume).toHaveBeenCalledTimes(1);expect(state.saved(99)).toBe(true);
});


test('로컬 예제의 음수 ID도 로그인 복귀 저장 대상이면 자동 저장한다',async()=>{
 axios.get.mockResolvedValue({data:{savedIds:[]}});axios.put.mockResolvedValue({data:{announcementId:-1,saved:true}});
 const {state}=await harness({ids:[-1],intentId:'-1'});expect(state.saved(-1)).toBe(true);
});
