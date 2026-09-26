import axios from 'axios';

export function toAnnouncementFormData(announcement) {
  const form = new FormData();
  const fields = [
    'title', 'company', 'type', 'position', 'minCareer', 'maxCareer',
    'startedDate', 'deadLineDate', 'content', 'accessUrl', 'payment',
  ];
  fields.forEach(field => form.append(field, announcement[field]));
  const languages = Array.isArray(announcement.language)
    ? announcement.language
    : String(announcement.language || '').split(',').map(value => value.trim()).filter(Boolean);
  languages.forEach(language => form.append('language', language));
  form.append('image', announcement.image);
  return form;
}

export function createAnnouncement(announcement, token) {
  return axios.post('/api/announce/add', toAnnouncementFormData(announcement), {
    headers: { 'X-AUTH-TOKEN': token },
  });
}

export function toAnnouncementDetail(data) {
  return {
    ...data,
    company: data.company ? data.company.name : '',
    type: data.announcementType,
  };
}

export function getAnnouncementDetail(id, token) {
  return axios.get(`/api/announce/detail/${id}`, {
    headers: { 'X-AUTH-TOKEN': token },
  }).then(response => toAnnouncementDetail(response.data));
}

export function getAnnouncements(condition) {
  return axios.get('/api/announce', {
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
