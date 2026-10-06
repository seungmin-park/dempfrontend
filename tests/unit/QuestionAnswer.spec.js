import { vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import axios from 'axios';
import QuestionAnswer from '@/components/question/QuestionAnswer.vue';

vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); axios.post.mockReset(); axios.put.mockReset(); });
afterEach(() => vi.clearAllMocks());

test('답변 Markdown 저장 실패는 입력을 보존하고 재시도 성공 시 본문을 비운다', async () => {
  global.$ = () => ({ summernote: vi.fn(() => '<p>이전 입력</p>') });
  axios.get.mockResolvedValue({ data: { content: [], nextCursor: null, hasNext: false } });
  axios.post.mockRejectedValueOnce(new Error('server')).mockResolvedValueOnce({ data: { answerId: '2', username: 'member', content: '<p><strong>답변</strong></p>', recommend: 0, dislike: 0, myReaction: 'NONE' } });
  const wrapper = mount(QuestionAnswer, { props: { questionId: 7, username: 'member' }, global: { mocks: {
    $store: { state: { Login: { token: 'jwt', username: 'member' } } }, $route: { params: { questionId: '7' } },
  } } });
  await flushPromises();
  await wrapper.get('#answer').setValue('**답변**');
  await wrapper.get('button[type="submit"]').trigger('click');
  await flushPromises();
  expect(axios.post.mock.calls[0][1].answerContent).toContain('<strong>답변</strong>');
  expect(wrapper.get('[role="alert"]').text()).toContain('저장하지 못했습니다');
  expect(wrapper.get('#answer').element.value).toBe('**답변**');
  await wrapper.get('button[type="submit"]').trigger('click');
  await flushPromises();
  expect(wrapper.get('#answer').element.value).toBe('');
  expect(wrapper.get('.question-answer').text()).toContain('답변');
});

test('답변 비추천을 답변 전용 경로에 저장하고 내 선택을 표시한다', async () => {
  global.$ = () => ({ summernote: vi.fn() });
  axios.get.mockResolvedValue({ data: { content: [{ answerId: '4', username: 'writer', content: '답변', recommend: 3, dislike: 0, myReaction: 'NONE' }], nextCursor: null, hasNext: false } });
  const wrapper = mount(QuestionAnswer, { props: { questionId: 7, username: 'member' }, global: { mocks: {
    $store: { state: { Login: { token: 'token' } } }, $route: { params: { questionId: 7 } },
  } } });
  await flushPromises();
  axios.put.mockResolvedValue({ data: { recommend: 3, dislike: 1, myReaction: 'DISLIKE' } });
  const buttons = wrapper.findAll('.question-answer-reaction button');
  expect(buttons[0].text()).toContain('3');
  await buttons[1].trigger('click'); await flushPromises();
  expect(axios.put).toHaveBeenCalledWith('/api/answer/4/reaction', { reaction: 'DISLIKE' });
  expect(buttons[1].attributes('aria-pressed')).toBe('true');
  expect(buttons[1].text()).toContain('1');
  delete global.$;
});

const answerRow = id => ({ answerId: String(id), username: 'writer', content: `답변-${id}`, recommend: 0, dislike: 0, myReaction: 'NONE' });
test('Long 범위 문자열 ID의 조회·단건 저장·반응은 서로 다른 답변을 누락하지 않는다', async () => {
  const upper = '9007199254740993', lower = '9007199254740992', created = '9223372036854775807';
  axios.get.mockResolvedValueOnce({ data: { content: [answerRow(upper)], nextCursor: upper, hasNext: true } })
    .mockResolvedValueOnce({ data: { content: [answerRow(lower)], nextCursor: null, hasNext: false } });
  axios.post.mockResolvedValueOnce({ data: answerRow(created) });
  axios.put.mockResolvedValueOnce({ data: { recommend: 0, dislike: 1, myReaction: 'DISLIKE' } });
  const wrapper = mount(QuestionAnswer, { props: { questionId: 7, username: 'member' } });
  await flushPromises();
  await wrapper.find('[data-test="answer-load-more"]').trigger('click');
  await flushPromises();
  expect(axios.get).toHaveBeenLastCalledWith('/api/answer/7', { params: { before: upper } });
  expect(wrapper.findAll('.question-answer').map(article => article.text())).toEqual([
    expect.stringContaining(upper), expect.stringContaining(lower),
  ]);
  await wrapper.find('#answer').setValue('새 답변');
  await wrapper.find('.answer-composer button[type="submit"]').trigger('click');
  await flushPromises();
  const articles = wrapper.findAll('.question-answer');
  expect(articles).toHaveLength(3);
  expect(articles.map(article => article.text())).toEqual([
    expect.stringContaining(created), expect.stringContaining(upper), expect.stringContaining(lower),
  ]);
  await articles[2].find('button[aria-label^="비추천"]').trigger('click');
  await flushPromises();
  expect(axios.put).toHaveBeenCalledWith(`/api/answer/${lower}/reaction`, { reaction: 'DISLIKE' });
  wrapper.unmount();
});
const initialAnswers = () => Array.from({ length: 20 }, (_, index) => answerRow(40 - index));
const page = (content, nextCursor = null) => ({ content, nextCursor, hasNext: nextCursor !== null });
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function mountAnswers(first = page(initialAnswers(), '21')) {
  axios.get.mockResolvedValueOnce({ data: first });
  const wrapper = mount(QuestionAnswer, { props: { questionId: 7, username: 'member' }, global: { mocks: {
    $route: { params: { questionId: '7' } }, $store: { state: { Login: { username: 'member', token: 'jwt' } } },
  } } });
  await flushPromises();
  return wrapper;
}

