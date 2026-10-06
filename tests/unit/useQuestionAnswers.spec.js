import { defineComponent, h, reactive } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import axios from 'axios';
import { useQuestionAnswers } from '@/composables/useQuestionAnswers';

vi.mock('axios');
beforeEach(() => { axios.get.mockReset(); axios.post.mockReset(); });
afterEach(() => vi.clearAllMocks());
const row = answerId => ({ answerId: String(answerId), username: 'member', content: `답변-${answerId}`, recommend: 0, dislike: 0, myReaction: 'NONE' });
const initial = () => ({ content: Array.from({ length: 20 }, (_, i) => row(40 - i)), nextCursor: '21', hasNext: true });
const last = () => ({ content: [row(20)], nextCursor: null, hasNext: false });
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function harness() {
  axios.get.mockResolvedValueOnce({ data: initial() });
  const props = reactive({ questionId: 7, username: 'member' });
  let state;
  const wrapper = mount(defineComponent({ setup() { state = useQuestionAnswers(props); return () => h('div'); } }));
  await flushPromises();
  return { wrapper, state, props };
}

test.each(['more', 'save'])('상태 소유자는 %s가 늦게 끝나도 새 답변과 기존 페이지를 보존한다', async slow => {
  const { wrapper, state } = await harness();
  const more = deferred(), save = deferred();
  axios.get.mockReturnValueOnce(more.promise);
  axios.post.mockReturnValueOnce(save.promise);
  const loading = state.loadMore();
  state.setBody('**새 답변**');
  const saving = state.submitAnswer();
  await state.loadMore();
  await state.submitAnswer();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenCalledTimes(1);
  if (slow === 'more') { save.resolve({ data: row(99) }); await saving; more.resolve({ data: last() }); await loading; }
  else { more.resolve({ data: last() }); await loading; save.resolve({ data: row(99) }); await saving; }
  expect(state.answers.value.map(answer => Number(answer.answerId))).toEqual([99, ...Array.from({ length: 20 }, (_, i) => 40 - i), 20]);
  expect(state.body.value).toBe('');
  expect(state.hasNext.value).toBe(false);
  expect(state.nextCursor.value).toBe(null);
  wrapper.unmount();
});

test('질문 이동은 이전 조회와 저장 실패를 버리고 새 입력과 상태를 유지한다', async () => {
  const { wrapper, state, props } = await harness();
  const more = deferred(), save = deferred();
  axios.get.mockReturnValueOnce(more.promise).mockResolvedValueOnce({ data: { content: [row(8)], nextCursor: null, hasNext: false } });
  axios.post.mockReturnValueOnce(save.promise);
  const loading = state.loadMore();
  state.setBody('이전 작성');
  const saving = state.submitAnswer();
  props.questionId = 8;
  await flushPromises();
  state.setBody('새 입력');
  more.reject({ response: { status: 500 } });
  save.reject({ response: { status: 403 } });
  await Promise.all([loading, saving]);
  expect(state.answers.value.map(answer => Number(answer.answerId))).toEqual([8]);
  expect(state.body.value).toBe('새 입력');
  expect(state.moreError.value).toBe('');
  expect(state.saveError.value).toBe('');
  expect(state.loadingMore.value).toBe(false);
  expect(state.saving.value).toBe(false);
  wrapper.unmount();
});

test('unmount 뒤 조회와 저장 응답은 공개 상태를 변경하지 않는다', async () => {
  const { wrapper, state } = await harness();
  const more = deferred(), save = deferred();
  axios.get.mockReturnValueOnce(more.promise);
  axios.post.mockReturnValueOnce(save.promise);
  const loading = state.loadMore();
  state.setBody('보존할 입력');
  const saving = state.submitAnswer();
  wrapper.unmount();
  const before = state.answers.value.map(answer => answer.answerId);
  more.resolve({ data: last() });
  save.resolve({ data: row(99) });
  await Promise.all([loading, saving]);
  expect(state.answers.value.map(answer => answer.answerId)).toEqual(before);
  expect(state.body.value).toBe('보존할 입력');
});

test('저장 실패는 입력을 유지하고 인증 오류와 서버 오류를 구분한다', async () => {
  const { wrapper, state } = await harness();
  state.setBody('입력 유지');
  axios.post.mockRejectedValueOnce({ response: { status: 401 } }).mockRejectedValueOnce({ response: { status: 500 } });
  await state.submitAnswer();
  expect(state.saveError.value).toContain('로그인이 필요');
  expect(state.body.value).toBe('입력 유지');
  await state.submitAnswer();
  expect(state.saveError.value).toContain('저장하지 못했습니다');
  expect(state.body.value).toBe('입력 유지');
  expect(state.answers.value).toHaveLength(20);
  wrapper.unmount();
});
