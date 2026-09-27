import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import AdminAnnouncementReports from '@/views/admin/AdminAnnouncementReports.vue';
vi.mock('axios');
afterEach(() => vi.clearAllMocks());
it('미처리 제보를 보고 처리 내용을 저장한 뒤 목록을 갱신한다', async () => {
  axios.get.mockResolvedValueOnce({ data: { content: [{ id: 7, announcementId: 1, title: '채용', message: '마감됨', reporter: 'member', createdAt: '2026-09-01T12:00' }], last: true, number: 0 } }).mockResolvedValue({ data: { content: [], last: true, number: 0 } });
  axios.patch.mockResolvedValue({ data: {} });
  const wrapper = mount(AdminAnnouncementReports, { global: { stubs: { RouterLink: true } } });
  await flushPromises(); expect(wrapper.text()).toContain('마감됨');
  await wrapper.get('[aria-label="제보 처리 내용"]').setValue('원문 확인 후 마감 처리');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch).toHaveBeenCalledWith('/api/admin/announcement-reports/7', { note: '원문 확인 후 마감 처리' });
  expect(wrapper.text()).toContain('미처리 제보가 없습니다');
  wrapper.unmount();
});
