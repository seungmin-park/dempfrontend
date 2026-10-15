import { recruitmentState } from '@/presentation/recruitment';
import { toAnnouncementFormData } from '@/api/announcements';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AdminEditor from '@/views/admin/AdminAnnouncementEditor.vue';
vi.mock('axios');
afterEach(()=>vi.clearAllMocks());
test.each(['UNTIL_FILLED','ALWAYS_OPEN'])('%s는 날짜를 만들지 않고 모집 중으로 표시하며 수동 종료가 우선한다', mode=>{
  const period={startedDate:'2026-01-01T09:00:00',deadLineDate:null,deadlineMode:mode};
  expect(recruitmentState(period,Date.parse('2026-10-15T12:00:00+09:00'))).toBe('OPEN');
  expect(recruitmentState({...period,recruitmentClosed:true},Date.parse('2026-10-15T12:00:00+09:00'))).toBe('CLOSED');
  expect(recruitmentState({...period,startedDate:'2026-11-01T09:00:00'},Date.parse('2026-10-15T12:00:00+09:00'))).toBe('UPCOMING');
});
test('날짜가 없는 미확인은 상시 모집이나 모집 중으로 해석하지 않는다',()=>{
  expect(recruitmentState({startedDate:'2026-01-01T00:00:00',deadlineMode:'UNKNOWN'},Date.now())).toBe('UNKNOWN');
});
test('마감 방식은 빈 날짜를 보존한 채 multipart 계약으로 전달한다',()=>{
  const data=toAnnouncementFormData({type:'EMP',title:'수시 채용',deadlineMode:'UNTIL_FILLED',startedDate:'2026-01-01T09:00:00',deadLineDate:null,language:[]});
  expect(data.get('deadlineMode')).toBe('UNTIL_FILLED'); expect(data.has('deadLineDate')).toBe(false);
});
test('관리자는 채용 시 마감을 선택하여 정확한 시작과 함께 공개하고 날짜를 추정하지 않는다',async()=>{
  axios.post.mockResolvedValue({data:{}});
  const push=vi.fn();
  const wrapper=mount(AdminEditor,{global:{mocks:{$route:{params:{}},$router:{push}},stubs:{RouterLink:true,AnnouncementBodyEditor:true,TechnologySelector:true}}});
  await flushPromises();
  await wrapper.setData({form:{title:'수시 채용',company:'DEMP',type:'EMP',position:'BACKEND',publicationStatus:'PUBLISHED',deadlineMode:'UNTIL_FILLED',minCareer:0,maxCareer:0,content:'확인된 본문',accessUrl:'https://example.com/jobs/1',startedDate:'2026-01-01T09:00:00',deadLineDate:null,payment:null,language:[],image:null}});
  await wrapper.get('[aria-label="마감 방식"]').setValue('UNTIL_FILLED');
  await wrapper.get('form').trigger('submit');await flushPromises();
  expect(axios.post).toHaveBeenCalled();
  const form=axios.post.mock.calls[0][1];expect(form.get('deadlineMode')).toBe('UNTIL_FILLED');expect(form.has('deadLineDate')).toBe(false);
  expect(push).toHaveBeenCalled();
});
