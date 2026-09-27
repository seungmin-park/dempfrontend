import type { Language } from '@/types/api';

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
