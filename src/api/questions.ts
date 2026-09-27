import type { EntityId, QuestionDetail, QuestionForm, QuestionSearchCondition, QuestionSummary, Slice } from '@/types/api';
import { apiClient } from './client';

export function fetchQuestionPage(condition: QuestionSearchCondition) {
  return apiClient.get<Slice<QuestionSummary>>('/api/question', { params: {
    orderBy: condition.orderBy,
    title: condition.title,
    content: condition.content,
    hashtags: condition.hashtags,
    page: condition.page,
    size: condition.size,
  } }).then(response => response.data);
}

export function getQuestionDetail(id: EntityId) {
  return apiClient.get<QuestionDetail>(`/api/question/detail/${id}`);
}

export function getQuestionHashtags() {
  return apiClient.get<string[]>('/api/question/hashtags');
}

export function createQuestion(payload: QuestionForm) {
  return apiClient.post<string>('/api/question/add', payload);
}
