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

function report(id) {
  return { id, announcementId: id, title: `채용 ${id}`, message: '마감일 확인 요청', reporter: 'member', createdAt: '2026-09-01T12:00' };
}
async function mountReports(items = [report(7)]) {
  axios.get.mockResolvedValue({ data: { content: items, last: true, number: 0 } });
  const wrapper = mount(AdminAnnouncementReports, { attachTo: document.body, global: { stubs: { RouterLink: true } } });
  await flushPromises();
  return wrapper;
}
it('처리 내용이 없으면 해당 제보에만 입력 오류를 연결하고 초점을 이동한다', async () => {
  const wrapper = await mountReports([report(7), report(8)]);
  expect(wrapper.get('form').attributes('novalidate')).toBeDefined();
  await wrapper.get('form').trigger('submit');
  const input = wrapper.get('#resolution-7');
  expect(wrapper.get('[role=alert]').text()).toBe('처리 내용을 입력해 주세요.');
  expect(input.attributes('aria-invalid')).toBe('true');
  expect(wrapper.get('#resolution-8').attributes('aria-invalid')).toBe('false');
  expect(input.attributes('aria-describedby').split(' ')).toContain(wrapper.get('[role=alert]').attributes('id'));
  expect(document.activeElement).toBe(input.element);
  expect(axios.patch).not.toHaveBeenCalled();
  wrapper.unmount();
});
it('처리 입력에는 도움말·글자 수가 있고 긴 내용은 서버로 보내지 않는다', async () => {
  const wrapper = await mountReports();
  expect(wrapper.get('#resolution-7-hint').text()).toContain('원문');
  expect(wrapper.get('#resolution-7').attributes('placeholder')).toContain('예:');
  await wrapper.get('#resolution-7').setValue('가'.repeat(1001));
  expect(wrapper.get('[data-test=resolution-length]').text()).toBe('1,001 / 1,000');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.get('[role=alert]').text()).toBe('처리 내용은 1,000자 이내로 작성해 주세요.');
  expect(axios.patch).not.toHaveBeenCalled();
  wrapper.unmount();
});
it('처리 저장에 실패하면 내용을 유지하고 수정 시 해당 오류를 해제한다', async () => {
  axios.patch.mockRejectedValue({ response: { status: 500 } });
  const wrapper = await mountReports();
  await wrapper.get('#resolution-7').setValue('원문 확인 후 마감 처리');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(wrapper.get('#resolution-7').element.value).toBe('원문 확인 후 마감 처리');
  expect(wrapper.get('[role=alert]').text()).toContain('저장');
  await wrapper.get('#resolution-7').setValue('원문 확인 후 마감일 수정');
  expect(wrapper.find('[role=alert]').exists()).toBe(false);
  wrapper.unmount();
});
