import { mount } from '@vue/test-utils';
import QuestionSearch from '@/components/question/QuestionSearch.vue';

test('제목 검색 다음 내용 검색은 제목 조건을 비운다', async () => {
  const push = jest.fn();
  const wrapper = mount(QuestionSearch, { global: { mocks: {
    $router: { push }, $route: { query: { orderBy: 'hits', hashtags: 'JAVA' } },
  } } });
  await wrapper.get('input').setValue('옛 제목');
  await wrapper.get('button').trigger('click');
  await wrapper.get('select').setValue('content');
  await wrapper.get('input').setValue('새 내용');
  await wrapper.get('button').trigger('click');

  expect(push).toHaveBeenLastCalledWith({ path: '/question', query: {
    orderBy: 'hits', hashtags: 'JAVA', title: '', content: '새 내용',
  } });
});
