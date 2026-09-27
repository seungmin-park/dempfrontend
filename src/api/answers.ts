import type { Answer, AnswerForm, EntityId } from '@/types/api';
import { apiClient } from './client';

export function getAnswers(questionId: EntityId) {
  return apiClient.get<Answer[]>(`/api/answer/${questionId}`);
}

export function createAnswer(form: AnswerForm) {
  return apiClient.post<Answer[]>('/api/answer/save', form);
}
