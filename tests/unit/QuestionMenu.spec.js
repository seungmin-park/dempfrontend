import { mount } from '@vue/test-utils';
import QuestionMenu from '@/components/question/QuestionMenu.vue';

test('추천 메뉴는 서버 정렬 계약인 recommend를 보낸다', () => {
  const wrapper = mount(QuestionMenu, { global: {
    mocks: { $route: { query: { hashtags: 'JAVA' } } },
    stubs: { RouterLink: { name: 'RouterLink', props: ['to', 'custom'], template: '<slot href="/question" />' } },
  } });
  expect(wrapper.findAllComponents({ name: 'RouterLink' })[2].props('to')).toEqual({
    path: '/question', query: { orderBy: 'recommend', hashtags: 'JAVA' },
  });
});
