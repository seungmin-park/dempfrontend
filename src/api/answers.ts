import type { Answer, AnswerForm, AnswerPage, EntityId } from '@/types/api';
import { apiClient } from './client';

export function getAnswers(questionId: EntityId, before?: string) {
  const url = `/api/answer/${questionId}`;
  return before === undefined
    ? apiClient.get<AnswerPage>(url)
    : apiClient.get<AnswerPage>(url, { params: { before } });
}

export function createAnswer(form: AnswerForm) {
  return apiClient.post<Answer>('/api/answer/save', form);
}
