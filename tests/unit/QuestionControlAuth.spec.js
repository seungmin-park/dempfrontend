import { vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import QuestionControl from '@/components/question/QuestionControl.vue';
import { getQuestionHashtags } from '@/api/questions';

vi.mock('@/api/questions', () => ({ getQuestionHashtags: vi.fn() }));

test('비로그인 질문하기는 alert 없이 작성 경로로 이동해 로그인 후 이어간다', async () => {
  getQuestionHashtags.mockResolvedValue({ data: [] });
  const push = vi.fn();
  const alert = vi.fn();
  vi.stubGlobal('alert', alert);
  const wrapper = mount(QuestionControl, { global: { mocks: {
    $route: { query: {} }, $router: { push }, $store: { state: { Login: { token: '' } } },
  } } });
  await flushPromises();
  await wrapper.get('.question-control-btn').trigger('click');
  expect(push).toHaveBeenCalledWith('/questions/new');
  expect(alert).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});
