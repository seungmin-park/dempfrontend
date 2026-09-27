import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { AnnouncementFilters, Language } from '@/types/api';
import positions from '@/data/positions';
export const languages: Language[] = ['JAVA', 'SPRING', 'JPA', 'React', 'HTML', 'CSS'];
const text = (value: LocationQuery[string]) => (Array.isArray(value) ? value[0] : value) ?? '';
const values = (value: LocationQuery[string]) => (Array.isArray(value) ? value : [value]).flatMap(part => part?.split(',') ?? []);
const positive = (value: LocationQuery[string]) => /^\d+$/.test(text(value)) && Number.isSafeInteger(Number(text(value))) && Number(text(value)) <= 2147483647 ? Number(text(value)) : 0;
export function filtersFromQuery(query: LocationQuery = {}): AnnouncementFilters {
  const type = text(query.type);
  const status = text(query.status);
  const tuition = text(query.tuition);
  return {
    announcementType: type === 'EMP' || type === 'EDU' ? type : '',
    positions: [...new Set(positions.filter(item => values(query.positions).includes(item)))],
    languages: [...new Set(languages.filter(item => values(query.languages).includes(item)))],
    recruitmentStatus: status === 'OPEN' || status === 'UPCOMING' || status === 'CLOSED' ? status : '',
    tuition: type === 'EDU' && (tuition === 'FREE' || tuition === 'PAID') ? tuition : '',
    career: type === 'EDU' ? 0 : positive(query.career),
    payment: type === 'EDU' ? 0 : positive(query.payment),
    title: text(query.q).trim(),
  };
}
export function filtersToQuery(filters: AnnouncementFilters): LocationQueryRaw {
  const query: LocationQueryRaw = {};
  if (filters.announcementType) query.type = filters.announcementType;
  if (filters.positions.length) query.positions = filters.positions.join(',');
  if (filters.languages?.length) query.languages = filters.languages.join(',');
  if (filters.recruitmentStatus) query.status = filters.recruitmentStatus;
  if (filters.announcementType === 'EDU') { if (filters.tuition) query.tuition = filters.tuition; }
  else {
    if (filters.career) query.career = String(filters.career);
    if (filters.payment) query.payment = String(filters.payment);
  }
  if (filters.title.trim()) query.q = filters.title.trim();
  return query;
}
