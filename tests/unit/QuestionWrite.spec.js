import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionWrite from '@/components/question/QuestionWrite.vue';

vi.mock('axios');

beforeEach(() => {
  global.$ = vi.fn(() => ({ summernote: vi.fn((action) => action === 'code' ? '<p>본문</p>' : undefined) }));
});
afterEach(() => vi.clearAllMocks());

test('실패한 질문을 같은 태그로 재제출해도 요청마다 태그가 한 번만 들어간다', async () => {
  axios.post.mockRejectedValueOnce(new Error('server')).mockResolvedValueOnce({ data: {} });
  const wrapper = mount(QuestionWrite, { global: {
    stubs: { RouterLink: true, hashtags: { template: '<button type="button" data-test="tags" @click="$emit(\'addHashtags\', [{ value: \'JAVA\' }])">태그 추가</button>' } },
    mocks: {
      $store: { state: { Login: { token: 'token', username: 'member' } } },
      $router: { push: vi.fn(), replace: vi.fn(), currentRoute: { value: { fullPath: '/question/add' } } },
    },
  } });
  await wrapper.get('#question-title').setValue('질문');
  await wrapper.get('#content').setValue('본문');
  await wrapper.get('[data-test="tags"]').trigger('click');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await wrapper.get('form').trigger('submit');
  await flushPromises();

  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(axios.post.mock.calls[0][1].hashtags).toEqual(['JAVA']);
  expect(axios.post.mock.calls[1][1].hashtags).toEqual(['JAVA']);
});

test('질문은 Markdown을 안전한 HTML로 저장하고 실패하면 입력을 보존하며 안내한다', async () => {
  axios.post.mockRejectedValue(new Error('server'));
  const wrapper = mount(QuestionWrite, { global: { stubs: { RouterLink: true }, mocks: {
    $store: { state: { Login: { token: 'jwt', username: 'member' } } },
    $router: { push: vi.fn(), replace: vi.fn(), currentRoute: { value: { fullPath: '/questions/new' } } },
  } } });
  await wrapper.get('#question-title').setValue('서식 질문');
  await wrapper.get('#content').setValue('## 제목\n\n**강조**<script>evil()</script>');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await vi.waitFor(() => expect(axios.post).toHaveBeenCalled());
  expect(axios.post.mock.calls[0][1].content).toContain('<h2>제목</h2>');
  expect(axios.post.mock.calls[0][1].content).toContain('<strong>강조</strong>');
  expect(axios.post.mock.calls[0][1].content).not.toContain('<script>');
  expect(wrapper.get('[role="alert"]').text()).toContain('저장하지 못했습니다');
  expect(wrapper.get('#content').element.value).toContain('## 제목');
});

test('질문 저장 중에는 중복 제출을 막는다', async () => {
  let resolveRequest;
  axios.post.mockImplementation(() => new Promise(resolve => { resolveRequest = resolve; }));
  const wrapper = mount(QuestionWrite, { global: { stubs: { RouterLink: true }, mocks: {
    $store: { state: { Login: { token: 'jwt', username: 'member' } } },
    $router: { push: vi.fn(), replace: vi.fn() },
  } } });
  await wrapper.get('#question-title').setValue('질문');
  await wrapper.get('#content').setValue('본문');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
  expect(wrapper.get('input[aria-label="태그 입력"]').element.disabled).toBe(true);
  resolveRequest({ data: 'ok' });
  await flushPromises();
});

async function editPage(owner = 'member') {
  axios.get.mockResolvedValue({ data: { id: 7, title: '기존 질문', content: '<h2>기존 제목</h2><p><u>밑줄</u></p>', username: owner, hashtags: ['Docker'], hits: 2, recommend: 1, dislike: 0 } });
  const push = vi.fn();
  const wrapper = mount(QuestionWrite, { props: { questionId: '7' }, global: { stubs: { RouterLink: true }, mocks: {
    $store: { state: { Login: { token: 'jwt', username: 'member' } } }, $router: { push, replace: vi.fn() },
  } } });
  await flushPromises();
  return { wrapper, push };
}

