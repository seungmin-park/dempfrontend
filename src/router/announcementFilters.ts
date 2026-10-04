import { educationFields, durations, validDate } from '@/data/education';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { AnnouncementFilters, Language } from '@/types/api';
import positions from '@/data/positions';
export const languages: Language[] = ['JAVA', 'SPRING', 'JPA', 'React', 'HTML', 'CSS'];
const text = (value: LocationQuery[string] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';
const values = (value: LocationQuery[string] | undefined) => (Array.isArray(value) ? value : [value]).flatMap(part => part?.split(',') ?? []);
const positive = (value: LocationQuery[string] | undefined) => /^\d+$/.test(text(value)) && Number.isSafeInteger(Number(text(value))) && Number(text(value)) <= 2147483647 ? Number(text(value)) : 0;
export function filtersFromQuery(query: LocationQuery = {}): AnnouncementFilters {
  const type = text(query.type);
  const status = text(query.status);
  const tuition = text(query.tuition);
  const education: Partial<AnnouncementFilters> = {};
  if (type === 'EDU') {
    for (const field of educationFields) { const value = text(query[field.key]); if (Object.hasOwn(field.options, value)) education[field.key] = value; }
    if (Object.hasOwn(durations, text(query.duration))) education.duration = text(query.duration);
    for (const key of ['startAfter','startBefore'] as const) if (validDate(text(query[key]))) education[key] = text(query[key]);
  }
  return {
    ...education,
    announcementType: type === 'EMP' || type === 'EDU' ? type : '',
    positions: [...new Set(positions.filter(item => values(query.positions).includes(item)))],
    languages: [...new Set(languages.filter(item => values(query.languages).includes(item)))],
    recruitmentStatus: status === 'OPEN' || status === 'UPCOMING' || status === 'CLOSED' ? status : '',
    tuition: type === 'EDU' && (tuition === 'FREE' || tuition === 'PAID') ? tuition : '',
    career: type === 'EDU' ? 0 : positive(query.career),
    payment: 0,
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
  }
  if (filters.announcementType === 'EDU') {
    for (const field of educationFields) if (filters[field.key]) query[field.key] = filters[field.key];
    for (const key of ['duration','startAfter','startBefore'] as const) if (filters[key]) query[key] = filters[key];
  }
  if (filters.title.trim()) query.q = filters.title.trim();
  return query;
}
