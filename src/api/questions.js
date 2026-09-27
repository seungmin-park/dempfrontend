import { apiClient } from './client';

export function fetchQuestionPage(condition) {
  return apiClient.get('/api/question', { params: {
    orderBy: condition.orderBy,
    title: condition.title,
    content: condition.content,
    hashtags: condition.hashtags,
    page: condition.page,
    size: condition.size,
  } }).then(response => response.data);
}

export function getQuestionDetail(id) {
  return apiClient.get(`/api/question/detail/${id}`);
}

export function getQuestionHashtags() {
  return apiClient.get('/api/question/hashtags');
}

export function createQuestion(payload) {
  return apiClient.post('/api/question/add', payload);
}
