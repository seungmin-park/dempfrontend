import { apiClient } from './client';
import type { Member } from '@/types/api';
export async function fetchAdminIdentity(): Promise<Member> {
  return (await apiClient.get<Member>('/api/admin/me')).data;
}

import type { AnnouncementDetailResponse, AnnouncementForm, AnnouncementSummary, EntityId, Slice } from '@/types/api';
import { toAnnouncementFormData } from './announcements';
export interface AdminOverview { announcements: number; bootcamps: number; questions: number; answers: number; members: number }
export interface AdminPost { id: number; questionId: number; title: string; content: string | null; username: string; hashtags: string[] }
export interface AdminPage<T> extends Slice<T> { totalElements?: number }
export interface AdminMutationResult { cleanupPending: boolean }
export type PostKind = 'questions' | 'answers';
export type CollectionKind = 'announcements' | PostKind;
export const fetchAdminOverview = async () => (await apiClient.get<AdminOverview>('/api/admin/overview')).data;
export const fetchAdminAnnouncements = async (title: string, announcementType: string, page: number) =>
  (await apiClient.get<AdminPage<AnnouncementSummary>>('/api/admin/announcements', { params: { title, announcementType, page } })).data;
export const fetchAdminPosts = async (kind: PostKind, q: string, page: number) =>
  (await apiClient.get<AdminPage<AdminPost>>(`/api/admin/${kind}`, { params: { q, page } })).data;
export const fetchAdminPost = async (kind: PostKind, id: EntityId) => (await apiClient.get<AdminPost>(`/api/admin/${kind}/${id}`)).data;
export const fetchAdminAnnouncement = async (id: EntityId) => (await apiClient.get<AnnouncementDetailResponse>(`/api/admin/announcements/${id}`)).data;
export const saveAdminPost = (kind: PostKind, id: EntityId, title: string, content: string) =>
  apiClient.patch(`/api/admin/${kind}/${id}`, kind === 'questions' ? { title, content } : { content });
export async function saveAdminAnnouncement(id: string | undefined, form: AnnouncementForm): Promise<AdminMutationResult> {
  const body = toAnnouncementFormData(form);
  if (!form.image) body.delete('image');
  return (await (id ? apiClient.patch<AdminMutationResult>(`/api/admin/announcements/${id}`, body)
    : apiClient.post<AdminMutationResult>('/api/admin/announcements', body))).data;
}
export async function deleteAdminItem(kind: CollectionKind, id: number): Promise<AdminMutationResult> {
  const response = await apiClient.delete<AdminMutationResult | undefined>(`/api/admin/${kind}/${id}`);
  return response.data || { cleanupPending: false };
}

export const fetchPublicationHistory = async (id: EntityId) => (await apiClient.get<import('@/types/api').PublicationRevision[]>(`/api/admin/announcements/${id}/history`)).data;
