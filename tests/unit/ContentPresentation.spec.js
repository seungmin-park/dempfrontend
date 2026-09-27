import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import QuestionDetail from '@/components/question/QuestionDetail.vue';
vi.mock('axios');

it('회원·조회수·추천·비추천을 의미 있는 이름과 통일된 SVG 아이콘으로 표시한다', async () => {
  axios.get.mockResolvedValue({ data: { id: 1, title: '질문', content: '본문', username: 'member', hits: 12, recommend: 3, dislike: 1, hashtags: [] } });
  const wrapper = mount(QuestionDetail, { global: { mocks: {
    $store: { state: { Login: { token: 'jwt' } } }, $route: { params: { questionId: '1' } },
  }, stubs: { RouterLink: true } } });
  await flushPromises();
  for (const label of ['회원 member', '조회수 12', '추천 3', '비추천 1']) {
    expect(wrapper.get(`[aria-label="${label}"]`).find('svg').exists()).toBe(true);
  }
  expect(wrapper.text()).not.toMatch(/[👍👎👁🙋]/u);
});
