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
