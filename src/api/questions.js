import axios from 'axios';

export function fetchQuestionPage(condition) {
  return axios.get('/api/question', { params: {
    orderBy: condition.orderBy,
    title: condition.title,
    content: condition.content,
    hashtags: condition.hashtags,
    page: condition.page,
    size: condition.size,
  } }).then(response => response.data);
}
