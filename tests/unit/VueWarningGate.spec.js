import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { createVueWarningGate } from '../support/vue-warning-gate';

test('실제 잘못된 prop의 Vue 경고는 assertion이 통과해도 검증 실패다', () => {
  const gate = createVueWarningGate();
  const component = defineComponent({ props: { count: { type: Number, required: true } }, template: '<p>{{ count }}</p>' });
  const wrapper = mount(component, { props: { count: 'invalid' }, global: { config: { warnHandler: gate.record } } });
  expect(wrapper.text()).toBe('invalid');
  expect(() => gate.verify()).toThrow(/Invalid prop/);
});
test('Vue 경고가 없는 유효한 렌더링을 허용한다', () => {
  const gate = createVueWarningGate();
  mount(defineComponent({ template: '<p>valid</p>' }), { global: { config: { warnHandler: gate.record } } });
  expect(() => gate.verify()).not.toThrow();
});
