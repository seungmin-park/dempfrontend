import { apiClient } from './client';

export function login(form) {
  return apiClient.post('/api/member/login', form);
}

export function register(form) {
  return apiClient.post('/api/member/save', form);
}

export function checkUsername(username) {
  return apiClient.get('/api/member/validUsername', { params: { username } });
}
