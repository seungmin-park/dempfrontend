import { mount, flushPromises } from '@vue/test-utils';
import RecruitmentDateTimeField from '@/components/announcement/RecruitmentDateTimeField.vue';

const mounted = [];
afterEach(() => { for (const { wrapper, host } of mounted.splice(0)) { wrapper.unmount(); host.remove(); } vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function openAt(top, viewportHeight = 1000) {
  vi.stubGlobal('innerHeight', viewportHeight); vi.stubGlobal('innerWidth', 1440);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('recruitment-datetime')) return new DOMRect(0, top, 350, 80);
    if (this.classList.contains('recruitment-calendar')) return new DOMRect(0, 0, 310, 330);
    return new DOMRect();
  });
  const host = document.createElement('div'); document.body.append(host);
  const wrapper = mount(RecruitmentDateTimeField, { attachTo: host, props: { id: 'deadline', label: '모집 마감', modelValue: '2030-11-01T18:30' } });
  mounted.push({ wrapper, host });
  await wrapper.get('button.calendar-trigger').trigger('click'); await flushPromises();
  return wrapper;
}

test('화면 아래 공간이 부족한 달력은 입력 위로 열리고 날짜 선택 시 시·분을 보존한다', async () => {
  const wrapper = await openAt(700);
  expect(wrapper.get('[role=dialog]').attributes('data-placement')).toBe('above');
  await wrapper.get('[data-day="20"]').trigger('click');
  expect(wrapper.emitted('update:modelValue')).toEqual([['2030-11-20T18:30']]);
  expect(wrapper.find('[role=dialog]').exists()).toBe(false);
});

test('여유가 있는 달력은 아래로 열리고 열린 상태의 화면 높이 변경에 위치를 다시 결정한다', async () => {
  const wrapper = await openAt(550);
  expect(wrapper.get('[role=dialog]').attributes('data-placement')).toBe('below');
  vi.stubGlobal('innerHeight', 900); window.dispatchEvent(new Event('resize')); await flushPromises();
  expect(wrapper.get('[role=dialog]').attributes('data-placement')).toBe('above');
});

test('위·아래 모두 좁으면 더 넓은 아래 공간으로 달력 높이를 제한한다', async () => {
  const wrapper = await openAt(200, 500);
  const dialog = wrapper.get('[role=dialog]');
  expect(dialog.attributes('data-placement')).toBe('below');
  expect(dialog.element.style.maxHeight).toBe('204px');
});

test('위·아래 모두 좁고 위가 넓으면 위쪽 실제 공간으로 높이를 제한한다', async () => {
  const wrapper = await openAt(260, 500);
  const dialog = wrapper.get('[role=dialog]');
  expect(dialog.attributes('data-placement')).toBe('above');
  expect(dialog.element.style.maxHeight).toBe('244px');
  await dialog.get('[data-day="20"]').trigger('click');
  expect(wrapper.emitted('update:modelValue')).toEqual([['2030-11-20T18:30']]);
});


test('달력에서 같은 날짜와 다른 날짜를 선택해도 원문의 초를 보존한다', async () => {
  const wrapper = await openAt(100);
  await wrapper.setProps({ modelValue: '2030-11-01T16:59:59' });
  expect(wrapper.get('input[type=time]').element.value).toBe('16:59:59');
  await wrapper.get('[data-day="1"]').trigger('click');
  expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2030-11-01T16:59:59']);
  await wrapper.get('button.calendar-trigger').trigger('click');
  await wrapper.get('[data-day="20"]').trigger('click');
  expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2030-11-20T16:59:59']);
});


test('원문 마감의 59초는 상세 날짜 표시에서도 사라지지 않는다', async () => {
  const { formatRecruitDate } = await import('@/presentation/announcement');
  expect(formatRecruitDate('2030-11-01T16:59:59')).toBe('2030.11.01 16:59:59');
  expect(formatRecruitDate('2030-11-01T17:00:00')).toBe('2030.11.01 17:00');
});

test('날짜와 시각을 따로 입력하고 마감 23:59를 한 번에 적용한다', async () => {
  const wrapper = mount(RecruitmentDateTimeField, { props: { id: 'deadline', label: '모집 마감', modelValue: '2026-09-01T18:30:45', endOfDay: true } });
  await wrapper.get('input[type=time]').setValue('23:59:45');
  expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2026-09-01T23:59:45']);
  await wrapper.get('input[type=date]').setValue('2026-09-02');
  expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2026-09-02T23:59:45']);
  await wrapper.get('[aria-label="모집 마감 23:59로 설정"]').trigger('click');
  expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2026-09-02T23:59:00']);
  wrapper.unmount();
});
test('시각을 먼저 입력해도 날짜 선택 후 보존하고 날짜만으로 임의 시각을 만들지 않는다', async () => {
  const wrapper = mount(RecruitmentDateTimeField, { props: { id: 'deadline', label: '모집 마감', modelValue: null, required: false, endOfDay: true } });
  await wrapper.get('input[type=time]').setValue('23:59');
  expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  await wrapper.get('input[type=date]').setValue('2026-09-01');
  expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2026-09-01T23:59']);
  wrapper.unmount();
});
