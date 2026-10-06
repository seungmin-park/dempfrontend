import { onBeforeUnmount, readonly, ref, watch } from 'vue';
import { createAnswer, getAnswers } from '@/api/answers';
import { renderMarkdown } from '@/content/markdown';
import { mutationErrorMessage, requestErrorMessage } from '@/presentation/requestError';
import type { Answer, EntityId } from '@/types/api';

interface AnswerProps { questionId: EntityId; username: string }

export function useQuestionAnswers(props: AnswerProps) {
  const answers = ref<Answer[]>([]);
  const body = ref('');
  const nextCursor = ref<string | null>(null);
  const hasNext = ref(false);
  const loading = ref(true);
  const loadingMore = ref(false);
  const saving = ref(false);
  const loadError = ref('');
  const moreError = ref('');
  const saveError = ref('');
  let generation = 0;
  let disposed = false;
  const isCurrent = (requestGeneration: number) => !disposed && requestGeneration === generation;

  function setBody(value: string) { body.value = value; }

  async function loadInitial() {
    if (disposed) return;
    const requestGeneration = ++generation;
    loading.value = true;
    loadingMore.value = false;
    saving.value = false;
    loadError.value = '';
    try {
      const response = await getAnswers(props.questionId);
      if (!isCurrent(requestGeneration)) return;
      answers.value = response.data.content;
      nextCursor.value = response.data.nextCursor;
      hasNext.value = response.data.hasNext;
    } catch (error) {
      if (isCurrent(requestGeneration)) loadError.value = requestErrorMessage(error);
    } finally {
      if (isCurrent(requestGeneration)) loading.value = false;
    }
  }

  async function loadMore() {
    if (disposed || loading.value || loadingMore.value || !hasNext.value || nextCursor.value === null) return;
    const requestGeneration = generation;
    const cursor = nextCursor.value;
    loadingMore.value = true;
    moreError.value = '';
    try {
      const response = await getAnswers(props.questionId, cursor);
      if (!isCurrent(requestGeneration)) return;
      const existingIds = new Set(answers.value.map(answer => answer.answerId));
      const added = response.data.content.filter(answer => {
        if (existingIds.has(answer.answerId)) return false;
        existingIds.add(answer.answerId);
        return true;
      });
      answers.value = [...answers.value, ...added];
      nextCursor.value = response.data.nextCursor;
      hasNext.value = response.data.hasNext;
    } catch (error) {
      if (isCurrent(requestGeneration)) moreError.value = requestErrorMessage(error);
    } finally {
      if (isCurrent(requestGeneration)) loadingMore.value = false;
    }
  }

  async function submitAnswer() {
    if (disposed || loading.value || saving.value) return;
    const requestGeneration = generation;
    const submittedBody = body.value;
    saving.value = true;
    saveError.value = '';
    try {
      const response = await createAnswer({ username: props.username, questionId: props.questionId, answerContent: renderMarkdown(submittedBody) });
      if (!isCurrent(requestGeneration)) return;
      const created = answers.value.find(answer => answer.answerId === response.data.answerId) ?? response.data;
      answers.value = [created, ...answers.value.filter(answer => answer.answerId !== created.answerId)];
      if (body.value === submittedBody) body.value = '';
    } catch (error) {
      if (isCurrent(requestGeneration)) saveError.value = mutationErrorMessage(error);
    } finally {
      if (isCurrent(requestGeneration)) saving.value = false;
    }
  }

  watch(() => props.questionId, () => {
    answers.value = [];
    body.value = '';
    nextCursor.value = null;
    hasNext.value = false;
    moreError.value = '';
    saveError.value = '';
    void loadInitial();
  }, { immediate: true });
  onBeforeUnmount(() => { disposed = true; generation++; });

  return {
    answers: readonly(answers), body: readonly(body), nextCursor: readonly(nextCursor), hasNext: readonly(hasNext),
    loading: readonly(loading), loadingMore: readonly(loadingMore), saving: readonly(saving),
    loadError: readonly(loadError), moreError: readonly(moreError), saveError: readonly(saveError),
    setBody, loadInitial, loadMore, submitAnswer,
  };
}
