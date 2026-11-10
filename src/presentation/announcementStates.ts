import { educationFields, educationLabel } from '@/data/education';
import { formatLanguages } from './announcement';
import { formatPosition } from './positions';
import type { AnnouncementFilters } from '@/types/api';

export function announcementEmptyState(filters: AnnouncementFilters) {
  const education = filters.announcementType === 'EDU';
  const scope = education ? '부트캠프·교육과정' : filters.announcementType === 'EMP' ? '채용 공고' : '공고';
  const subject = scope + (education ? '이' : '가');
  const filtered = Boolean(filters.title.trim() || filters.positions.length || filters.languages?.length || (filters.recruitmentStatus && filters.recruitmentStatus !== 'ACTIVE') || filters.tuition || filters.career || (education && (educationFields.some(field => filters[field.key]) || filters.duration || filters.startAfter || filters.startBefore)));
  if (filtered) return {
    title: filters.title.trim() ? `“${filters.title.trim()}”에 해당하는 ${subject} 없습니다.` : `선택한 조건에 맞는 ${subject} 없습니다.`,
    description: filters.title.trim() ? '검색어의 철자를 확인하거나 더 짧은 단어로 검색해 보세요.' : education ? '수업 방식·지역·일정·교육비 등 선택한 조건을 줄여보세요.' : '직무·기술 스택·경력 등 선택한 조건을 줄여보세요.',
    action: 'reset' as const,
  };
  if (filters.recruitmentStatus === 'ACTIVE') return {
    title: `현재 모집 중이거나 예정된 ${subject} 없습니다.`,
    description: '마감된 공고도 확인할 수 있습니다.',
    action: 'showAll' as const,
  };
  return {
    title: `아직 등록된 ${subject} 없습니다.`,
    description: education ? '전체 공고에서 채용 기회도 둘러보세요.' : filters.announcementType === 'EMP' ? '전체 공고에서 부트캠프·교육과정도 둘러보세요.' : '새 공고가 등록되면 이곳에서 확인할 수 있습니다.',
    action: filters.announcementType ? 'browse' as const : null,
  };
}

export interface RelaxationCandidate { key: string; label: string; filters: AnnouncementFilters }
const statusLabels = { OPEN: '모집 중', UPCOMING: '모집 예정', CLOSED: '모집 마감' } as const;
/** Each candidate drops exactly one condition group so the user's other choices stay intact. */
export function relaxationCandidates(filters: AnnouncementFilters): RelaxationCandidate[] {
  const education = filters.announcementType === 'EDU';
  const candidates: RelaxationCandidate[] = [];
  const add = (key: string, label: string, change: Partial<AnnouncementFilters>, removed: readonly (keyof AnnouncementFilters)[] = []) => {
    const next: AnnouncementFilters = { ...filters, ...change };
    for (const name of removed) delete next[name];
    candidates.push({ key, label, filters: next });
  };
  const title = filters.title.trim();
  if (title) add('title', `검색어 “${title}” 빼고 보기`, { title: '' });
  if (filters.languages?.length) add('languages', `기술 스택(${formatLanguages(filters.languages)}) 빼고 보기`, { languages: [] });
  if (filters.positions.length) add('positions', `직무(${filters.positions.map(formatPosition).join(', ')}) 빼고 보기`, { positions: [] });
  if (!education && filters.career) add('career', `경력 ${filters.career}년 조건 빼고 보기`, { career: 0 });
  if (education) {
    if (filters.tuition) add('tuition', `교육비(${filters.tuition === 'FREE' ? '무료' : '유료'}) 빼고 보기`, { tuition: '' });
    for (const field of educationFields) {
      const value = filters[field.key];
      if (value) add(field.key, `${field.label}(${educationLabel(field.key, value)}) 빼고 보기`, {}, [field.key]);
    }
    if (filters.duration) add('duration', '교육 기간 조건 빼고 보기', {}, ['duration']);
    if (filters.startAfter || filters.startBefore) add('start', '개강일 조건 빼고 보기', {}, ['startAfter', 'startBefore']);
  }
  if (!candidates.length && (filters.recruitmentStatus === 'ACTIVE' || !filters.recruitmentStatus)) return [];
  const status = filters.recruitmentStatus;
  if (status === 'OPEN' || status === 'UPCOMING' || status === 'CLOSED') add('status', `모집 상태(${statusLabels[status]}) 빼고 보기`, { recruitmentStatus: '' });
  else if (status === 'ACTIVE') add('status', '마감된 공고까지 보기', { recruitmentStatus: '' });
  return candidates;
}
