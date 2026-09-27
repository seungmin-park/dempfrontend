import { vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import QuestionDetail from '@/components/question/QuestionDetail.vue';
import QuestionAnswer from '@/components/question/QuestionAnswer.vue';
import AnnouncementDetail from '@/components/announcement/AnnouncementDetail.vue';

vi.mock('axios');
afterEach(() => { delete global.$; });

const pages = [
  ['질문', QuestionDetail, '.article-content'],
  ['답변', QuestionAnswer, '.answer-content'],
  ['공고', AnnouncementDetail, '.detail-announce-content'],
];

test.each(pages)('%s의 기존 HTML에서 실행 가능한 요소와 속성을 제거하고 서식을 보존한다', async (name, component, selector) => {
  const content = '<p style="color:red" onclick="alert(1)"><strong>안전한 강조</strong><em>기울임</em></p><ul><li>목록</li></ul><script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">위험 링크</a><a href="/question/1">내부 링크</a>';
  const record = { id: 1, content, company: { name: '회사' } };
  axios.get.mockResolvedValue({ data: name === '답변' ? [{ ...record, answerId: 1 }] : record });
  global.$ = () => ({ summernote: vi.fn() });
  const wrapper = mount(component, { global: {
    mocks: { $store: { state: { Login: { token: 'token' } } }, $route: { params: { questionId: 1, itemId: 1 } } },
    stubs: { RouterLink: true },
  } });
  await flushPromises();
  const rendered = wrapper.get(selector);
  expect(rendered.find('script, img, [onclick], [onerror], [style]').exists()).toBe(false);
  expect(rendered.get('strong').text()).toBe('안전한 강조');
  expect(rendered.get('em').text()).toBe('기울임');
  expect(rendered.get('li').text()).toBe('목록');
  expect(rendered.findAll('a')[0].attributes('href')).toBeUndefined();
  expect(rendered.findAll('a')[1].attributes('href')).toBe('/question/1');
});