test('단건 저장은 기존 20개 답변을 보존하고 새 답변만 앞에 추가한다', async () => {
  const wrapper = await mountAnswers();
  expect(wrapper.findAll('.question-answer')).toHaveLength(20);
  axios.post.mockResolvedValue({ data: answerRow(99) });
  await wrapper.get('#answer').setValue('새 답변');
  await wrapper.get('button[type="submit"]').trigger('click');
  await flushPromises();
  expect(wrapper.findAll('.question-answer')).toHaveLength(21);
  expect(wrapper.findAll('.question-answer')[0].text()).toContain('답변-99');
  expect(wrapper.text()).toContain('답변-21');
  expect(wrapper.get('#answer').element.value).toBe('');
  expect(axios.get).toHaveBeenCalledTimes(1);
  axios.get.mockResolvedValue({ data: page([answerRow(20)]) });
  await wrapper.get('[data-test="answer-load-more"]').trigger('click');
  await flushPromises();
  expect(axios.get).toHaveBeenLastCalledWith('/api/answer/7', { params: { before: '21' } });
  expect(wrapper.findAll('.question-answer')).toHaveLength(22);
});

test('더 보기 실패는 목록과 입력을 보존하고 같은 커서로 재시도한다', async () => {
  const wrapper = await mountAnswers();
  await wrapper.get('#answer').setValue('작성 중');
  axios.get.mockRejectedValueOnce({ response: { status: 500 } }).mockResolvedValueOnce({ data: page([answerRow(20)]) });
  await wrapper.get('[data-test="answer-load-more"]').trigger('click');
  await flushPromises();
  expect(wrapper.findAll('.question-answer')).toHaveLength(20);
  expect(wrapper.get('#answer').element.value).toBe('작성 중');
  expect(wrapper.get('[data-test="answer-more-error"]').text()).toContain('불러오지 못했습니다');
  await wrapper.get('[data-test="answer-load-more"]').trigger('click');
  await flushPromises();
  expect(axios.get.mock.calls.slice(1).map(call => call[1].params.before)).toEqual(['21', '21']);
  expect(wrapper.findAll('.question-answer')).toHaveLength(21);
  expect(wrapper.find('[data-test="answer-load-more"]').exists()).toBe(false);
  expect(wrapper.text()).toContain('표시된 답변 21개');
});

test.each(['more', 'save'])('더 보기와 저장의 %s 응답이 늦어도 목록과 새 답변을 모두 보존한다', async slow => {
  const wrapper = await mountAnswers();
  const more = deferred(), save = deferred();
  axios.get.mockReturnValueOnce(more.promise);
  axios.post.mockReturnValueOnce(save.promise);
  await wrapper.get('[data-test="answer-load-more"]').trigger('click');
  await wrapper.get('#answer').setValue('동시 작성');
  expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined();
  await wrapper.get('button[type="submit"]').trigger('click');
  await wrapper.get('[data-test="answer-load-more"]').trigger('click');
  await wrapper.get('button[type="submit"]').trigger('click');
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenCalledTimes(1);
  const finishMore = async () => { more.resolve({ data: page([answerRow(20), answerRow(19)]) }); await flushPromises(); };
  const finishSave = async () => { save.resolve({ data: answerRow(99) }); await flushPromises(); };
  if (slow === 'more') { await finishSave(); await finishMore(); }
  else { await finishMore(); await finishSave(); }
  expect(wrapper.findAll('.question-answer')).toHaveLength(23);
  expect(wrapper.findAll('.question-answer')[0].text()).toContain('답변-99');
  expect(wrapper.text()).toContain('답변-19');
  expect(wrapper.get('#answer').element.value).toBe('');
  expect(wrapper.find('[data-test="answer-load-more"]').exists()).toBe(false);
});

test('추가 페이지의 중복 ID와 오래된 반응이 확정된 화면 반응을 덮지 않는다', async () => {
  const wrapper = await mountAnswers();
  axios.put.mockResolvedValue({ data: { recommend: 1, dislike: 0, myReaction: 'RECOMMEND' } });
  await wrapper.get('.question-answer button').trigger('click');
  await flushPromises();
  axios.get.mockResolvedValue({ data: page([answerRow(40), answerRow(20)]) });
  await wrapper.get('[data-test="answer-load-more"]').trigger('click');
  await flushPromises();
  expect(wrapper.findAll('.question-answer')).toHaveLength(21);
  expect(wrapper.get('.question-answer button').attributes('aria-pressed')).toBe('true');
  expect(wrapper.get('.question-answer button').text()).toContain('1');
});

test('질문 이동 뒤 도착한 이전 추가 조회와 저장 응답을 폐기한다', async () => {
  const wrapper = await mountAnswers();
  const more = deferred(), save = deferred();
  axios.get.mockReturnValueOnce(more.promise).mockResolvedValueOnce({ data: page([answerRow(8)]) });
  axios.post.mockReturnValueOnce(save.promise);
  await wrapper.get('[data-test="answer-load-more"]').trigger('click');
  await wrapper.get('#answer').setValue('이전 입력');
  await wrapper.get('button[type="submit"]').trigger('click');
  await wrapper.setProps({ questionId: 8 });
  await flushPromises();
  await wrapper.get('#answer').setValue('새 질문 입력');
  more.resolve({ data: page([answerRow(20)]) });
  save.resolve({ data: answerRow(99) });
  await flushPromises();
  expect(wrapper.findAll('.question-answer')).toHaveLength(1);
  expect(wrapper.text()).toContain('답변-8');
  expect(wrapper.text()).not.toContain('답변-99');
  expect(wrapper.get('#answer').element.value).toBe('새 질문 입력');
});
