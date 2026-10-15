import { apiClient } from './client';
import type { AnnouncementSummary, EntityId } from '@/types/api';
export interface BookmarkEntry { announcementId: number; savedAt: string; available: boolean; announcement: AnnouncementSummary | null }
export interface BookmarkPage { content: BookmarkEntry[]; hasNext: boolean; number: number }
export function getBookmarkStatus(ids: readonly EntityId[]) {
  return apiClient.get<{ savedIds: number[] }>('/api/member/me/bookmarks/status', { params: { announcementIds: ids.join(',') } });
}
export function setAnnouncementSaved(id: EntityId, saved: boolean) {
  return apiClient.put<{ announcementId: number; saved: boolean }>(`/api/member/me/bookmarks/${id}`, { saved });
}
export function getBookmarks(page: number) {
  return apiClient.get<BookmarkPage>('/api/member/me/bookmarks', { params: { page, size: 20 } });
}
