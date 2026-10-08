import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AnnouncementReportForm from '@/components/announcement/AnnouncementReportForm.vue';
import { submitAnnouncementReport } from '@/api/announcementReports';

vi.mock('@/api/announcementReports', () => ({ submitAnnouncementReport: vi.fn() }));
let wrapper;
afterEach(() => { wrapper?.unmount(); vi.resetAllMocks(); });
function openForm() {
  wrapper = mount(AnnouncementReportForm, { props: { id: 71 }, attachTo: document.body });
  wrapper.get('details').element.open = true;
  return wrapper;
}

test('빈 제보는 기본 말풍선 대신 입력과 연결된 오류를 표시하고 입력에 초점을 준다', async () => {
  openForm();
  expect(wrapper.get('form').attributes('novalidate')).toBeDefined();
  await wrapper.get('form').trigger('submit');
  const input = wrapper.get('textarea');
  expect(wrapper.get('[role=alert]').text()).toBe('오류 내용을 입력해 주세요.');
  expect(input.attributes('aria-invalid')).toBe('true');
  expect(input.attributes('aria-describedby').split(' ')).toContain(wrapper.get('[role=alert]').attributes('id'));
  expect(document.activeElement).toBe(input.element);
  expect(submitAnnouncementReport).not.toHaveBeenCalled();
});

test('입력 도움말과 글자 수를 분리하고 공백만 있는 제보도 거부한다', async () => {
  openForm();
  const input = wrapper.get('textarea');
  expect(wrapper.get('#announcement-report-hint').text()).toContain('개인정보');
  expect(input.attributes('placeholder')).toBe('예: 지원 링크가 열리지 않아요.');
  await input.setValue('   ');
  expect(wrapper.get('[data-test=report-length]').text()).toBe('3 / 1,000');
  await wrapper.get('form').trigger('submit');
  expect(wrapper.get('[role=alert]').text()).toContain('입력');
  expect(submitAnnouncementReport).not.toHaveBeenCalled();
});

test('1,000자를 넘는 제보는 API로 보내지 않고 입력 오류를 알린다', async () => {
  openForm();
  await wrapper.get('textarea').setValue('가'.repeat(1001));
  await wrapper.get('form').trigger('submit');
  expect(wrapper.get('[role=alert]').text()).toBe('오류 내용은 1,000자 이내로 작성해 주세요.');
  expect(submitAnnouncementReport).not.toHaveBeenCalled();
});

test('접수 중에는 중복 전송과 입력을 막고 성공하면 내용을 비우고 결과를 안내한다', async () => {
  let resolve;
  submitAnnouncementReport.mockReturnValue(new Promise(done => { resolve = done; }));
  openForm();
  await wrapper.get('textarea').setValue('  원문 링크가 변경되었습니다  ');
  await wrapper.get('form').trigger('submit');
  await wrapper.get('form').trigger('submit');
  expect(submitAnnouncementReport).toHaveBeenCalledExactlyOnceWith(71, '원문 링크가 변경되었습니다');
  expect(wrapper.get('textarea').element.disabled).toBe(true);
  expect(wrapper.get('button').element.disabled).toBe(true);
  resolve(); await flushPromises();
  expect(wrapper.get('textarea').element.value).toBe('');
  expect(wrapper.get('[role=status]').text()).toContain('제보가 접수되었습니다');
  expect(wrapper.get('textarea').attributes('aria-invalid')).toBe('false');
});

test('서버 오류가 나면 작성 내용을 유지하고 재입력 시 오래된 오류 표시를 해제한다', async () => {
  submitAnnouncementReport.mockRejectedValue(new Error('서버 오류'));
  openForm();
  await wrapper.get('textarea').setValue('마감일이 다릅니다');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(wrapper.get('textarea').element.value).toBe('마감일이 다릅니다');
  expect(wrapper.get('[role=alert]').text()).toBeTruthy();
  await wrapper.get('textarea').setValue('마감일이 10월 31일입니다');
  expect(wrapper.find('[role=alert]').exists()).toBe(false);
});
