import { apiClient } from './client';
import type { EntityId, Slice } from '@/types/api';
export interface AnnouncementReport { id: number; announcementId: number; title: string; message: string; reporter: string; createdAt: string; resolution?: string; resolvedBy?: string; resolvedAt?: string }
export const submitAnnouncementReport = (id: EntityId, message: string) => apiClient.post(`/api/announce/${id}/reports`, { message });
export const getAnnouncementReports = async (all: boolean, page: number) => (await apiClient.get<Slice<AnnouncementReport>>('/api/admin/announcement-reports', { params: { all, page } })).data;
export const resolveAnnouncementReport = (id: number, note: string) => apiClient.patch(`/api/admin/announcement-reports/${id}`, { note });
