import { apiClient } from './client';

export function getGithubLoginUrl() {
  return apiClient.get<string>('/api/auth/github');
}
