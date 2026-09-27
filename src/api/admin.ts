import { apiClient } from './client';
import type { Member } from '@/types/api';
export async function fetchAdminIdentity(): Promise<Member> {
  return (await apiClient.get<Member>('/api/admin/me')).data;
}
