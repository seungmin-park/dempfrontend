import type { AnnouncementForm, AnnouncementDetailResponse, AnnouncementDetail, AnnouncementSummary, AnnouncementSearchCondition, AnnouncementScroll, EntityId, Slice } from '@/types/api';
import { apiClient } from './client';

export function toAnnouncementFormData(announcement: AnnouncementForm) {
  const form = new FormData();
  const fields = [
    'title', 'company', 'type', 'position', 'minCareer', 'maxCareer',
    'startedDate', 'deadLineDate', 'content', 'accessUrl', 'payment',
  ] as const;
  fields.forEach(field => form.append(field, String(announcement[field])));
  const languages = Array.isArray(announcement.language)
    ? announcement.language
    : String(announcement.language || '').split(',').map(value => value.trim()).filter(Boolean);
  languages.forEach(language => form.append('language', language));
  form.append('image', announcement.image ?? 'null');
  return form;
}

export function createAnnouncement(announcement: AnnouncementForm) {
  return apiClient.post('/api/announce/add', toAnnouncementFormData(announcement));
}

export function toAnnouncementDetail(data: AnnouncementDetailResponse): AnnouncementDetail {
  return {
    ...data,
    company: data.company?.name ?? '',
    type: data.announcementType,
  };
}

export function getAnnouncementDetail(id: EntityId) {
  return apiClient.get<AnnouncementDetailResponse>(`/api/announce/detail/${id}`).then(response => toAnnouncementDetail(response.data));
}

export function getAnnouncements(condition: AnnouncementSearchCondition) {
  return apiClient.get<Slice<AnnouncementSummary>>('/api/announce', {
    params: {
      announcementType: condition.announcementType,
      positions: condition.positions.join(','),
      career: condition.career,
      payment: condition.payment,
      title: condition.title,
      page: condition.page,
      size: 8,
    },
  });
}

export function getAnnouncementScroll() {
  return apiClient.get<AnnouncementScroll[]>('/api/announce/scroll');
}
