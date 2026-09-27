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
