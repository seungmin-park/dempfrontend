import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AnnouncementHeader from '@/components/announcement/AnnouncementHeader.vue';

const hosts = [];
afterEach(() => { for (const host of hosts.splice(0)) host.remove(); });
async function setup(url = '/?type=EMP') {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
  await router.push(url); await router.isReady();
  const host = document.createElement('div'); document.body.append(host); hosts.push(host);
  const wrapper = mount(AnnouncementHeader, { attachTo: host, global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}
const control = (wrapper, label) => {
  const button = wrapper.find(`button[aria-label="${label}"]`);
  expect(button.exists(), `${label}: 열림 상태를 알리는 버튼이어야 한다`).toBe(true);
  return button;
};

it('다른 필터를 열면 이전 패널은 닫히고 선택한 조건은 유지된다', async () => {
  const { wrapper, router } = await setup();
  await control(wrapper, '직무·분야').trigger('click');
  await wrapper.get('input[value="BACKEND"]').setValue(true); await flushPromises();
  expect(router.currentRoute.value.query.positions).toBe('BACKEND');
  await control(wrapper, '기술 스택').trigger('click');
  expect(control(wrapper, '직무·분야').attributes('aria-expanded')).toBe('false');
  expect(control(wrapper, '기술 스택').attributes('aria-expanded')).toBe('true');
  expect(wrapper.findAll('.filter-popover').filter(panel => panel.isVisible())).toHaveLength(1);
  await control(wrapper, '직무·분야').trigger('click');
  expect(wrapper.get('input[value="BACKEND"]').element.checked).toBe(true);
});
it('Esc는 패널을 닫고 그 필터 버튼으로 포커스를 돌린다', async () => {
  const { wrapper } = await setup();
  const button = control(wrapper, '기술 스택'); await button.trigger('click');
  wrapper.get('[aria-label="기술 스택 검색"]').element.focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await flushPromises();
  expect(button.attributes('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(button.element);
});
it('필터 밖 클릭은 닫으며 목록 안의 클릭은 선택 패널을 유지한다', async () => {
  const { wrapper } = await setup();
  await control(wrapper, '기술 스택').trigger('click');
  wrapper.get('input[value="JAVA"]').element.click(); await flushPromises();
  expect(control(wrapper, '기술 스택').attributes('aria-expanded')).toBe('true');
  wrapper.get('[aria-label="공고 검색어"]').element.click(); await flushPromises();
  expect(control(wrapper, '기술 스택').attributes('aria-expanded')).toBe('false');
});
it('기술 검색으로 숨긴 선택은 보존되고 새 기술 선택과 URL에 함께 반영된다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&languages=JAVA');
  await control(wrapper, '기술 스택').trigger('click');
  await wrapper.get('[aria-label="기술 스택 검색"]').setValue('html');
  expect(wrapper.find('input[value="JAVA"]').exists()).toBe(false);
  await wrapper.get('input[value="HTML"]').setValue(true); await flushPromises();
  expect(router.currentRoute.value.query.languages).toBe('JAVA,HTML');
  await wrapper.get('[aria-label="기술 스택 검색"]').setValue('');
  expect(wrapper.get('input[value="JAVA"]').element.checked).toBe(true);
  expect(wrapper.get('input[value="HTML"]').element.checked).toBe(true);
});
it('직무 검색은 한글 이름과 코드로 찾고 빈 검색 결과에도 기존 선택을 지키며 해제할 수 있다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&positions=BACKEND');
  await control(wrapper, '직무·분야').trigger('click');
  await wrapper.get('[aria-label="직무 검색"]').setValue('FRONTEND');
  expect(wrapper.findAll('input[type="checkbox"]').map(input => input.element.value)).toEqual(['FRONTEND']);
  await wrapper.get('[aria-label="직무 검색"]').setValue('백엔드');
  expect(wrapper.get('input[value="BACKEND"]').element.checked).toBe(true);
  await wrapper.get('[aria-label="직무 검색"]').setValue('없는 직무');
  expect(wrapper.get('.filter-popover [role="status"]').text()).toContain('일치하는');
  expect(router.currentRoute.value.query.positions).toBe('BACKEND');
  await wrapper.get('[aria-label="백엔드 조건 해제"]').trigger('click'); await flushPromises();
  expect(router.currentRoute.value.query.positions).toBeUndefined();
});
it('모집 상태 선택은 정확한 URL 값과 요약을 적용하고 패널을 닫는다', async () => {
  const { wrapper, router } = await setup();
  await control(wrapper, '모집 상태').trigger('click');
  const radio = wrapper.get('input[type="radio"][value="OPEN"]');
  radio.element.focus();
  expect(document.activeElement).toBe(radio.element);
  await radio.setValue(true); await flushPromises();
  expect(router.currentRoute.value.query.status).toBe('OPEN');
  expect(wrapper.get('.active-filters').text()).toContain('모집 중');
  expect(control(wrapper, '모집 상태').attributes('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(control(wrapper, '모집 상태').element);
});

it('경력 URL의 20년도 복원하고 직접 연차는 적용할 때만 URL과 요약을 바꾼다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&career=20&q=백엔드');
  await control(wrapper, '내 경력').trigger('click');
  const input = wrapper.get('input[aria-label="경력 연차"]');
  expect(input.element.value).toBe('20');
  await input.setValue('7');
  expect(router.currentRoute.value.query.career).toBe('20');
  expect(wrapper.get('.active-filters').text()).toContain('경력 20년');
  await wrapper.get('.career-form').trigger('submit'); await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EMP', career: '7', q: '백엔드' });
  expect(wrapper.get('.active-filters').text()).toContain('경력 7년');
  expect(control(wrapper, '내 경력').attributes('aria-expanded')).toBe('false');
});
it.each(['', '-1', '1.5', '2147483648'])('유효하지 않은 경력 %s는 오류를 보여 주고 적용된 URL을 유지한다', async value => {
  const { wrapper, router } = await setup('/?type=EMP&career=3');
  await control(wrapper, '내 경력').trigger('click');
  await wrapper.get('input[aria-label="경력 연차"]').setValue(value);
  await wrapper.get('.career-form').trigger('submit'); await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EMP', career: '3' });
  expect(wrapper.get('.career-form [role="alert"]').text()).toContain('정수');
  expect(wrapper.get('input[aria-label="경력 연차"]').attributes('aria-invalid')).toBe('true');
  expect(control(wrapper, '내 경력').attributes('aria-expanded')).toBe('true');
});
it('빠른 경력 선택은 정확한 연차이고 경력 해제는 신입 조건을 만들지 않는다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&languages=JAVA');
  await control(wrapper, '내 경력').trigger('click');
  expect(wrapper.get('.career-quick-values').findAll('button').map(button => button.text())).toEqual(['1년', '3년', '5년', '10년']);
  await wrapper.get('[aria-label="경력 3년 적용"]').trigger('click'); await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EMP', languages: 'JAVA', career: '3' });
  expect(control(wrapper, '내 경력').attributes('aria-expanded')).toBe('false');
  await control(wrapper, '내 경력').trigger('click');
  await wrapper.get('[aria-label="경력 조건 해제"]').trigger('click'); await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EMP', languages: 'JAVA' });
  expect(wrapper.get('#career-filter-value').text()).toBe('조건 없음');
  expect(wrapper.get('.active-filters').text()).not.toContain('신입');
});
it('적용하지 않은 연차는 Esc로 버리고 뒤로 이동한 URL의 연차를 다시 복원한다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&career=3');
  await control(wrapper, '내 경력').trigger('click');
  await wrapper.get('input[aria-label="경력 연차"]').setValue('8');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await flushPromises();
  await control(wrapper, '내 경력').trigger('click');
  expect(wrapper.get('input[aria-label="경력 연차"]').element.value).toBe('3');
  await wrapper.get('[aria-label="경력 5년 적용"]').trigger('click'); await flushPromises();
  router.back(); await vi.waitFor(() => expect(router.currentRoute.value.query.career).toBe('3'));
  await control(wrapper, '내 경력').trigger('click');
  expect(wrapper.get('input[aria-label="경력 연차"]').element.value).toBe('3');
});
it('공고 종류 전환과 전체 초기화는 패널을 닫고 교육 조건은 계속 사용할 수 있다', async () => {
  const { wrapper, router } = await setup('/?type=EMP&career=3&positions=BACKEND');
  await control(wrapper, '직무·분야').trigger('click');
  await wrapper.get('#edu').setValue(true); await flushPromises();
  expect(wrapper.findAll('.filter-popover')).toHaveLength(0);
  expect(wrapper.find('[aria-label="내 경력"]').exists()).toBe(false);
  await wrapper.get('[aria-label="교육비"]').setValue('FREE'); await flushPromises();
  expect(router.currentRoute.value.query).toEqual({ type: 'EDU', positions: 'BACKEND', tuition: 'FREE' });
  await control(wrapper, '직무·분야').trigger('click');
  await wrapper.get('[aria-label="전체 조건 초기화"]').trigger('click'); await flushPromises();
  expect(wrapper.findAll('.filter-popover')).toHaveLength(0);
  expect(router.currentRoute.value.query).toEqual({ type: 'EDU' });
});
it('모바일 필터를 접으면 열려 있던 패널도 닫혀 다시 열 때 남아 있지 않는다', async () => {
  const { wrapper } = await setup();
  await wrapper.get('[aria-label="필터 열기"]').trigger('click');
  await control(wrapper, '직무·분야').trigger('click');
  await wrapper.get('[aria-label="필터 열기"]').trigger('click');
  expect(wrapper.findAll('.filter-popover')).toHaveLength(0);
  await wrapper.get('[aria-label="필터 열기"]').trigger('click');
  expect(control(wrapper, '직무·분야').attributes('aria-expanded')).toBe('false');
});
