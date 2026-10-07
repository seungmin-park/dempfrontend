import { flushPromises, mount } from '@vue/test-utils';
import Hashtags from '@/components/Hashtags.vue';

test('태그 입력창을 열어 입력한 태그를 부모에게 보낸다', async () => {
  const wrapper = mount(Hashtags, { props: { placeholder: '#태그' } });
  await wrapper.get('.comp_hashtag').trigger('click');
  await flushPromises();
  expect(wrapper.find('.help').exists()).toBe(false);
  await wrapper.get('.inp input').setValue('JAVA');
  await wrapper.get('.inp input').trigger('keydown.enter');
  await flushPromises();
  expect(wrapper.emitted('addHashtags').at(-1)[0]).toEqual([{ value: 'JAVA', select: false }]);
});

test('편집할 기존 태그를 표시하고 삭제한 결과를 부모에게 보낸다', async () => {
  const wrapper = mount(Hashtags, { props: { initialTags: ['Docker', 'JAVA'] } });
  expect(wrapper.findAll('.tag').map(tag => tag.text())).toEqual(['#Docker', '#JAVA']);
  await wrapper.get('button[aria-label="Docker 태그 삭제"]').trigger('click');
  expect(wrapper.emitted('addHashtags').at(-1)[0]).toEqual([{ value: 'JAVA', select: false }]);
});

test('중복 태그 오류를 입력창과 연결하여 알리고 입력 중 오류를 해제한다', async () => {
  const wrapper = mount(Hashtags);
  await wrapper.get('.comp_hashtag').trigger('click');
  await wrapper.get('input[aria-label="태그 입력"]').setValue('Docker');
  await wrapper.get('input[aria-label="태그 입력"]').trigger('keydown.enter');
  await wrapper.get('input[aria-label="태그 입력"]').setValue('Docker');
  await wrapper.get('input[aria-label="태그 입력"]').trigger('keydown.enter');
  const error = wrapper.get('[role="alert"]');
  expect(error.text()).toContain('중복');
  expect(wrapper.get('input[aria-label="태그 입력"]').attributes('aria-describedby')).toBe(error.attributes('id'));
  expect(wrapper.get('input[aria-label="태그 입력"]').attributes('aria-invalid')).toBe('true');
  await wrapper.get('input[aria-label="태그 입력"]').setValue('Spring');
  expect(wrapper.find('[role="alert"]').exists()).toBe(false);
});

test('저장 중 비활성 상태에서는 태그를 추가하거나 삭제하지 않는다', async () => {
  const wrapper = mount(Hashtags, { props: { initialTags: ['JAVA'], disabled: true } });
  expect(wrapper.get('input[aria-label="태그 입력"]').element.disabled).toBe(true);
  expect(wrapper.get('button[aria-label="JAVA 태그 삭제"]').element.disabled).toBe(true);
});
