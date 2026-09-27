import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionDetail from '@/components/question/QuestionDetail.vue';

vi.mock('axios');

test('서버의 추천 수를 표시하고 미완성 반응은 저장 불가로 안내한다', async () => {
  axios.get.mockResolvedValue({ data: { id: 7, title: '질문', content: '본문', recommend: 3, dislike: 1, hashtags: [] } });
  const wrapper = mount(QuestionDetail, { global: { mocks: {
    $store: { state: { Login: { token: 'token', username: 'member' } } },
    $route: { params: { questionId: 7 } },
    $router: { replace: vi.fn(), currentRoute: { value: { fullPath: '/questions/7' } } },
  } } });
  await flushPromises();
  const buttons = wrapper.findAll('.content-reactions button');
  expect(buttons[0].text()).toContain('3');
  expect(buttons[0].attributes('disabled')).toBeDefined();
  expect(buttons[1].attributes('disabled')).toBeDefined();
  expect(wrapper.text()).toContain('반응 저장 기능 준비 중');
  await buttons[0].trigger('click');
  expect(buttons[0].text()).toContain('3');
});
