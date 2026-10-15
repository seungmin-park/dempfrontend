import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import axios from 'axios';
import AdminAnnouncements from '@/views/admin/AdminAnnouncements.vue';
vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); });
const response = (id, title) => ({ data: { content: [{ id, title, language: [], company: 'DEMP' }], last: true } });
async function setup() {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/admin/announcements', component: AdminAnnouncements }, { path: '/:pathMatch(.*)*', component: { template: '<div />' } }] });
  await router.push('/admin/announcements?q=은행&type=EMP&publicationStatus=DRAFT&page=2');
  await router.isReady();
  const wrapper = mount(AdminAnnouncements, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}
it('공고 종류 선택만으로 첫 페이지를 조회하고 검색어와 게시 상태를 유지한다', async () => {
  axios.get.mockResolvedValueOnce(response(1, '이전 공고')).mockResolvedValueOnce(response(2, '교육 결과'));
  const { wrapper, router } = await setup();
  await wrapper.get('[aria-label="공고 종류"]').setValue('EDU'); await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ q: '은행', type: 'EDU', publicationStatus: 'DRAFT', page: '0' });
  expect(axios.get).toHaveBeenLastCalledWith('/api/admin/announcements', { params: { title: '은행', announcementType: 'EDU', publicationStatus: 'DRAFT', page: 0 } });
  expect(wrapper.text()).toContain('교육 결과'); expect(wrapper.text()).not.toContain('이전 공고');
  wrapper.unmount();
});
it('게시 상태를 연속 변경해도 늦게 도착한 이전 결과가 마지막 선택을 덮지 않는다', async () => {
  let finishOld;
  axios.get.mockResolvedValueOnce(response(1, '초기 결과'))
    .mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
    .mockResolvedValueOnce(response(3, '최종 결과'));
  const { wrapper } = await setup();
  await wrapper.get('[aria-label="게시 상태 필터"]').setValue('PUBLISHED'); await flushPromises();
  await wrapper.get('[aria-label="게시 상태 필터"]').setValue('HIDDEN'); await flushPromises();
  expect(wrapper.text()).toContain('최종 결과');
  finishOld(response(2, '오래된 결과')); await flushPromises();
  expect(wrapper.text()).toContain('최종 결과'); expect(wrapper.text()).not.toContain('오래된 결과');
  expect(wrapper.get('[aria-label="게시 상태 필터"]').element.value).toBe('HIDDEN');
  wrapper.unmount();
});
