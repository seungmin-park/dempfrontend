import type { AnnouncementFilters } from '@/types/api';

export function announcementEmptyState(filters: AnnouncementFilters) {
  const education = filters.announcementType === 'EDU';
  const scope = education ? '부트캠프·교육과정' : filters.announcementType === 'EMP' ? '채용 공고' : '공고';
  const subject = scope + (education ? '이' : '가');
  const filtered = Boolean(filters.title.trim() || filters.positions.length || filters.languages?.length || filters.recruitmentStatus || filters.tuition || filters.career || filters.payment);
  if (filtered) return {
    title: filters.title.trim() ? `“${filters.title.trim()}”에 해당하는 ${subject} 없습니다.` : `선택한 조건에 맞는 ${subject} 없습니다.`,
    description: filters.title.trim() ? '검색어의 철자를 확인하거나 더 짧은 단어로 검색해 보세요.' : education ? '분야·기술 스택·모집 상태·교육비 조건을 줄여보세요.' : '직무·기술 스택·경력 등 선택한 조건을 줄여보세요.',
    action: 'reset' as const,
  };
  return {
    title: `아직 등록된 ${subject} 없습니다.`,
    description: education ? '전체 공고에서 채용 기회도 둘러보세요.' : filters.announcementType === 'EMP' ? '전체 공고에서 부트캠프·교육과정도 둘러보세요.' : '새 공고가 등록되면 이곳에서 확인할 수 있습니다.',
    action: filters.announcementType ? 'browse' as const : null,
  };
}
