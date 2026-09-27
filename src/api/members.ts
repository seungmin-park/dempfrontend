import type { Member, MemberInfo } from '@/types/api';
import { apiClient } from './client';

export function login(form: FormData) {
  return apiClient.post<MemberInfo>('/api/member/login', form);
}

export function register(form: FormData) {
  return apiClient.post<Member>('/api/member/save', form);
}

export function checkUsername(username: string) {
  return apiClient.get<boolean>('/api/member/validUsername', { params: { username } });
}
