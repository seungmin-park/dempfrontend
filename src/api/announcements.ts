import { educationFields } from '@/data/education';
import type { AnnouncementForm, AnnouncementDetailResponse, AnnouncementDetail, AnnouncementSummary, AnnouncementSearchCondition, AnnouncementScroll, EntityId, Slice } from '@/types/api';
import { apiClient } from './client';

export function toAnnouncementFormData(announcement: AnnouncementForm) {
  const form = new FormData();
  const fields = [
    'title', 'company', 'type', 'position', 'minCareer', 'maxCareer',
    'startedDate', 'deadLineDate', 'content', 'accessUrl', 'payment', 'salaryStatus', 'salaryMax',
  ] as const;
  fields.forEach(field => { if (announcement[field] != null && announcement[field] !== '') form.append(field, String(announcement[field])); });
  if (announcement.type === 'EDU') {
    for (const key of [...educationFields.map(field => field.key), 'learningStartDate', 'learningEndDate'] as const) {
      if (announcement[key]) form.append(key, String(announcement[key]));
    }
  }
  const languages = Array.isArray(announcement.language)
    ? announcement.language
    : String(announcement.language || '').split(',').map(value => value.trim()).filter(Boolean);
  languages.forEach(language => form.append('language', language));
  (announcement.bodyImages || []).forEach(image => form.append('bodyImages', image));
  if (announcement.image) form.append('image', announcement.image);
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
      title: condition.title,
      ...(condition.languages?.length ? { languages: condition.languages.join(',') } : {}),
      ...(condition.recruitmentStatus ? { recruitmentStatus: condition.recruitmentStatus } : {}),
      ...(condition.tuition ? { tuition: condition.tuition } : {}),
      ...(condition.announcementType === 'EDU' ? Object.fromEntries(
        [...educationFields.map(field => field.key), 'duration', 'startAfter', 'startBefore'].filter(key => condition[key as keyof AnnouncementSearchCondition]).map(key => [key, condition[key as keyof AnnouncementSearchCondition]])
      ) : {}),
      page: condition.page,
      size: 8,
    },
  });
}

export function getAnnouncementScroll() {
  return apiClient.get<AnnouncementScroll[]>('/api/announce/scroll');
}
