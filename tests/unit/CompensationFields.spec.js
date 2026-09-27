import { mount } from '@vue/test-utils';
import CompensationFields from '@/components/announcement/CompensationFields.vue';
import { toAnnouncementFormData } from '@/api/announcements';
import { compensationError } from '@/presentation/compensation';
it('교육비 빈 값과 명시적인 무료를 구분하여 전송한다', async () => {
  const wrapper = mount(CompensationFields, { props: { id: 'cost', type: 'EDU', payment: null } });
  expect(wrapper.get('#cost').element.value).toBe('');
  await wrapper.get('#cost').setValue('0');
  expect(wrapper.emitted('update:payment').at(-1)).toEqual([0]);
  await wrapper.get('#cost').setValue('');
  expect(wrapper.emitted('update:payment').at(-1)).toEqual([null]);
  expect(toAnnouncementFormData({ payment: null, language: [] }).has('payment')).toBe(false);
  expect(toAnnouncementFormData({ payment: 0, language: [] }).get('payment')).toBe('0');
});
it('협의 선택은 기존 범위를 지우며 공개 금액은 역전 범위를 거절한다', async () => {
  const wrapper = mount(CompensationFields, { props: { id: 'salary', type: 'EMP', payment: 4000, salaryMax: 6000, salaryStatus: 'DISCLOSED' } });
  await wrapper.get('select').setValue('NEGOTIABLE');
  expect(wrapper.emitted('update:payment')).toEqual([[null]]);
  expect(wrapper.emitted('update:salaryMax')).toEqual([[null]]);
  expect(compensationError({ type: 'EMP', payment: 6000, salaryMax: 4000, salaryStatus: 'DISCLOSED' })).toContain('상한');
});