test('본인 질문의 제목 본문 태그를 복원하고 작성자 변경 없이 편집 API로 저장한다', async () => {
  axios.patch.mockResolvedValue({ data: {} });
  const { wrapper, push } = await editPage();
  expect(wrapper.get('#question-title').element.value).toBe('기존 질문');
  expect(wrapper.get('#content').element.value).toContain('## 기존 제목');
  expect(wrapper.get('.tag').text()).toBe('#Docker');
  await wrapper.get('#content').setValue('## 수정 제목\n\n<u>밑줄</u>');
  await wrapper.get('input[aria-label="태그 입력"]').setValue('JAVA');
  await wrapper.get('input[aria-label="태그 입력"]').trigger('keydown.enter');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  await vi.waitFor(() => expect(axios.patch).toHaveBeenCalled());
  const [url, payload] = axios.patch.mock.calls[0];
  expect(url).toBe('/api/question/update');
  expect(payload).toEqual({ questionId: '7', title: '기존 질문', content: expect.stringContaining('<h2>수정 제목</h2>'), hashtags: ['Docker', 'JAVA'] });
  expect(payload.content).toContain('<u>밑줄</u>');
  expect(push).toHaveBeenCalledWith('/questions/7');
});

test('편집 저장의 403도 입력을 보존하고 성공 이동이나 중복 제출을 하지 않는다', async () => {
  let reject;
  axios.patch.mockImplementation(() => new Promise((resolve, failure) => { reject = failure; }));
  const { wrapper, push } = await editPage();
  await wrapper.get('#question-title').setValue('수정한 질문');
  await wrapper.get('#content').setValue('작성 중인 본문');
  await wrapper.get('form').trigger('submit'); await flushPromises();
  await wrapper.get('form').trigger('submit'); await flushPromises();
  expect(axios.patch).toHaveBeenCalledTimes(1);
  expect(wrapper.get('input[aria-label="태그 입력"]').element.disabled).toBe(true);
  reject({ response: { status: 403 } }); await flushPromises();
  expect(wrapper.get('[role="alert"]').text()).toContain('권한');
  expect(wrapper.get('#question-title').element.value).toBe('수정한 질문');
  expect(wrapper.get('#content').element.value).toBe('작성 중인 본문');
  expect(wrapper.get('.tag').text()).toBe('#Docker');
  expect(push).not.toHaveBeenCalled();
});

test('타인 질문의 편집 URL을 직접 열어도 편집 폼을 표시하지 않는다', async () => {
  const { wrapper } = await editPage('another-member');
  expect(wrapper.find('form').exists()).toBe(false);
  expect(wrapper.get('[role="alert"]').text()).toContain('본인');
});

const nextQuestion = { id: 8, title: '다음 질문', content: '<p>다음 본문</p>', username: 'member', hashtags: ['SPRING'], hits: 0, recommend: 0, dislike: 0 };

test('이전 질문 조회가 늦게 도착해도 이동한 질문의 입력을 덮어쓰지 않는다', async () => {
  let finish;
  axios.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const { wrapper } = await editPage();
  axios.get.mockResolvedValueOnce({ data: nextQuestion });
  await wrapper.setProps({ questionId: '8' }); await flushPromises();
  expect(wrapper.get('#question-title').element.value).toBe('다음 질문');
  finish({ data: { ...nextQuestion, id: 7, title: '이전 질문', hashtags: ['Docker'] } }); await flushPromises();
  expect(wrapper.get('#question-title').element.value).toBe('다음 질문');
  expect(wrapper.get('.tag').text()).toBe('#SPRING');
});

test('이전 질문의 저장이 늦게 끝나도 이동한 편집 화면에서 이전 상세로 보내지 않는다', async () => {
  let finish;
  axios.patch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const { wrapper, push } = await editPage();
  await wrapper.get('form').trigger('submit'); await flushPromises();
  axios.get.mockResolvedValueOnce({ data: nextQuestion });
  await wrapper.setProps({ questionId: '8' }); await flushPromises();
  finish({ data: {} }); await flushPromises();
  expect(push).not.toHaveBeenCalled();
  expect(wrapper.get('#question-title').element.value).toBe('다음 질문');
  expect(wrapper.get('button[type="submit"]').element.disabled).toBe(false);
});
