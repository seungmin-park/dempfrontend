import { apiClient } from './client';

export function getGithubLoginUrl() {
  return apiClient.get('/api/auth/github');
}
