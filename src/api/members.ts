import type { Member, MemberInfo } from '@/types/api';
import { apiClient } from './client';

export function login(form: FormData) {
  return apiClient.post<MemberInfo>('/api/member/login', form);
}

export function getLoginRateLimit(error: unknown): { retryAfterSeconds: number | null } | null {
  if (typeof error !== 'object' || error === null || !('response' in error)
    || typeof error.response !== 'object' || error.response === null
    || !('status' in error.response) || error.response.status !== 429) return null;
  const response = error.response;
  let value: unknown;
  if ('headers' in response && typeof response.headers === 'object' && response.headers !== null
    && 'retry-after' in response.headers) value = response.headers['retry-after'];
  const seconds = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  return { retryAfterSeconds: Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null };
}

export function register(form: FormData) {
  return apiClient.post<Member>('/api/member/save', form);
}

export function checkUsername(username: string) {
  return apiClient.get<boolean>('/api/member/validUsername', { params: { username } });
}
