import type { Language, AnnouncementSummary } from '@/types/api';

const languageLabels: Record<Language, string> = {
  HTML: 'HTML', CSS: 'CSS', React: 'React', JAVA: 'Java', JPA: 'JPA', SPRING: 'Spring',
};

export function formatLanguages(languages: readonly Language[] | null | undefined): string {
  return languages?.length ? languages.map(language => languageLabels[language] ?? language).join(', ') : '기술 정보 없음';
}

// The API uses local date/time values; format their parts without a timezone conversion.
export function formatRecruitDate(value: string | null | undefined): string {
  if (!value) return '일정 미정';
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  return parts ? `${parts[1]}.${parts[2]}.${parts[3]} ${parts[4]}:${parts[5]}` : '일정 미정';
}


// A zero maximum is the existing API's unbounded range, not "new graduates only".
export function announcementAudience(item: Pick<AnnouncementSummary, 'announcementType' | 'minCareer' | 'maxCareer' | 'recruitmentAudience'>): { label: string; detail: string; tone: string } {
  if (item.announcementType === 'EDU') return { label: '교육', detail: '', tone: 'education' };
  if (item.recruitmentAudience) {
    const audience = item.recruitmentAudience;
    const label = { NEW: '신입', EXPERIENCED: '경력', ANY: '경력 무관', MIXED: '신입·경력' }[audience];
    const legacy = announcementAudience({ ...item, recruitmentAudience: null });
    const detail = audience === 'EXPERIENCED' || audience === 'MIXED' ? legacy.detail : '';
    return { label, detail, tone: audience === 'EXPERIENCED' ? 'experienced' : audience === 'ANY' ? 'any' : 'entry' };
  }
  const { minCareer: min, maxCareer: max } = item;
  if (min == null || max == null || min < 0 || max < 0 || (max > 0 && min > max)) {
    return { label: '채용', detail: '경력 정보 없음', tone: 'neutral' };
  }
  if (min === 0 && max === 0) return { label: '경력 무관', detail: '', tone: 'any' };
  if (min === 0) return { label: '신입·경력', detail: `${max}년 이하`, tone: 'entry' };
  return { label: '경력', detail: max === 0 ? `${min}년 이상` : min === max ? `${min}년` : `${min}~${max}년`, tone: 'experienced' };
}
