import { apiClient } from './client';

export function getAnswers(questionId) {
  return apiClient.get(`/api/answer/${questionId}`);
}

export function createAnswer(form) {
  return apiClient.post('/api/answer/save', form);
}
